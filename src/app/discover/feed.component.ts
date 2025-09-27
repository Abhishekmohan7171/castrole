import { Component, PLATFORM_ID, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { APITubeService, APITubeVideo, ContentCategory, ContentType } from './services/apitube.service';

@Component({
  selector: 'app-discover-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-black text-white">
      <!-- Header -->
      <!-- <header class="text-center py-8 md:py-12">
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
          DISCOVER
        </h1>
      </header> -->

      <!-- Category Navigation -->
      <nav class="px-4 md:px-6 lg:px-8 mb-8">
        <div class="flex flex-wrap justify-center gap-2 md:gap-4 lg:gap-6 max-w-6xl mx-auto">
          @for (category of apiTubeService.categories; track category.id) {
            <button
              type="button"
              class="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full transition-all duration-200 hover:scale-105"
              [class]="selectedCategory() === category.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white'"
              (click)="selectCategory(category)">
              {{ category.name }}
            </button>
          }
        </div>
      </nav>

      <!-- Content Type Tabs -->
      <div class="px-4 md:px-6 lg:px-8 mb-8">
        <div class="flex flex-wrap justify-center gap-2 md:gap-4 max-w-4xl mx-auto">
          @for (contentType of apiTubeService.contentTypes; track contentType.id) {
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
              [class]="selectedContentType() === contentType.id
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'"
              (click)="selectContentType(contentType.id)">
              {{ contentType.name }}
            </button>
          }
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }

      <!-- Content Grid -->
      @if (!isLoading() && videos().length > 0) {
        <main class="px-4 md:px-6 lg:px-8 pb-12">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 max-w-7xl mx-auto">
            @for (video of videos(); track video.id) {
              <article class="group cursor-pointer" (click)="onVideoClick(video)">
                <!-- Thumbnail Container -->
                <div class="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 mb-3">
                  @if (video.thumbnail) {
                    <img
                      [src]="video.thumbnail"
                      [alt]="video.title"
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  } @else {
                    <div class="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                      <svg class="h-12 w-12 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  }

                  <!-- Duration Badge -->
                  @if (video.duration) {
                    <div class="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {{ video.duration }}
                    </div>
                  }

                  <!-- Overlay on hover -->
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg class="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Content Info -->
                <div class="space-y-2">
                  <h3 class="font-bold text-sm md:text-base leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {{ video.title }}
                  </h3>

                  <div class="text-xs text-neutral-400 space-y-1">
                    <p class="truncate">{{ video.channelTitle }}</p>
                    @if (video.views) {
                      <p>{{ video.views }}</p>
                    }
                  </div>
                </div>
              </article>
            }
          </div>

          <!-- Load More Button -->
          @if (hasMoreContent()) {
            <div class="text-center mt-12">
              <button
                type="button"
                class="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-colors duration-200"
                (click)="loadMore()"
                [disabled]="isLoadingMore()">
                @if (isLoadingMore()) {
                  <span class="flex items-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </span>
                } @else {
                  Load More
                }
              </button>
            </div>
          }
        </main>
      }

      <!-- Empty State -->
      @if (!isLoading() && videos().length === 0) {
        <div class="text-center py-20">
          <div class="text-neutral-500 mb-4">
            <svg class="h-16 w-16 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-neutral-300 mb-2">No content found</h3>
          <p class="text-neutral-500">Try selecting a different category or check back later.</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="text-center py-20">
          <div class="text-red-500 mb-4">
            <svg class="h-16 w-16 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-neutral-300 mb-2">Something went wrong</h3>
          <p class="text-neutral-500 mb-4">{{ error() }}</p>
          <button
            type="button"
            class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-colors duration-200"
            (click)="retry()">
            Try Again
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class FeedComponent implements OnInit {
  readonly apiTubeService = inject(APITubeService);
  private readonly platformId = inject(PLATFORM_ID);

  // Signals for reactive state management
  readonly selectedCategory = signal<string>('bollywood');
  readonly selectedContentType = signal<string>('movies');
  readonly videos = signal<APITubeVideo[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isLoadingMore = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly nextPageToken = signal<string | null>(null);

  // Computed properties
  readonly hasMoreContent = computed(() => !!this.nextPageToken());

  ngOnInit() {
    this.loadContent();
  }

  selectCategory(category: ContentCategory) {
    this.selectedCategory.set(category.id);
    this.loadContent();
  }

  selectContentType(contentTypeId: string) {
    this.selectedContentType.set(contentTypeId);
    this.loadContent();
  }

  private loadContent() {
    this.isLoading.set(true);
    this.error.set(null);
    this.videos.set([]);
    this.nextPageToken.set(null);

    const category = this.apiTubeService.categories.find(c => c.id === this.selectedCategory());
    const contentType = this.apiTubeService.contentTypes.find(ct => ct.id === this.selectedContentType());
    
    if (!category || !contentType) {
      this.error.set('Invalid category or content type selected.');
      this.isLoading.set(false);
      return;
    }

    this.apiTubeService.getContentByFilters(category, contentType, 20).subscribe({
      next: (response) => {
        this.videos.set(response.items);
        this.nextPageToken.set(response.nextPageToken || null);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load content. Please try again.');
        this.isLoading.set(false);
        this.logError('Content loading failed', err);
      }
    });
  }

  loadMore() {
    if (!this.nextPageToken() || this.isLoadingMore()) return;

    this.isLoadingMore.set(true);
    
    const category = this.apiTubeService.categories.find(c => c.id === this.selectedCategory());
    const contentType = this.apiTubeService.contentTypes.find(ct => ct.id === this.selectedContentType());
    
    if (!category || !contentType) {
      this.isLoadingMore.set(false);
      return;
    }

    this.apiTubeService.getContentByFilters(category, contentType, 20, this.nextPageToken()!).subscribe({
      next: (response) => {
        const currentVideos = this.videos();
        this.videos.set([...currentVideos, ...response.items]);
        this.nextPageToken.set(response.nextPageToken || null);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load more content.');
        this.isLoadingMore.set(false);
        this.logError('Load more failed', err);
      }
    });
  }

  retry() {
    this.loadContent();
  }

  onVideoClick(video: APITubeVideo) {
    // Open video in new tab (YouTube)
    if (isPlatformBrowser(this.platformId)) {
      window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
    }
  }

  private logError(context: string, error: any) {
    // In production, this would go to a proper logging service
    if (isPlatformBrowser(this.platformId)) {
      console.error(`[FeedComponent] ${context}:`, error);
    }
  }
}
