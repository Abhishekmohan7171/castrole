import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
      console.log('[VideoCompressionService] FFmpeg already loaded');
      return;
    }

    // If currently loading, return existing promise
    if (this.loadingPromise) {
      console.log('[VideoCompressionService] FFmpeg loading in progress...');
      return this.loadingPromise;
    }

    // Check browser compatibility first
    if (!this.isBrowserSupported()) {
      throw new Error('Your browser does not support video compression (SharedArrayBuffer not available). Please use the latest version of Chrome, Firefox, Safari, or Edge.');
    }

    // Start loading
    this.loadingPromise = (async () => {
      try {
        console.log('[VideoCompressionService] Starting FFmpeg initialization...');
        this.ffmpeg = new FFmpeg();

        // Set up logging for debugging
        this.ffmpeg.on('log', ({ message }) => {
          console.log('[FFmpeg]', message);
        });

        // Load FFmpeg core from CDN
        console.log('[VideoCompressionService] Loading FFmpeg core from CDN...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        console.log('[VideoCompressionService] Core JS loaded');

        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        console.log('[VideoCompressionService] WASM loaded');

        await this.ffmpeg.load({
          coreURL,
          wasmURL,
        });

        this.isLoaded = true;
        console.log('[VideoCompressionService] FFmpeg loaded successfully!');
      } catch (error: any) {
        console.error('[VideoCompressionService] Failed to load FFmpeg:', error);
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
   * Settings: 720p max, H.264 codec, CRF 23, AAC audio 128kbps
   * @param file Video file to compress
   * @param onProgress Progress callback (0-100)
   * @returns Promise<Blob> Compressed video as Blob
   */
  async compressVideo(
    file: File,
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    try {
      console.log('[VideoCompressionService] Starting compression for:', file.name, 'Size:', file.size);

      // Load FFmpeg if not already loaded
      console.log('[VideoCompressionService] Loading FFmpeg...');
      await this.loadFFmpeg();

      if (!this.ffmpeg) {
        throw new Error('FFmpeg not initialized');
      }

      console.log('[VideoCompressionService] FFmpeg ready, setting up progress tracking...');

      // Set up progress tracking
      this.ffmpeg.on('progress', ({ progress }) => {
        // FFmpeg progress is 0-1, convert to 0-100
        const percentage = Math.min(Math.max(progress * 100, 0), 100);
        console.log('[VideoCompressionService] Compression progress:', percentage.toFixed(1) + '%');
        onProgress(percentage);
      });

      // Write input file to FFmpeg virtual filesystem
      const inputFileName = 'input.mp4';
      const outputFileName = 'output.mp4';

      console.log('[VideoCompressionService] Writing file to virtual filesystem...');
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(file));
      console.log('[VideoCompressionService] File written, starting compression...');

      // Execute FFmpeg compression command
      // -i input: Input file
      // -vf scale: Scale video to max 720p while maintaining aspect ratio
      // -c:v libx264: Use H.264 video codec
      // -crf 23: Constant Rate Factor (quality, lower = better, 23 is good balance)
      // -preset medium: Encoding speed/compression ratio (medium is balanced)
      // -c:a aac: Use AAC audio codec
      // -b:a 128k: Audio bitrate 128kbps
      // -movflags +faststart: Optimize for web streaming
      console.log('[VideoCompressionService] Executing FFmpeg command...');
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-vf', "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
        '-c:v', 'libx264',
        '-crf', '23',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputFileName
      ]);

      console.log('[VideoCompressionService] Compression complete, reading output file...');
      // Read output file from virtual filesystem
      const data = await this.ffmpeg.readFile(outputFileName);

      // Clean up virtual filesystem
      try {
        await this.ffmpeg.deleteFile(inputFileName);
        await this.ffmpeg.deleteFile(outputFileName);
      } catch (error) {
        console.warn('[VideoCompressionService] Failed to clean up files:', error);
      }

      // Convert FileData (Uint8Array) to standard Uint8Array, then to Blob
      // This ensures compatibility with Blob constructor which expects ArrayBuffer
      const uint8Array = new Uint8Array(data as Uint8Array);
      const blob = new Blob([uint8Array], { type: 'video/mp4' });

      // Final progress update
      onProgress(100);

      return blob;
    } catch (error: any) {
      console.error('[VideoCompressionService] Compression failed:', error);

      // Provide user-friendly error messages
      if (error.message?.includes('out of memory')) {
        throw new Error('Video file is too large to compress in browser. Please try a shorter video.');
      } else if (error.message?.includes('Invalid data')) {
        throw new Error('Video file appears to be corrupt or in an unsupported format.');
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
        console.log('[VideoCompressionService] FFmpeg cleaned up');
      } catch (error) {
        console.warn('[VideoCompressionService] Cleanup error:', error);
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
