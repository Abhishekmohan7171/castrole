import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

            <!-- Upload Button -->
            <button 
              (click)="uploadVideo()"
              [disabled]="!canUploadVideo()"
              [class]="canUploadVideo() ? 'bg-purple-600 hover:bg-purple-700' : 'bg-neutral-700 cursor-not-allowed'"
              class="w-full text-white py-3 rounded-lg font-medium transition-colors">
              Upload Video
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
            <!-- Upload Button -->
            <button 
              (click)="uploadImages()"
              class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium mt-6 transition-colors">
              Upload {{ selectedImages().length }} Image(s)
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
    console.log('Edit cover clicked');
  }

  uploadVideo(): void {
    if (!this.canUploadVideo()) return;
    
    // TODO: Implement video upload logic
    console.log('Uploading video:', {
      file: this.selectedVideoFile(),
      tags: this.tags(),
      mediaType: this.mediaType,
      description: this.description
    });
  }

  uploadImages(): void {
    if (this.selectedImages().length === 0) return;
    
    // TODO: Implement image upload logic
    console.log('Uploading images:', this.selectedImages());
  }
}
