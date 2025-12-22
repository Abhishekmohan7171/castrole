import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadService } from '../services/upload.service';
import { VideoCompressionService } from '../services/video-compression.service';
import { UploadProgress } from '../../assets/interfaces/interfaces';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, doc, setDoc, serverTimestamp, onSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { CHARACTER_TYPES, CHARACTER_TYPE_SYNONYMS } from './search-constants';

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
          (click)="switchToVideo()"
          [class]="uploadType() === 'video' ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'"
          class="px-6 py-2 rounded-lg font-medium transition-colors">
          Video
        </button>
        <button 
          (click)="switchToImage()"
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
            <div class="relative rounded-xl aspect-video flex items-center justify-center" style="background-color: #201B24;">
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
            <!-- Character Types Section -->
            <div>
              <label class="block text-sm font-medium text-neutral-300 mb-3">Character Types (Max 3)</label>
              
              <!-- Selected Tags -->
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
              </div>
              
              <!-- Searchable Dropdown -->
              @if (canAddMoreTags()) {
                <div class="relative">
                  <input 
                    [(ngModel)]="tagSearchQuery"
                    (focus)="showTagDropdown.set(true)"
                    (input)="onTagSearchInput()"
                    placeholder="Search character types (e.g., mad, hero, teacher)..."
                    class="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500">
                  
                  @if (showTagDropdown() && filteredCharacterTypes().length > 0) {
                    <div class="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      @for (type of filteredCharacterTypes(); track type) {
                        <button
                          (click)="selectCharacterType(type)"
                          class="w-full text-left px-3 py-2 text-neutral-200 hover:bg-neutral-700 transition-colors">
                          {{ type }}
                        </button>
                      }
                    </div>
                  }
                  
                  @if (showTagDropdown() && filteredCharacterTypes().length === 0 && tagSearchQuery().trim()) {
                    <div class="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg p-3">
                      <p class="text-neutral-500 text-sm">No matching character types found</p>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-xs text-neutral-500">Maximum 3 character types selected</p>
              }
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

            <!-- Video Metadata Display -->
            @if (videoDuration() > 0) {
              <div class="text-sm text-neutral-400 space-y-1">
                <div class="flex flex-col gap-1">
                  <span>Duration: {{ formatDuration(videoDuration()) }}</span>
                  <span>Resolution: {{ videoResolution() }}</span>
                  <span>FPS: {{ videoFps() }}</span>
                  <span>Size: {{ formatFileSize(selectedVideoFile()?.size || 0) }}</span>
                </div>
              </div>
            }

            <!-- Upload Progress -->
            @if (isUploading() && !uploadSuccess()) {
              <div class="space-y-3">
                
                <!-- Uploading State -->
                @if (isUploading() && uploadProgress() < 100) {
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm text-neutral-300">
                      <span>Uploading... Please wait</span>
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

                <!-- Upload Complete but Stuck (100% but still UPLOADING status) -->
                @if (isUploading() && uploadProgress() === 100 && processingStatus() === 'UPLOADING') {
                  <div class="space-y-3">
                    <div class="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3">
                      <p class="text-yellow-400 text-sm mb-2">
                        Upload complete! Please wait a moment...
                      </p>
                      <p class="text-xs text-neutral-400">
                        Preparing your video for processing
                      </p>
                    </div>
                    <button 
                      (click)="resetVideoForm()"
                      class="w-full bg-neutral-600 hover:bg-neutral-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                      Cancel & Upload Another Video
                    </button>
                  </div>
                }

                <!-- Processing States -->
                @if (processingStatus() === 'QUEUED') {
                  <div class="bg-blue-500/10 border border-blue-500 rounded-lg p-3">
                    <p class="text-blue-400 text-sm flex items-center gap-2">
                      <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Queued for processing... Please wait
                    </p>
                  </div>
                }

                @if (processingStatus() === 'PROCESSING') {
                  <div class="bg-purple-500/10 border border-purple-500 rounded-lg p-3">
                    <p class="text-purple-400 text-sm flex items-center gap-2">
                      <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing your video... Please wait
                    </p>
                  </div>
                }

              </div>
            }

            <!-- Error Message -->
            @if (uploadError()) {
              <div class="bg-red-500/10 border border-red-500 rounded-lg p-3">
                <p class="text-red-400 text-sm">{{ uploadError() }}</p>
              </div>
            }

            <!-- Success Message -->
            @if (uploadSuccess() && processingStatus() === 'READY') {
              <div class="bg-green-500/10 border border-green-500 rounded-lg p-3 space-y-3">
                <p class="text-green-400 text-sm flex items-center gap-2">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Upload complete! Your video is ready
                </p>
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Image Preview Area -->
          <div class="space-y-4">
            <div class="relative rounded-xl aspect-video flex items-center justify-center" style="background-color: #201B24;">
              
              @if (selectedImages().length > 0) {
                <!-- Image Preview -->
                <img
                  [src]="getImagePreview(selectedImages()[0])"
                  [alt]="selectedImages()[0].name"
                  class="w-full h-full object-cover rounded-xl">
              } @else {
                <div class="text-center">
                  <div class="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <p class="text-white/80">Upload an image to preview</p>
                </div>
              }
            </div>

            <!-- Image File Input -->
            <div class="relative">
              <input 
                type="file" 
                accept="image/*"
                (change)="onImageFileSelected($event)"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="image-upload">
              <label 
                for="image-upload"
                class="block w-full p-4 border-2 border-dashed border-neutral-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors">
                @if (selectedImages().length > 0) {
                  <p class="text-neutral-300">{{ selectedImages()[0].name }}</p>
                  <p class="text-sm text-neutral-500 mt-1">Click to change image</p>
                } @else {
                  <p class="text-neutral-300">Click to select image</p>
                  <p class="text-sm text-neutral-500 mt-1">PNG, JPG, JPEG up to 1GB</p>
                }
              </label>
            </div>
          </div>

          <!-- Image Metadata Form -->
          <div class="space-y-6">
            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-neutral-300 mb-3">Description</label>
              <textarea
                [(ngModel)]="description"
                placeholder="Describe your image..."
                rows="4"
                class="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none">
              </textarea>
            </div>

            <!-- Image Info Display -->
            @if (selectedImages().length > 0) {
              <div class="text-sm text-neutral-400">
                <p>Size: {{ formatFileSize(selectedImages()[0].size) }}</p>
              </div>
            }

            <!-- Image Upload Progress -->
            @if (isUploading() && imageUploadProgress().length > 0 && !uploadSuccess()) {
              <div class="mt-6 space-y-2">
                <div class="flex justify-between text-sm text-neutral-300">
                  <span>Uploading... Please wait</span>
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
                <p class="text-green-400 text-sm flex items-center gap-2">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Upload complete! Your image is ready
                </p>
                <button 
                  (click)="resetImageForm()"
                  class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Upload Another Image
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
                  <span>Uploading... Please wait</span>
                } @else {
                  <span>Upload Image</span>
                }
              </button>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: []
})
export class UploadComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private returnUrl = signal<string | null>(null);
  private activeIntervals: number[] = [];
  
  uploadType = signal<'video' | 'image'>('video');
  
  // Video upload state
  selectedVideoFile = signal<File | null>(null);
  videoPreviewUrl = signal<string>('');
  tags = signal<Tag[]>([]);
  showTagInput = signal(false);
  newTagName = signal('');
  description = signal('');
  
  // Character type dropdown state
  tagSearchQuery = signal('');
  showTagDropdown = signal(false);
  characterTypes = CHARACTER_TYPES;
  characterTypeSynonyms = CHARACTER_TYPE_SYNONYMS;
  
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

  // Video metadata state
  videoDuration = signal<number>(0);
  videoResolution = signal<string>('');
  videoFps = signal<number>(0);
  videoBitrate = signal<number>(0);
  
  // Compression state (deprecated - now server-side)
  isCompressing = signal<boolean>(false);
  compressionProgress = signal<number>(0);
  
  // GCP Processing state
  processingStatus = signal<'UPLOADING' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED'>('UPLOADING');
  currentVideoId = signal<string>('');
  processingError = signal<string>('');
  private statusUnsubscribe?: () => void;
  
  // Firebase services
  private storage = inject(Storage);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  canUploadVideo = computed(() => {
    return this.selectedVideoFile() !== null &&
           this.description().trim().length > 0 &&
           this.tags().length > 0 &&
           this.tags().length <= 3 &&
           this.videoDuration() > 0 &&
           this.videoDuration() <= 120 && // 2 minutes in seconds
           this.videoResolution() !== ''; // Metadata loaded
  });

  canAddMoreTags = computed(() => this.tags().length < 3);
  
  // Filtered character types based on search query with synonym mapping
  filteredCharacterTypes = computed(() => {
    const query = this.tagSearchQuery().toLowerCase().trim();
    
    if (!query) {
      return this.characterTypes;
    }
    
    // Check if query is a synonym
    const mappedType = this.characterTypeSynonyms[query];
    
    // Filter character types
    return this.characterTypes.filter(type => {
      // Direct match
      if (type.toLowerCase().includes(query)) {
        return true;
      }
      
      // Synonym match - if user types a synonym, show the mapped type
      if (mappedType && type.toLowerCase() === mappedType.toLowerCase()) {
        return true;
      }
      
      // Check if any synonym maps to this type
      const synonyms = Object.entries(this.characterTypeSynonyms)
        .filter(([_, value]) => value.toLowerCase() === type.toLowerCase())
        .map(([key, _]) => key);
      
      return synonyms.some(syn => syn.includes(query));
    }).filter(type => {
      // Exclude already selected tags
      return !this.tags().some(tag => tag.name.toLowerCase() === type.toLowerCase());
    });
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

  totalImageSize = computed(() => {
    return this.selectedImages().reduce((sum, file) => sum + file.size, 0);
  });

  uploadStatusText = computed(() => {
    if (!this.isUploading()) return '';

    if (this.uploadType() === 'video') {
      const progress = this.uploadProgress();
      if (progress >= 99.5) return 'Upload complete!';
      if (progress > 90) return 'Finalizing upload...';
      return `Uploading video... ${progress.toFixed(0)}%`;
    } else {
      const progress = this.overallImageProgress();
      if (this.allImagesCompleted()) {
        return this.hasImageErrors() ? 'Some uploads failed' : 'Upload complete!';
      }
      if (progress > 90) return 'Finalizing upload...';
      return `Uploading images... ${progress.toFixed(0)}%`;
    }
  });

  ngOnInit(): void {
    this.returnUrl.set(this.route.snapshot.queryParamMap.get('returnUrl'));
    
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }
  
  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showTagDropdown.set(false);
    }
  }

  ngOnDestroy() {
    // Clean up Firestore listener
    if (this.statusUnsubscribe) {
      this.statusUnsubscribe();
    }
    
    // Clean up any active intervals
    this.activeIntervals.forEach(id => clearInterval(id));
    this.activeIntervals = [];
    
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    
    // Revoke all object URLs
    const videoUrl = this.videoPreviewUrl();
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    this.selectedImages().forEach(file => {
      const url = this.imagePreviewUrls.get(file.name);
      if (url) URL.revokeObjectURL(url);
    });
  }

  async onVideoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Reset previous state
      this.uploadError.set('');
      this.videoDuration.set(0);
      this.videoResolution.set('');
      this.videoFps.set(0);
      this.videoBitrate.set(0);

      // Validate file type first
      if (!this.uploadService.validateFileType(file, ['video/'])) {
        this.uploadError.set('Invalid file type. Please upload a video file.');
        return;
      }

      // Extract and validate video metadata
      try {
        const metadata = await this.extractVideoMetadata(file);

        // Validate duration (2 minutes max)
        if (metadata.duration > 120) {
          const minutes = Math.floor(metadata.duration / 60);
          const seconds = Math.floor(metadata.duration % 60);
          this.uploadError.set(`Video must be 2 minutes or less. Current: ${minutes}:${seconds.toString().padStart(2, '0')}`);
          return;
        }

        // Set metadata
        this.videoDuration.set(metadata.duration);
        this.videoResolution.set(`${metadata.width}x${metadata.height}`);
        this.videoFps.set(metadata.fps);
        this.videoBitrate.set(metadata.bitrate);
        this.selectedVideoFile.set(file);

        // Create preview URL
        const url = URL.createObjectURL(file);
        this.videoPreviewUrl.set(url);
      } catch (error: any) {
        this.uploadError.set(`Failed to read video metadata: ${error.message}`);
      }
    }
  }

  /**
   * Extract video metadata (resolution, fps, bitrate, duration)
   */
  private async extractVideoMetadata(file: File): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        // Get basic metadata
        const duration = video.duration;
        const width = video.videoWidth;
        const height = video.videoHeight;

        // Estimate FPS (not directly available, use heuristic)
        // Most videos are 24, 30, or 60 fps
        let fps = 30; // Default assumption
        
        // Estimate bitrate from file size and duration
        const bitrate = Math.floor((file.size * 8) / duration / 1000); // kbps

        // Clean up
        URL.revokeObjectURL(video.src);

        // Validate
        if (isNaN(duration) || !isFinite(duration)) {
          reject(new Error('Unable to read video duration'));
          return;
        }

        if (width === 0 || height === 0) {
          reject(new Error('Unable to read video resolution'));
          return;
        }

        resolve({ duration, width, height, fps, bitrate });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      // Only take the first file (single image upload)
      const file = input.files[0];
      
      // Clear previous image if any
      const currentImages = this.selectedImages();
      if (currentImages.length > 0) {
        const oldUrl = this.imagePreviewUrls.get(currentImages[0].name);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
      }
      
      // Set new image
      this.selectedImages.set([file]);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      this.imagePreviewUrls.set(file.name, url);
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
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        // Clear previous image if any
        const currentImages = this.selectedImages();
        if (currentImages.length > 0) {
          const oldUrl = this.imagePreviewUrls.get(currentImages[0].name);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
        }
        
        // Set new image
        this.selectedImages.set([file]);
        
        // Create preview URL
        const url = URL.createObjectURL(file);
        this.imagePreviewUrls.set(file.name, url);
      }
    }
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

  onTagSearchInput(): void {
    // Show dropdown when user types
    this.showTagDropdown.set(true);
  }
  
  selectCharacterType(type: string): void {
    if (this.tags().length < 3) {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: type
      };
      
      const currentTags = this.tags();
      this.tags.set([...currentTags, newTag]);
      
      // Clear search and close dropdown
      this.tagSearchQuery.set('');
      this.showTagDropdown.set(false);
    }
  }

  removeTag(tagId: string): void {
    const currentTags = this.tags();
    const updatedTags = currentTags.filter(tag => tag.id !== tagId);
    this.tags.set(updatedTags);
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
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.processingStatus.set('UPLOADING');

    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        this.uploadError.set('Please sign in to upload videos');
        this.isUploading.set(false);
        return;
      }

      // Check file size limit (1000MB / 1GB)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 1000) {
        this.uploadError.set(`Video is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is 1GB (1000MB).`);
        this.isUploading.set(false);
        return;
      }

      // Generate unique video ID
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.currentVideoId.set(videoId);

      // Get file extension
      const fileExt = file.name.split('.').pop() || 'mp4';
      
      // Storage path: raw/{userId}/{videoId}/original.{ext}
      const storagePath = `raw/${userId}/${videoId}/original.${fileExt}`;
      const storageRef = ref(this.storage, storagePath);

      // Create Firestore document
      const firestoreDocRef = doc(
        this.firestore,
        `uploads/${userId}/userUploads/${videoId}`
      );

      const firestoreData = {
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: serverTimestamp(),
        userId: userId,
        videoId: videoId,
        rawPath: storagePath,
        processingStatus: 'UPLOADING',
        metadata: {
          tags: this.tags().map(tag => tag.name),
          description: this.description(),
          duration: this.videoDuration(),
          resolution: this.videoResolution(),
          fps: this.videoFps(),
          bitrate: this.videoBitrate(),
          originalSize: file.size
        }
      };

      await setDoc(firestoreDocRef, firestoreData);

      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress.set(progress);
        },
        (error) => {
          // Upload error
          this.uploadError.set(`Upload failed: ${error.message}`);
          this.isUploading.set(false);
          this.processingStatus.set('FAILED');
          
          // Update Firestore
          setDoc(firestoreDocRef, {
            processingStatus: 'FAILED',
            processingError: error.message
          }, { merge: true });
        },
        async () => {
          // Upload complete
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update Firestore - upload complete
            await setDoc(firestoreDocRef, {
              rawUrl: downloadURL,
              uploadCompletedAt: serverTimestamp()
            }, { merge: true });

            // Upload done, now processing on server
            this.uploadProgress.set(100);
            this.processingStatus.set('QUEUED');

            // Start watching processing status
            this.watchProcessingStatus(userId, videoId);

          } catch (error: any) {
            this.uploadError.set(`Upload failed: ${error.message}`);
            this.isUploading.set(false);
            this.processingStatus.set('FAILED');
          }
        }
      );

    } catch (error: any) {
      this.uploadError.set(`Upload failed: ${error.message}`);
      this.isUploading.set(false);
      this.processingStatus.set('FAILED');
    }
  }

  /**
   * Watch processing status in real-time
   */
  private watchProcessingStatus(userId: string, videoId: string): void {
    const docRef = doc(this.firestore, `uploads/${userId}/userUploads/${videoId}`);

    this.statusUnsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const status = data['processingStatus'];
          
          this.processingStatus.set(status);

          if (status === 'READY') {
            // Processing complete!
            this.isUploading.set(false);
            this.uploadSuccess.set(true);
            
            // Stop watching
            if (this.statusUnsubscribe) {
              this.statusUnsubscribe();
            }
          } else if (status === 'FAILED') {
            this.uploadError.set(data['processingError'] || 'Processing failed');
            this.isUploading.set(false);
            this.processingStatus.set('FAILED');
            
            // Stop watching
            if (this.statusUnsubscribe) {
              this.statusUnsubscribe();
            }
          }
        }
      },
      (error) => {
        this.uploadError.set(`Error watching status: ${error.message}`);
      }
    );
  }

  /**
   * Compress video using browser's MediaRecorder API
   * Target: ~6 Mbps bitrate for good quality under 100MB
   */
  private async compressVideo(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = async () => {
        try {
          const duration = video.duration;
          const width = video.videoWidth;
          const height = video.videoHeight;

          // Calculate target bitrate to stay under 100MB
          // Formula: (95MB * 8 * 1024) / duration_seconds = total_bitrate_kbps
          const targetSizeMB = 95;
          const totalBitrateKbps = Math.floor((targetSizeMB * 8 * 1024) / duration);
          const videoBitrateKbps = Math.max(totalBitrateKbps - 128, 3000); // Min 3Mbps
          const videoBitrateBps = videoBitrateKbps * 1000;

          // Create canvas for video processing
          const canvas = document.createElement('canvas');
          
          // Scale down to 1080p if needed
          const scale = Math.min(1, 1920 / width, 1080 / height);
          canvas.width = Math.floor(width * scale);
          canvas.height = Math.floor(height * scale);
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Capture canvas stream
          const stream = canvas.captureStream(30); // 30 fps

          // Set up MediaRecorder with optimal settings
          const options: MediaRecorderOptions = {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: videoBitrateBps
          };

          // Fallback to vp8 if vp9 not supported
          if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
            options.mimeType = 'video/webm;codecs=vp8';
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            URL.revokeObjectURL(video.src);
            resolve(blob);
          };

          mediaRecorder.onerror = (e) => {
            URL.revokeObjectURL(video.src);
            reject(new Error('MediaRecorder error'));
          };

          // Start recording
          mediaRecorder.start(100); // Collect data every 100ms

          // Play video and draw frames to canvas
          video.currentTime = 0;
          video.play();

          const drawFrame = () => {
            if (video.paused || video.ended) {
              mediaRecorder.stop();
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Update progress
            const progress = (video.currentTime / duration) * 100;
            this.compressionProgress.set(Math.min(progress, 99));

            requestAnimationFrame(drawFrame);
          };

          video.onplay = () => {
            drawFrame();
          };

          video.onended = () => {
            setTimeout(() => {
              mediaRecorder.stop();
              this.compressionProgress.set(100);
            }, 500);
          };

        } catch (error) {
          URL.revokeObjectURL(video.src);
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
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
        // Remove from active intervals
        const idx = this.activeIntervals.indexOf(interval as any);
        if (idx > -1) this.activeIntervals.splice(idx, 1);
      } else {
        this.uploadProgress.set(newProgress);
      }
    }, stepDuration) as any;
    
    // Track interval for cleanup
    this.activeIntervals.push(interval);
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
    this.description.set('');
    this.newTagName.set('');
    this.showTagInput.set(false);

    // Reset video metadata
    this.videoDuration.set(0);
    this.videoResolution.set('');
    this.videoFps.set(0);
    this.videoBitrate.set(0);

    // Reset upload states
    this.uploadProgress.set(0);
    this.uploadSuccess.set(false);
    this.uploadError.set('');
    this.isUploading.set(false);
    
    // Reset processing states
    this.processingStatus.set('UPLOADING');
    this.currentVideoId.set('');
    this.processingError.set('');
    this.isCompressing.set(false);
    this.compressionProgress.set(0);

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
    
    // Clear description field
    this.description.set('');

    // Reset file input
    const imageInput = document.getElementById('image-upload') as HTMLInputElement;
    if (imageInput) {
      imageInput.value = '';
    }
  }

  /**
   * Switch to video upload mode and reset image-specific errors
   */
  switchToVideo(): void {
    this.uploadType.set('video');
    // Clear any image-specific errors when switching to video
    if (this.uploadType() === 'video' && this.selectedImages().length > 0) {
      this.uploadError.set('');
    }
  }

  /**
   * Switch to image upload mode and reset video-specific errors
   */
  switchToImage(): void {
    this.uploadType.set('image');
    // Clear any video-specific errors when switching to images
    if (this.uploadType() === 'image' && this.selectedVideoFile()) {
      this.uploadError.set('');
    }
  }
}
