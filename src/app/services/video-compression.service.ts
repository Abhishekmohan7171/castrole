import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

@Injectable({
  providedIn: 'root'
})
export class VideoCompressionService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {}

  /**
   * Load FFmpeg.wasm instance (lazy loaded, singleton)
   * Uses CDN for FFmpeg core files
   */
  async loadFFmpeg(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded && this.ffmpeg) {
      return;
    }

    // If currently loading, return existing promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Check browser compatibility first
    if (!this.isBrowserSupported()) {
      throw new Error('Your browser does not support video compression (SharedArrayBuffer not available). Please use the latest version of Chrome, Firefox, Safari, or Edge.');
    }

    // Start loading
    this.loadingPromise = (async () => {
      try {
        this.ffmpeg = new FFmpeg();

        // Load FFmpeg core from CDN
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

        await this.ffmpeg.load({
          coreURL,
          wasmURL,
        });

        this.isLoaded = true;
      } catch (error: any) {
        this.ffmpeg = null;
        this.isLoaded = false;
        this.loadingPromise = null;
        throw new Error(`Failed to load FFmpeg: ${error.message}. Please check your internet connection and browser compatibility.`);
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Get video duration using HTMLVideoElement
   * @param file Video file
   * @returns Promise<number> Duration in seconds
   */
  async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        // Clean up
        window.URL.revokeObjectURL(video.src);

        // Check if duration is valid
        if (isNaN(video.duration) || !isFinite(video.duration)) {
          reject(new Error('Unable to read video duration'));
          return;
        }

        resolve(video.duration);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };

      // Create blob URL and set as source
      video.src = window.URL.createObjectURL(file);
    });
  }

  /**
   * Compress video using FFmpeg.wasm
   * Settings: 1080p max, H.264 codec, adaptive bitrate targeting <100MB for 2min videos
   * Target: ~6.5 Mbps video bitrate for 2-minute videos to stay under 100MB
   * @param file Video file to compress
   * @param onProgress Progress callback (0-100)
   * @returns Promise<Blob> Compressed video as Blob
   */
  async compressVideo(
    file: File,
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    try {
      // Load FFmpeg if not already loaded
      await this.loadFFmpeg();

      if (!this.ffmpeg) {
        throw new Error('FFmpeg not initialized');
      }

      // Get video duration to calculate optimal bitrate
      const duration = await this.getVideoDuration(file);
      
      // Calculate target bitrate to stay under 100MB
      // Formula: (target_size_MB * 8 * 1024) / duration_seconds = total_bitrate_kbps
      // Reserve 128kbps for audio, rest for video
      const targetSizeMB = 95; // Target 95MB to leave safety margin
      const totalBitrateKbps = Math.floor((targetSizeMB * 8 * 1024) / duration);
      const audioBitrateKbps = 128;
      const videoBitrateKbps = Math.max(totalBitrateKbps - audioBitrateKbps, 3000); // Min 3Mbps for quality

      // Set up progress tracking
      this.ffmpeg.on('progress', ({ progress }) => {
        const percentage = Math.min(Math.max(progress * 100, 0), 100);
        onProgress(percentage);
      });

      // Write input file to FFmpeg virtual filesystem
      const inputFileName = 'input.mp4';
      const outputFileName = 'output.mp4';

      // Read file as ArrayBuffer to avoid CORS issues
      const fileData = await file.arrayBuffer();
      await this.ffmpeg.writeFile(inputFileName, new Uint8Array(fileData));

      // Execute FFmpeg compression command
      // -i input: Input file
      // -vf scale: Scale video to max 1080p while maintaining aspect ratio
      // -c:v libx264: Use H.264 video codec
      // -b:v: Target video bitrate (calculated to stay under 100MB)
      // -maxrate: Maximum bitrate (1.5x target for quality peaks)
      // -bufsize: Buffer size for rate control
      // -preset medium: Encoding speed/compression ratio
      // -profile:v high: H.264 high profile for better compression
      // -level 4.1: H.264 level for 1080p compatibility
      // -c:a aac: Use AAC audio codec
      // -b:a 128k: Audio bitrate 128kbps
      // -movflags +faststart: Optimize for web streaming
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-vf', "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
        '-c:v', 'libx264',
        '-b:v', `${videoBitrateKbps}k`,
        '-maxrate', `${Math.floor(videoBitrateKbps * 1.5)}k`,
        '-bufsize', `${videoBitrateKbps * 2}k`,
        '-preset', 'medium',
        '-profile:v', 'high',
        '-level', '4.1',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputFileName
      ]);

      // Read output file from virtual filesystem
      const data = await this.ffmpeg.readFile(outputFileName);

      // Clean up virtual filesystem
      try {
        await this.ffmpeg.deleteFile(inputFileName);
        await this.ffmpeg.deleteFile(outputFileName);
      } catch (error) {
        // Cleanup errors are non-critical
      }

      // Convert to Blob
      const uint8Array = new Uint8Array(data as Uint8Array);
      const blob = new Blob([uint8Array], { type: 'video/mp4' });

      // Verify output size is under 100MB
      const outputSizeMB = blob.size / (1024 * 1024);
      if (outputSizeMB > 100) {
        throw new Error(`Compressed video (${outputSizeMB.toFixed(1)}MB) exceeds 100MB limit. Please try a shorter video.`);
      }

      // Final progress update
      onProgress(100);

      return blob;
    } catch (error: any) {
      // Provide user-friendly error messages
      if (error.message?.includes('out of memory')) {
        throw new Error('Video file is too large to compress in browser. Please try a shorter video.');
      } else if (error.message?.includes('Invalid data')) {
        throw new Error('Video file appears to be corrupt or in an unsupported format.');
      } else if (error.message?.includes('exceeds 100MB')) {
        throw error; // Pass through size limit errors
      } else {
        throw new Error(`Video compression failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Clean up FFmpeg instance and virtual filesystem
   */
  async cleanupFFmpeg(): Promise<void> {
    if (this.ffmpeg && this.isLoaded) {
      try {
        // FFmpeg.wasm doesn't have a terminate method in v0.12
        // Just set references to null and let garbage collection handle it
        this.ffmpeg = null;
        this.isLoaded = false;
        this.loadingPromise = null;
      } catch (error) {
        // Cleanup errors are non-critical
      }
    }
  }

  /**
   * Check if browser supports FFmpeg.wasm (requires SharedArrayBuffer)
   */
  isBrowserSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined';
  }
}
