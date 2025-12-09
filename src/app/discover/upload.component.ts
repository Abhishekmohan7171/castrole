import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadService } from '../services/upload.service';
import { VideoCompressionService } from '../services/video-compression.service';
import { UploadProgress } from '../../assets/interfaces/interfaces';

interface Tag {
  id: string;
  name: string;
}

@Component({
  selector: 'app-discover-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="text-neutral-400 max-w-6xl mx-auto p-6">
      <!-- Upload Type Toggle -->
      <div class="flex items-center gap-4 mb-8">
        <button 
          (click)="uploadType.set('video')"
          [class]="uploadType() === 'video' ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'"
          class="px-6 py-2 rounded-lg font-medium transition-colors">
          Video
        </button>
        <button 
          (click)="uploadType.set('image')"
          [class]="uploadType() === 'image' ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'"
          class="px-6 py-2 rounded-lg font-medium transition-colors">
          Images
        </button>
      </div>

      <!-- Video Upload Interface -->
      @if (uploadType() === 'video') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Video Preview Area -->
          <div class="space-y-4">
            <div class="relative bg-gradient-to-br from-green-600 to-green-800 rounded-xl aspect-video flex items-center justify-center">
              @if (selectedVideoFile()) {
                <video 
                  [src]="videoPreviewUrl()" 
                  class="w-full h-full object-cover rounded-xl"
                  controls>
                </video>
              } @else {
                <div class="text-center">
                  <div class="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <p class="text-white/80">Upload a video to preview</p>
                </div>
              }
              
              <!-- Edit Cover Button -->
              <button 
                class="absolute bottom-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg text-sm hover:bg-black/70 transition-colors"
                (click)="editCover()">
                edit cover
              </button>
            </div>

            <!-- Video File Input -->
            <div class="relative">
              <input 
                type="file" 
                accept="video/*" 
                (change)="onVideoFileSelected($event)"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="video-upload">
              <label 
                for="video-upload"
                class="block w-full p-4 border-2 border-dashed border-neutral-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors">
                @if (selectedVideoFile()) {
                  <p class="text-neutral-300">{{ selectedVideoFile()?.name }}</p>
                  <p class="text-sm text-neutral-500 mt-1">Click to change video</p>
                } @else {
                  <p class="text-neutral-300">Click to select video file</p>
                  <p class="text-sm text-neutral-500 mt-1">MP4, MOV, AVI supported (max 2 minutes)</p>
                }
              </label>
            </div>
          </div>

          <!-- Video Metadata Form -->
          <div class="space-y-6">
            <!-- Tags Section -->
            <div>
              <label class="block text-sm font-medium text-neutral-300 mb-3">Tags</label>
              <div class="flex flex-wrap gap-2 mb-3">
                @for (tag of tags(); track tag.id) {
                  <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {{ tag.name }}
                    <button 
                      (click)="removeTag(tag.id)"
                      class="hover:bg-purple-700 rounded-full p-0.5">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </span>
                }
                <button 
                  (click)="showTagInput.set(true)"
                  class="w-8 h-8 bg-neutral-700 hover:bg-neutral-600 rounded-full flex items-center justify-center transition-colors">
                  <svg class="w-4 h-4 text-neutral-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
              
              @if (showTagInput()) {
                <div class="flex gap-2">
                  <input 
                    [(ngModel)]="newTagName"
                    (keyup.enter)="addTag()"
                    placeholder="Enter tag name"
                    class="flex-1 bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500">
                  <button 
                    (click)="addTag()"
                    class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Add
                  </button>
                  <button 
                    (click)="cancelTagInput()"
                    class="bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-4 py-2 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              }
            </div>

            <!-- Media Type -->
            <div>
              <label class="block text-sm font-medium text-neutral-300 mb-3">Media Type</label>
              <select 
                [(ngModel)]="mediaType"
                class="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-purple-500">
                <option value="reel">Reel</option>
                <option value="short">Short Film</option>
                <option value="scene">Scene</option>
                <option value="audition">Audition Tape</option>
                <option value="showreel">Showreel</option>
              </select>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-neutral-300 mb-3">Description</label>
              <textarea
                [(ngModel)]="description"
                placeholder="Describe your video..."
                rows="4"
                class="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none">
              </textarea>
            </div>

            <!-- Video Duration Display -->
            @if (videoDuration() > 0) {
              <div class="text-sm text-neutral-400 space-y-1">
                <div class="flex items-center justify-between">
                  <span>Duration: {{ formatDuration(videoDuration()) }}</span>
                  @if (compressedVideoSize() > 0) {
                    <span class="text-green-400">Size reduction: {{ formatSizeReduction() }}</span>
                  }
                </div>
              </div>
            }

            <!-- Upload Progress -->
            @if (isUploading() && !uploadSuccess()) {
              <div class="space-y-3">
                @if (isCompressing()) {
                  <!-- Compression Progress -->
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm text-neutral-300">
                      <span>Compressing video...</span>
                      <span>{{ compressionProgress().toFixed(0) }}%</span>
                    </div>
                    <div class="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                      <div
                        class="bg-blue-600 h-full transition-all duration-500"
                        [style.width.%]="compressionProgress()">
                      </div>
                    </div>
                  </div>
                }

                <!-- Overall Progress -->
                <div class="space-y-2">
                  <div class="flex justify-between text-sm text-neutral-300">
                    <span>{{ uploadStatusText() }}</span>
                    <span>{{ uploadProgress().toFixed(0) }}%</span>
                  </div>
                  <div class="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <div
                      [class]="uploadProgress() === 100 ? 'bg-green-500' : 'bg-purple-600'"
                      class="h-full transition-all duration-500"
                      [style.width.%]="uploadProgress()">
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Error Message -->
            @if (uploadError()) {
              <div class="bg-red-500/10 border border-red-500 rounded-lg p-3">
                <p class="text-red-400 text-sm">{{ uploadError() }}</p>
              </div>
            }

            <!-- Success Message -->
            @if (uploadSuccess()) {
              <div class="bg-green-500/10 border border-green-500 rounded-lg p-3 space-y-3">
                <p class="text-green-400 text-sm">✓ Video uploaded successfully!</p>
                <button 
                  (click)="resetVideoForm()"
                  class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Upload Another Video
                </button>
              </div>
            }

            <!-- Upload Button -->
            @if (!uploadSuccess() && !isUploading()) {
              <button 
                (click)="uploadVideo()"
                [disabled]="!canUploadVideo()"
                [class]="canUploadVideo() ? 'bg-purple-600 hover:bg-purple-700' : 'bg-neutral-700 cursor-not-allowed'"
                class="w-full text-white py-3 rounded-lg font-medium transition-colors">
                <span>Upload Video</span>
              </button>
            }
            
            <!-- Upload Progress Button (Disabled) -->
            @if (!uploadSuccess() && isUploading()) {
              <button 
                disabled
                class="w-full text-white py-3 rounded-lg font-medium transition-colors bg-neutral-700 cursor-not-allowed">
                <span>{{ uploadStatusText() }}</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- Image Upload Interface -->
      @if (uploadType() === 'image') {
        <div class="max-w-2xl mx-auto">
          <div 
            class="relative border-2 border-dashed border-neutral-600 rounded-xl p-12 text-center hover:border-purple-500 transition-colors"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onImageDrop($event)"
            [class.border-purple-500]="isDragOver()">
            
            @if (selectedImages().length > 0) {
              <!-- Image Preview Grid with Descriptions -->
              <div class="grid grid-cols-1 gap-6 mb-6">
                @for (image of selectedImages(); track image.name) {
                  <div class="space-y-3">
                    <!-- Image Preview -->
                    <div class="relative group">
                      <img
                        [src]="getImagePreview(image)"
                        [alt]="image.name"
                        class="w-full h-64 object-cover rounded-lg">
                      <button
                        (click)="removeImage(image)"
                        class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                      <div class="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {{ formatFileSize(image.size) }}
                      </div>
                    </div>

                    <!-- Image Description -->
                    <div>
                      <label class="block text-sm font-medium text-neutral-300 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        [value]="getImageDescription(image)"
                        (input)="updateImageDescription(image, $event)"
                        placeholder="Describe this image..."
                        rows="3"
                        class="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none">
                      </textarea>
                    </div>
                  </div>
                }
              </div>

              <p class="text-neutral-300 mb-2">{{ selectedImages().length }} image(s) selected</p>
              <p class="text-sm text-neutral-500 mb-6">Click to add more images or drag and drop</p>
            } @else {
              <!-- Empty State -->
              <div class="mb-6">
                <div class="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <h3 class="text-xl text-neutral-200 mb-2">Click or drag files to upload</h3>
                <p class="text-neutral-500">PNG, JPG, JPEG up to 10MB each</p>
              </div>
            }

            <!-- File Input -->
            <input 
              type="file" 
              accept="image/*" 
              multiple
              (change)="onImageFileSelected($event)"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="image-upload">
          </div>

          @if (selectedImages().length > 0) {
            <!-- Image Upload Progress -->
            @if (isUploading() && imageUploadProgress().length > 0 && !uploadSuccess()) {
              <div class="mt-6 space-y-4">
                <!-- Overall Progress -->
                <div class="space-y-2">
                  <div class="flex justify-between text-sm text-neutral-300">
                    <span>{{ uploadStatusText() }}</span>
                    <span>{{ overallImageProgress().toFixed(0) }}%</span>
                  </div>
                  <div class="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <div 
                      [class]="allImagesCompleted() && !hasImageErrors() ? 'bg-green-500' : hasImageErrors() ? 'bg-red-500' : 'bg-purple-600'"
                      class="h-full transition-all duration-500"
                      [style.width.%]="overallImageProgress()">
                    </div>
                  </div>
                </div>
                
                <!-- Individual Progress -->
                <p class="text-xs font-medium text-neutral-400">Individual Progress</p>
                @for (progress of imageUploadProgress(); track $index) {
                  <div class="space-y-1">
                    <div class="flex justify-between text-xs text-neutral-400">
                      <span>Image {{ $index + 1 }}</span>
                      @if (progress.error) {
                        <span class="text-red-400">Failed</span>
                      } @else {
                        <span>{{ progress.progress.toFixed(0) }}%</span>
                      }
                    </div>
                    <div class="w-full bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        [class]="progress.error ? 'bg-red-500' : 'bg-purple-600'"
                        class="h-full transition-all duration-300"
                        [style.width.%]="progress.progress">
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Error Message -->
            @if (uploadError()) {
              <div class="mt-4 bg-red-500/10 border border-red-500 rounded-lg p-3">
                <p class="text-red-400 text-sm">{{ uploadError() }}</p>
              </div>
            }

            <!-- Success Message -->
            @if (uploadSuccess()) {
              <div class="mt-4 bg-green-500/10 border border-green-500 rounded-lg p-3 space-y-3">
                <p class="text-green-400 text-sm">✓ All images uploaded successfully!</p>
                <button 
                  (click)="resetImageForm()"
                  class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Upload More Images
                </button>
              </div>
            }

            <!-- Upload Button -->
            @if (!uploadSuccess()) {
              <button 
                (click)="uploadImages()"
                [disabled]="!canUploadImages() || isUploading()"
                [class]="canUploadImages() && !isUploading() ? 'bg-purple-600 hover:bg-purple-700' : 'bg-neutral-700 cursor-not-allowed'"
                class="w-full text-white py-3 rounded-lg font-medium mt-6 transition-colors">
                @if (isUploading()) {
                  <span>{{ uploadStatusText() }}</span>
                } @else {
                  <span>Upload {{ selectedImages().length }} Image(s)</span>
                }
              </button>
            }
          }
        </div>
      }
    </section>
  `,
  styles: []
})
export class UploadComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private returnUrl = signal<string | null>(null);
  
  uploadType = signal<'video' | 'image'>('video');
  
  // Video upload state
  selectedVideoFile = signal<File | null>(null);
  videoPreviewUrl = signal<string>('');
  tags = signal<Tag[]>([]);
  showTagInput = signal(false);
  newTagName = signal('');
  mediaType = signal('reel');
  description = signal('');
  
  // Image upload state
  selectedImages = signal<File[]>([]);
  isDragOver = signal(false);
  imagePreviewUrls = new Map<string, string>();
  imageDescriptions = new Map<string, string>();

  // Upload state
  uploadService = inject(UploadService);
  videoCompressionService = inject(VideoCompressionService);
  isUploading = signal(false);
  uploadProgress = signal<number>(0);
  uploadError = signal<string>('');
  uploadSuccess = signal(false);
  imageUploadProgress = signal<UploadProgress[]>([]);

  // Video compression state
  compressionProgress = signal<number>(0);
  isCompressing = signal<boolean>(false);
  compressionError = signal<string>('');
  videoDuration = signal<number>(0);
  originalVideoSize = signal<number>(0);
  compressedVideoSize = signal<number>(0);

  canUploadVideo = computed(() => {
    return this.selectedVideoFile() !== null &&
           this.description().trim().length > 0 &&
           this.videoDuration() > 0 &&
           this.videoDuration() <= 120; // 2 minutes in seconds
  });

  canUploadImages = computed(() => {
    return this.selectedImages().length > 0;
  });

  // Computed for overall upload progress
  overallImageProgress = computed(() => {
    const progress = this.imageUploadProgress();
    if (progress.length === 0) return 0;
    
    const totalProgress = progress.reduce((sum, p) => sum + p.progress, 0);
    return totalProgress / progress.length;
  });

  // Computed for upload completion status
  allImagesCompleted = computed(() => {
    const progress = this.imageUploadProgress();
    return progress.length > 0 && progress.every(p => p.progress === 100 || p.error);
  });

  hasImageErrors = computed(() => {
    return this.imageUploadProgress().some(p => p.error);
  });

  uploadStatusText = computed(() => {
    if (!this.isUploading()) return '';

    if (this.uploadType() === 'video') {
      if (this.isCompressing()) {
        const compressionProg = this.compressionProgress();
        return `Compressing video... ${compressionProg.toFixed(0)}%`;
      }

      const progress = this.uploadProgress();
      if (progress >= 99.5) return 'Upload complete!';
      if (progress > 90) return 'Finalizing upload...';
      if (progress >= 50) return `Uploading video... ${((progress - 50) * 2).toFixed(0)}%`;
      return `Preparing upload... ${progress.toFixed(0)}%`;
    } else {
      const progress = this.overallImageProgress();
      if (this.allImagesCompleted()) {
        return this.hasImageErrors() ? 'Some uploads failed' : 'Upload complete!';
      }
      if (progress > 90) return 'Finalizing upload...';
      return `Uploading images... ${progress.toFixed(0)}%`;
    }
  });

  ngOnInit() {
    // Check for returnUrl query param
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl.set(params['returnUrl']);
        // Set upload type to image if coming from profile
        this.uploadType.set('image');
      }
    });
  }

  async onVideoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Reset previous state
      this.uploadError.set('');
      this.videoDuration.set(0);

      // Validate file type first
      if (!this.uploadService.validateFileType(file, ['video/'])) {
        this.uploadError.set('Invalid file type. Please upload a video file.');
        return;
      }

      // Validate video duration (2 minutes max)
      try {
        const validation = await this.uploadService.validateVideoDuration(file, 2);

        if (!validation.valid) {
          this.uploadError.set(validation.error || 'Video validation failed');
          return;
        }

        this.videoDuration.set(validation.duration || 0);
        this.originalVideoSize.set(file.size);
        this.selectedVideoFile.set(file);

        // Create preview URL
        const url = URL.createObjectURL(file);
        this.videoPreviewUrl.set(url);
      } catch (error: any) {
        this.uploadError.set(`Failed to validate video: ${error.message}`);
      }
    }
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.addImages(newFiles);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    
    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      this.addImages(files);
    }
  }

  addImages(files: File[]): void {
    const currentImages = this.selectedImages();
    const newImages = [...currentImages, ...files];
    this.selectedImages.set(newImages);

    // Create preview URLs
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      this.imagePreviewUrls.set(file.name, url);
    });
  }

  removeImage(fileToRemove: File): void {
    const currentImages = this.selectedImages();
    const updatedImages = currentImages.filter(file => file !== fileToRemove);
    this.selectedImages.set(updatedImages);

    // Clean up preview URL
    const url = this.imagePreviewUrls.get(fileToRemove.name);
    if (url) {
      URL.revokeObjectURL(url);
      this.imagePreviewUrls.delete(fileToRemove.name);
    }

    // Clean up description
    this.imageDescriptions.delete(fileToRemove.name);
  }

  getImagePreview(file: File): string {
    return this.imagePreviewUrls.get(file.name) || '';
  }

  /**
   * Get description for an image
   */
  getImageDescription(file: File): string {
    return this.imageDescriptions.get(file.name) || '';
  }

  /**
   * Update description for an image
   */
  updateImageDescription(file: File, event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.imageDescriptions.set(file.name, textarea.value);
  }

  addTag(): void {
    if (this.newTagName().trim()) {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: this.newTagName().trim()
      };
      
      const currentTags = this.tags();
      this.tags.set([...currentTags, newTag]);
      this.newTagName.set('');
      this.showTagInput.set(false);
    }
  }

  removeTag(tagId: string): void {
    const currentTags = this.tags();
    const updatedTags = currentTags.filter(tag => tag.id !== tagId);
    this.tags.set(updatedTags);
  }

  cancelTagInput(): void {
    this.newTagName.set('');
    this.showTagInput.set(false);
  }

  editCover(): void {
    // TODO: Implement cover editing functionality
    // Will allow users to select a custom thumbnail from the video
  }

  async uploadVideo(): Promise<void> {
    if (!this.canUploadVideo()) return;

    const file = this.selectedVideoFile();
    if (!file) return;

    // Reset state
    this.uploadError.set('');
    this.uploadSuccess.set(false);
    this.compressionError.set('');

    // Check browser compatibility
    if (!this.videoCompressionService.isBrowserSupported()) {
      this.uploadError.set('Your browser does not support video compression. Please use the latest version of Chrome, Firefox, Safari, or Edge with secure context (HTTPS).');
      return;
    }

    try {
      // Phase 1: Compression (0-50% of overall progress)
      this.isCompressing.set(true);
      this.isUploading.set(true);
      this.uploadProgress.set(0);

      console.log('[UploadComponent] Starting video compression...');

      const compressedBlob = await this.videoCompressionService.compressVideo(
        file,
        (compressionProgress) => {
          console.log('[UploadComponent] Compression progress callback:', compressionProgress);
          this.compressionProgress.set(compressionProgress);
          // Map compression to first 50% of overall progress
          const overallProgress = (compressionProgress / 2);
          this.animateProgress(this.uploadProgress(), overallProgress);
        }
      );

      console.log('[UploadComponent] Compression complete! Compressed size:', compressedBlob.size);

      this.isCompressing.set(false);
      this.compressedVideoSize.set(compressedBlob.size);

      // Convert Blob to File for upload
      const compressedFile = new File(
        [compressedBlob],
        file.name,
        { type: 'video/mp4' }
      );

      // Phase 2: Upload (50-100% of overall progress)
      const metadata = {
        tags: this.tags().map(tag => tag.name),
        mediaType: this.mediaType(),
        description: this.description(),
        duration: this.videoDuration(),
        compressed: true,
        originalSize: this.originalVideoSize(),
        compressedSize: compressedBlob.size
      };

      this.uploadService.uploadVideo(compressedFile, metadata).subscribe({
        next: (progress: UploadProgress) => {
          // Map upload progress to second 50% of overall progress
          const overallProgress = 50 + (progress.progress / 2);

          const currentProgress = this.uploadProgress();
          if (overallProgress > currentProgress) {
            this.animateProgress(currentProgress, overallProgress);
          }

          if (progress.url) {
            this.uploadProgress.set(100);

            setTimeout(() => {
              this.isUploading.set(false);
              this.uploadSuccess.set(true);
            }, 500);
          }
        },
        error: (error: any) => {
          this.uploadError.set(error.error || 'Upload failed. Please try again.');
          this.isUploading.set(false);
          this.isCompressing.set(false);
        },
        complete: () => {
          // Observable completed
        }
      });

    } catch (error: any) {
      this.compressionError.set(error.message || 'Compression failed. Please try again.');
      this.uploadError.set('Video compression failed. Please try a different video or try again.');
      this.isUploading.set(false);
      this.isCompressing.set(false);
    }
  }

  uploadImages(): void {
    const images = this.selectedImages();
    if (images.length === 0) return;

    // Validate all images
    for (const file of images) {
      // Validate file size (10MB max per image)
      if (!this.uploadService.validateFileSize(file, 10)) {
        this.uploadError.set(`Image ${file.name} exceeds 10MB limit`);
        return;
      }

      // Validate file type
      if (!this.uploadService.validateFileType(file, ['image/'])) {
        this.uploadError.set(`${file.name} is not a valid image file`);
        return;
      }
    }

    this.isUploading.set(true);
    this.uploadError.set('');
    this.uploadSuccess.set(false);
    this.imageUploadProgress.set([]);

    // Create metadata with descriptions for all images
    // Note: The uploadService.uploadImages takes a single metadata object for all images
    // We'll need to handle each image separately to include individual descriptions
    this.uploadImagesWithDescriptions(images);
  }

  /**
   * Upload images with individual descriptions
   */
  private uploadImagesWithDescriptions(files: File[]): void {
    const uploadProgress: UploadProgress[] = files.map(() => ({ progress: 0 }));
    let completedUploads = 0;

    files.forEach((file, index) => {
      const description = this.imageDescriptions.get(file.name) || undefined;
      const metadata = {
        description,
        tags: [] // Can be enhanced later
      };

      // Upload each image individually with its own metadata
      this.uploadService.uploadImages([file], metadata).subscribe({
        next: (progress: UploadProgress[]) => {
          uploadProgress[index] = progress[0];
          this.imageUploadProgress.set([...uploadProgress]);

          // Check if all uploads completed
          const allCompleted = uploadProgress.every(p => p.progress === 100 || p.error);
          if (allCompleted) {
            const hasErrors = uploadProgress.some(p => p.error);
            if (!hasErrors) {
              this.uploadSuccess.set(true);
              this.isUploading.set(false);

              // Redirect if returnUrl is set
              const returnUrl = this.returnUrl();
              if (returnUrl) {
                setTimeout(() => {
                  this.router.navigate([returnUrl]);
                }, 1500);
              }
            } else {
              this.isUploading.set(false);
            }
          }
        },
        error: () => {
          uploadProgress[index].error = 'Upload failed';
          this.imageUploadProgress.set([...uploadProgress]);
          completedUploads++;

          if (completedUploads === files.length) {
            this.uploadError.set('Some uploads failed. Please try again.');
            this.isUploading.set(false);
          }
        },
        complete: () => {
          completedUploads++;
          if (completedUploads === files.length) {
            this.isUploading.set(false);
          }
        }
      });
    });
  }

  /**
   * Animate progress from start to end value smoothly
   */
  animateProgress(start: number, end: number): void {
    const duration = 300; // 300ms animation
    const steps = 20;
    const increment = (end - start) / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newProgress = start + (increment * currentStep);
      
      if (currentStep >= steps || newProgress >= end) {
        this.uploadProgress.set(end);
        clearInterval(interval);
      } else {
        this.uploadProgress.set(newProgress);
      }
    }, stepDuration);
  }

  /**
   * Format duration from seconds to MM:SS
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format size reduction percentage
   */
  formatSizeReduction(): string {
    const original = this.originalVideoSize();
    const compressed = this.compressedVideoSize();

    if (original === 0 || compressed === 0) return '';

    const reduction = ((original - compressed) / original) * 100;
    const savedMB = (original - compressed) / (1024 * 1024);

    return `${reduction.toFixed(0)}% (saved ${savedMB.toFixed(1)}MB)`;
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  resetVideoForm(): void {
    // Clean up preview URL first
    const url = this.videoPreviewUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }

    // Reset all form states
    this.selectedVideoFile.set(null);
    this.videoPreviewUrl.set('');
    this.tags.set([]);
    this.mediaType.set('reel');
    this.description.set('');
    this.newTagName.set('');
    this.showTagInput.set(false);

    // Reset compression states
    this.compressionProgress.set(0);
    this.isCompressing.set(false);
    this.compressionError.set('');
    this.videoDuration.set(0);
    this.originalVideoSize.set(0);
    this.compressedVideoSize.set(0);

    // Reset upload states
    this.uploadProgress.set(0);
    this.uploadSuccess.set(false);
    this.uploadError.set('');
    this.isUploading.set(false);

    // Reset file input
    const videoInput = document.getElementById('video-upload') as HTMLInputElement;
    if (videoInput) {
      videoInput.value = '';
    }
  }

  resetImageForm(): void {
    // Clean up preview URLs
    this.selectedImages().forEach(file => {
      const url = this.imagePreviewUrls.get(file.name);
      if (url) {
        URL.revokeObjectURL(url);
      }
    });

    // Reset all states
    this.selectedImages.set([]);
    this.imagePreviewUrls.clear();
    this.imageDescriptions.clear();
    this.imageUploadProgress.set([]);
    this.uploadSuccess.set(false);
    this.uploadError.set('');
    this.isUploading.set(false);
    this.isDragOver.set(false);

    // Reset file input
    const imageInput = document.getElementById('image-upload') as HTMLInputElement;
    if (imageInput) {
      imageInput.value = '';
    }
  }
}
