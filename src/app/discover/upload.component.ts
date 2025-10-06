import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadService, UploadProgress } from '../services/upload.service';

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
                  <p class="text-sm text-neutral-500 mt-1">MP4, MOV, AVI supported</p>
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

            <!-- Upload Progress -->
            @if (isUploading() && uploadProgress() > 0) {
              <div class="space-y-2">
                <div class="flex justify-between text-sm text-neutral-300">
                  <span>Uploading...</span>
                  <span>{{ uploadProgress().toFixed(0) }}%</span>
                </div>
                <div class="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                  <div 
                    class="bg-purple-600 h-full transition-all duration-300"
                    [style.width.%]="uploadProgress()">
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
              <div class="bg-green-500/10 border border-green-500 rounded-lg p-3">
                <p class="text-green-400 text-sm">✓ Video uploaded successfully!</p>
              </div>
            }

            <!-- Upload Button -->
            <button 
              (click)="uploadVideo()"
              [disabled]="!canUploadVideo() || isUploading()"
              [class]="canUploadVideo() && !isUploading() ? 'bg-purple-600 hover:bg-purple-700' : 'bg-neutral-700 cursor-not-allowed'"
              class="w-full text-white py-3 rounded-lg font-medium transition-colors">
              @if (isUploading()) {
                <span>Uploading...</span>
              } @else {
                <span>Upload Video</span>
              }
            </button>
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
              <!-- Image Preview Grid -->
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                @for (image of selectedImages(); track image.name) {
                  <div class="relative group">
                    <img 
                      [src]="getImagePreview(image)" 
                      [alt]="image.name"
                      class="w-full h-32 object-cover rounded-lg">
                    <button 
                      (click)="removeImage(image)"
                      class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
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
            @if (isUploading() && imageUploadProgress().length > 0) {
              <div class="mt-6 space-y-3">
                <p class="text-sm font-medium text-neutral-300">Upload Progress</p>
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
              <div class="mt-4 bg-green-500/10 border border-green-500 rounded-lg p-3">
                <p class="text-green-400 text-sm">✓ All images uploaded successfully!</p>
              </div>
            }

            <!-- Upload Button -->
            <button 
              (click)="uploadImages()"
              [disabled]="isUploading()"
              [class]="!isUploading() ? 'bg-purple-600 hover:bg-purple-700' : 'bg-neutral-700 cursor-not-allowed'"
              class="w-full text-white py-3 rounded-lg font-medium mt-6 transition-colors">
              @if (isUploading()) {
                <span>Uploading...</span>
              } @else {
                <span>Upload {{ selectedImages().length }} Image(s)</span>
              }
            </button>
          }
        </div>
      }
    </section>
  `,
  styles: []
})
export class UploadComponent {
  uploadType = signal<'video' | 'image'>('video');
  
  // Video upload state
  selectedVideoFile = signal<File | null>(null);
  videoPreviewUrl = signal<string>('');
  tags = signal<Tag[]>([]);
  showTagInput = signal(false);
  newTagName = '';
  mediaType = 'reel';
  description = '';
  
  // Image upload state
  selectedImages = signal<File[]>([]);
  isDragOver = signal(false);
  imagePreviewUrls = new Map<string, string>();
  
  // Upload state
  uploadService = inject(UploadService);
  isUploading = signal(false);
  uploadProgress = signal<number>(0);
  uploadError = signal<string>('');
  uploadSuccess = signal(false);
  imageUploadProgress = signal<UploadProgress[]>([]);

  canUploadVideo = computed(() => {
    return this.selectedVideoFile() !== null && this.description.trim().length > 0;
  });

  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedVideoFile.set(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      this.videoPreviewUrl.set(url);
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
  }

  getImagePreview(file: File): string {
    return this.imagePreviewUrls.get(file.name) || '';
  }

  addTag(): void {
    if (this.newTagName.trim()) {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: this.newTagName.trim()
      };
      
      const currentTags = this.tags();
      this.tags.set([...currentTags, newTag]);
      this.newTagName = '';
      this.showTagInput.set(false);
    }
  }

  removeTag(tagId: string): void {
    const currentTags = this.tags();
    const updatedTags = currentTags.filter(tag => tag.id !== tagId);
    this.tags.set(updatedTags);
  }

  cancelTagInput(): void {
    this.newTagName = '';
    this.showTagInput.set(false);
  }

  editCover(): void {
    // TODO: Implement cover editing functionality
    // Will allow users to select a custom thumbnail from the video
  }

  uploadVideo(): void {
    if (!this.canUploadVideo()) return;
    
    const file = this.selectedVideoFile();
    if (!file) return;

    // Validate file size (100MB max for videos)
    if (!this.uploadService.validateFileSize(file, 100)) {
      this.uploadError.set('Video file size must be less than 100MB');
      return;
    }

    // Validate file type
    if (!this.uploadService.validateFileType(file, ['video/'])) {
      this.uploadError.set('Invalid file type. Please upload a video file.');
      return;
    }

    this.isUploading.set(true);
    this.uploadError.set('');
    this.uploadSuccess.set(false);
    this.uploadProgress.set(0);

    const metadata = {
      tags: this.tags().map(tag => tag.name),
      mediaType: this.mediaType,
      description: this.description
    };

    this.uploadService.uploadVideo(file, metadata).subscribe({
      next: (progress: UploadProgress) => {
        this.uploadProgress.set(progress.progress);
        if (progress.url) {
          this.uploadSuccess.set(true);
          this.resetVideoForm();
        }
      },
      error: (error: any) => {
        this.uploadError.set(error.error || 'Upload failed. Please try again.');
        this.isUploading.set(false);
      },
      complete: () => {
        this.isUploading.set(false);
      }
    });
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

    this.uploadService.uploadImages(images).subscribe({
      next: (progress: UploadProgress[]) => {
        this.imageUploadProgress.set(progress);
        
        // Check if all uploads completed
        const allComplete = progress.every(p => p.progress === 100 || p.error);
        if (allComplete) {
          const hasErrors = progress.some(p => p.error);
          if (!hasErrors) {
            this.uploadSuccess.set(true);
            this.resetImageForm();
          }
        }
      },
      error: () => {
        this.uploadError.set('Upload failed. Please try again.');
        this.isUploading.set(false);
      },
      complete: () => {
        this.isUploading.set(false);
      }
    });
  }

  resetVideoForm(): void {
    this.selectedVideoFile.set(null);
    this.videoPreviewUrl.set('');
    this.tags.set([]);
    this.mediaType = 'reel';
    this.description = '';
    
    // Clean up preview URL
    const url = this.videoPreviewUrl();
    if (url) {
      URL.revokeObjectURL(url);
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
    
    this.selectedImages.set([]);
    this.imagePreviewUrls.clear();
    this.imageUploadProgress.set([]);
  }
}
