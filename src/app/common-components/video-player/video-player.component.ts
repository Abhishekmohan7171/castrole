import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, doc, onSnapshot, Unsubscribe } from '@angular/fire/firestore';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-container">

      <div *ngIf="isLoading()" class="loading-state">
        <div class="flex flex-col items-center justify-center gap-3 p-4">
          <svg class="w-8 h-8 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-xs text-neutral-400">{{ statusMessage() }}</p>
        </div>
      </div>

      <div *ngIf="error()" class="error-state">
        <div class="flex flex-col items-center justify-center gap-2 p-4">
          <svg class="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p class="text-xs text-red-400">{{ error() }}</p>
        </div>
      </div>

      <video *ngIf="videoUrl()"
             [src]="videoUrl()"
             controls
             [autoplay]="autoplay"
             [poster]="posterUrl()"
             class="responsive-video">
        Your browser does not support the video tag.
      </video>

    </div>
  `,
  styles: [`
    .video-container {
      width: 100%;
      aspect-ratio: 16/9;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .responsive-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .loading-state {
      color: white;
      text-align: center;
      width: 100%;
    }
    .error-state {
      color: #ff6b6b;
      width: 100%;
    }
  `]
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) userId!: string;
  @Input({ required: true }) videoId!: string;
  @Input() autoplay: boolean = false;

  private firestore = inject(Firestore);
  private unsubscribe?: Unsubscribe;

  videoUrl = signal<string | null>(null);
  posterUrl = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  statusMessage = signal<string>('Loading video...');
  error = signal<string | null>(null);

  ngOnInit() {
    this.subscribeToVideo();
  }

  ngOnDestroy() {
    // Clean up the real-time listener
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private subscribeToVideo() {
    const docRef = doc(this.firestore, `uploads/${this.userId}/userUploads/${this.videoId}`);

    // Real-time listener
    this.unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) {
        this.error.set('Video not found');
        this.isLoading.set(false);
        return;
      }

      const data = snapshot.data();
      const status = data['processingStatus'];

      // Handle different processing states
      switch (status) {
        case 'READY':
          // Fetch the processed URL from Firestore - this is the source of truth
          this.videoUrl.set(data['processedUrl']);
          this.posterUrl.set(data['metadata']?.thumbnailUrl || null);
          this.isLoading.set(false);
          break;

        case 'PROCESSING':
          this.statusMessage.set('Processing video (optimizing quality)...');
          this.isLoading.set(true);
          break;

        case 'QUEUED':
        case 'UPLOADING':
          this.statusMessage.set('Video is in queue...');
          this.isLoading.set(true);
          break;

        case 'FAILED':
          this.error.set('Video processing failed. Please try re-uploading.');
          this.isLoading.set(false);
          break;

        default:
          // If no processing status is set, fall back to raw URL
          const url = data['processedUrl'] || data['rawUrl'] || data['fileUrl'];
          if (url) {
            this.videoUrl.set(url);
            this.posterUrl.set(data['metadata']?.thumbnailUrl || null);
            this.isLoading.set(false);
          } else {
            this.statusMessage.set('Preparing video...');
            this.isLoading.set(true);
          }
          break;
      }
    }, (error) => {
      console.error('Error subscribing to video document:', error);
      this.error.set('Failed to load video');
      this.isLoading.set(false);
    });
  }
}
