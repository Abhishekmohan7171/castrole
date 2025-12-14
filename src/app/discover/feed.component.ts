import { Component, PLATFORM_ID, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Discover, PostType } from '../../assets/interfaces/discover.interface';
import { DiscoverService } from '../services/discover.service';
import { LoaderComponent } from '../common-components/loader/loader.component';
import { FirestoreDiagnosticService } from '../services/firestore-diagnostic.service';
import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../assets/interfaces/interfaces';

@Component({
  selector: 'app-discover-feed',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `
    <div class="min-h-screen bg-transparent" (keydown)="onKeyDown($event)" tabindex="0">
      <!-- Loading State -->
      <app-loader [show]="isLoading()" message="Loading posts..."></app-loader>
      
      <!-- Error State -->
      <div *ngIf="errorMessage()" class="text-center py-20">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 ring-1 ring-red-500/30 mb-4">
          <svg class="h-8 w-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p class="text-red-400 text-lg">{{ errorMessage() }}</p>
        <button 
          type="button"
          (click)="retryFetch()"
          class="mt-4 px-6 py-2.5 rounded-full text-sm font-medium bg-red-500/20 text-red-200 ring-2 ring-red-500/40 hover:bg-red-500/30 transition-all duration-200">
          Retry
        </button>
      </div>
      
      <ng-container *ngIf="!isLoading() && !errorMessage()">
      <!-- Tabs - Dynamic Categories -->
      <section class="mb-8">
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button 
            *ngFor="let category of categories()"
            type="button" 
            class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 capitalize"
            [ngClass]="{
              'bg-[#946BA9]/20 text-[#946BA9] ring-2 ring-[#946BA9]/40': tab === category && isActor(),
              'bg-[#515D69] text-white ring-2 ring-[#515D69]/60': tab === category && !isActor(),
              'bg-neutral-800/50 text-neutral-400 ring-1 ring-white/10 hover:bg-neutral-800 hover:text-neutral-200': tab !== category
            }"
            (click)="tab = category">
            {{ category }}
          </button>
        </div>
      </section>

      <!-- Content grid -->
      <section>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ng-container *ngFor="let item of filteredItems; let i = index">
            <article 
              class="group rounded-2xl backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-300"
              [ngClass]="{
                'bg-purple-950/20 border border-purple-900/20 hover:bg-purple-950/30 hover:border-purple-800/30 hover:shadow-xl hover:shadow-purple-900/20': isActor(),
                'bg-neutral-900/40 border border-white/5 hover:bg-neutral-900/60 hover:border-white/10 hover:shadow-xl hover:shadow-black/20': !isActor()
              }"
              (click)="openModal(i)">
              <!-- Image -->
              <div class="aspect-video relative overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
                <img 
                  *ngIf="item.imageUrl"
                  [src]="item.imageUrl" 
                  [alt]="item.title || 'Post image'"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  (error)="onImageError($event)"
                />
                <!-- Fallback for missing image -->
                <div *ngIf="!item.imageUrl" class="w-full h-full flex items-center justify-center">
                  <svg class="h-16 w-16 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>

              <!-- Content -->
              <div class="p-5">
                <h3 class="text-sm font-medium text-neutral-200 line-clamp-2 leading-relaxed">
                  {{ item.title }}
                </h3>
              </div>
            </article>
          </ng-container>
        </div>

        <!-- Empty state -->
        <div *ngIf="filteredItems.length === 0" class="text-center py-20">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-800/50 ring-1 ring-white/10 mb-4">
            <svg class="h-8 w-8 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <p class="text-neutral-400 text-lg">No results found</p>
          <p class="text-neutral-600 text-sm mt-2">Try adjusting your filters</p>
        </div>
      </section>

      <!-- Modal Overlay -->
      <div 
        *ngIf="isModalOpen && currentCard"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 lg:p-8"
        (click)="closeModal()">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <div 
          class="relative w-full max-w-6xl max-h-[90vh] rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl shadow-black/60 animate-fadeIn"
          (click)="$event.stopPropagation()">
          
          <!-- Close Button -->
          <button 
            type="button"
            class="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 backdrop-blur-sm text-neutral-300 hover:text-white hover:bg-black/80 transition-all duration-200 ring-1 ring-white/10 hover:ring-white/20"
            (click)="closeModal()"
            aria-label="Close modal">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Navigation Arrows -->
          <button 
            type="button"
            class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 backdrop-blur-sm text-neutral-300 hover:text-white hover:bg-black/80 transition-all duration-200 ring-1 ring-white/10 hover:ring-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            (click)="previousCard()"
            [disabled]="filteredItems.length <= 1"
            aria-label="Previous card">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button 
            type="button"
            class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 backdrop-blur-sm text-neutral-300 hover:text-white hover:bg-black/80 transition-all duration-200 ring-1 ring-white/10 hover:ring-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            (click)="nextCard()"
            [disabled]="filteredItems.length <= 1"
            aria-label="Next card">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Modal Body -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-0 max-h-[90vh] overflow-y-auto">
            <!-- Image Section -->
            <div class="relative aspect-video lg:aspect-auto lg:min-h-[500px] overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
              <img 
                [src]="currentCard.imageUrl" 
                [alt]="currentCard.title"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>

            <!-- Content Section -->
            <div class="p-8 lg:p-12 flex flex-col justify-between">
              <div class="space-y-6">
                <!-- Author & Date -->
                <div class="flex items-center gap-3 text-sm text-neutral-400">
                  <span>{{ currentCard.authorName }}</span>
                  <span class="h-1 w-1 rounded-full bg-neutral-600"></span>
                  <span>{{ currentCard.postDate | date:'MMM d, y' }}</span>
                </div>

                <!-- Title & Content -->
                <div>
                  <h2 class="text-2xl lg:text-3xl font-bold text-neutral-100 mb-4 leading-tight">
                    {{ currentCard.subtitle }}
                  </h2>
                  <p class="text-base text-neutral-300 leading-relaxed">
                    {{ currentCard.content }}
                  </p>
                </div>

                <!-- Tags -->
                <div *ngIf="currentCard.tags && currentCard.tags.length > 0" class="flex flex-wrap gap-2">
                  <span 
                    *ngFor="let tag of currentCard.tags"
                    class="px-3 py-1 text-xs rounded-full bg-neutral-800/60 text-neutral-300 ring-1 ring-white/10">
                    {{ tag }}
                  </span>
                </div>

                <!-- Location -->
                <div *ngIf="currentCard.location" class="flex items-center gap-2 text-sm text-neutral-400">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{{ currentCard.location }}</span>
                </div>
              </div>

              <!-- Action Button -->
              <div class="mt-8 flex items-center justify-end gap-4">
                <button 
                  type="button"
                  class="px-6 py-3 rounded-full font-medium text-sm ring-2 transition-all duration-200"
                  [ngClass]="{
                    'bg-[#946BA9]/20 text-[#946BA9] ring-[#946BA9]/40 hover:bg-[#946BA9]/30 hover:ring-[#946BA9]/60': isActor(),
                    'bg-[#90ACC8] text-white ring-[#90ACC8]/60 hover:bg-[#7A9AB8]': !isActor()
                  }">
                  go to page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </ng-container>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }

    /* Smooth scroll for modal content */
    .max-h-\\[90vh\\] {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    .max-h-\\[90vh\\]::-webkit-scrollbar {
      width: 6px;
    }

    .max-h-\\[90vh\\]::-webkit-scrollbar-track {
      background: transparent;
    }

    .max-h-\\[90vh\\]::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    .max-h-\\[90vh\\]::-webkit-scrollbar-thumb:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class FeedComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private discoverService = inject(DiscoverService);
  private diagnosticService = inject(FirestoreDiagnosticService);
  private auth = inject(AuthService);
  private firestore = inject(Firestore);
  private subscriptions = new Subscription();

  role: 'actor' | 'producer' = 'actor';
  
  // User role signals for theming
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');
  tab = 'all';
  search = '';
  currentModalIndex: number | null = null;
  isModalOpen = false;

  // Signals for reactive state
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  allPosts = signal<Discover[]>([]);
  categories = signal<string[]>(['all']);

  get items() { return this.allPosts(); }

  get filteredItems(): Discover[] {
    const q = this.search.trim().toLowerCase();
    let base = this.items;
    
    // Filter by tab
    if (this.tab !== 'all') {
      base = base.filter(i => i.category === this.tab);
    }
    
    // Filter by search
    if (q) {
      base = base.filter(i => [
        i.title,
        i.subtitle,
        i.content,
        i.authorName,
        ...(i.tags || [])
      ].some(v => (v || '').toLowerCase().includes(q)));
    }
    
    return base;
  }

  get primaryCtaLabel() { return this.role === 'actor' ? 'apply' : 'shortlist'; }

  constructor() {
    const qpRole = this.route.snapshot.queryParamMap.get('role');
    const stored = isPlatformBrowser(this.platformId) ? localStorage.getItem('role') : null;
    const resolved = (qpRole || stored || 'actor').toLowerCase();
    this.role = resolved === 'producer' ? 'producer' : 'actor';
    if (qpRole && isPlatformBrowser(this.platformId)) localStorage.setItem('role', this.role);
  }

  async ngOnInit(): Promise<void> {
    // Uncomment the line below to run diagnostics
    // this.diagnosticService.runDiagnostics();
    
    await this.loadUserRole();
    this.fetchDiscoverPosts();
  }

  /**
   * Load user role from Firestore
   */
  private async loadUserRole(): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (user) {
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          this.userRole.set(userData.currentRole || 'actor');
          this.role = userData.currentRole === 'producer' ? 'producer' : 'actor';
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        this.userRole.set('actor');
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Restore scroll on component destroy
    if (this.isModalOpen) {
      document.body.style.overflow = '';
    }
  }

  /**
   * Fetch discover posts from Firestore
   */
  private fetchDiscoverPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Fetch all posts (we'll filter by tab on the client side)
    this.subscriptions.add(
      this.discoverService.getDiscoverPosts('all', 100).subscribe({
        next: (posts) => {
          console.log('Fetched posts:', posts);
          console.log('First post imageUrl:', posts[0]?.imageUrl);
          this.allPosts.set(posts);
          this.extractCategories(posts);
          this.isLoading.set(false);
        },
        error: (error) => {
          // Log detailed error for debugging
          console.error('Firestore error details:', error);
          console.error('Error code:', error?.code);
          console.error('Error message:', error?.message);
          
          // Set user-friendly error message
          let errorMsg = 'Failed to load posts. Please try again.';
          
          // Provide specific error messages for common issues
          if (error?.code === 'permission-denied') {
            errorMsg = 'Permission denied. Please check Firestore security rules.';
          } else if (error?.code === 'failed-precondition') {
            errorMsg = 'Missing Firestore index. Please create the required index.';
          } else if (error?.code === 'unavailable') {
            errorMsg = 'Firestore is currently unavailable. Please try again later.';
          } else if (error?.message) {
            errorMsg = `Error: ${error.message}`;
          }
          
          this.errorMessage.set(errorMsg);
          this.isLoading.set(false);
        },
      })
    );
  }

  /**
   * Extract unique categories from posts
   */
  private extractCategories(posts: Discover[]): void {
    const uniqueCategories = new Set<string>();
    
    posts.forEach(post => {
      if (post.category) {
        uniqueCategories.add(post.category);
      }
    });
    
    // Always include 'all' as the first category
    const categoriesArray = ['all', ...Array.from(uniqueCategories).sort()];
    this.categories.set(categoriesArray);
  }

  /**
   * Retry fetching posts after an error
   */
  retryFetch(): void {
    this.fetchDiscoverPosts();
  }

  onSearch(q: string) { this.search = q; }

  onPrimary(item: Discover) {
    if (this.role === 'actor') {
      // Apply logic
    } else {
      // Shortlist logic
    }
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.warn('Failed to load image:', img.src);
    // Optionally set a fallback image
    // img.src = 'assets/images/placeholder.png';
  }

  openModal(index: number) {
    this.currentModalIndex = index;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentModalIndex = null;
    document.body.style.overflow = ''; // Restore scroll
  }

  nextCard() {
    if (this.currentModalIndex === null) return;
    const nextIndex = (this.currentModalIndex + 1) % this.filteredItems.length;
    this.currentModalIndex = nextIndex;
  }

  previousCard() {
    if (this.currentModalIndex === null) return;
    const prevIndex = this.currentModalIndex === 0 
      ? this.filteredItems.length - 1 
      : this.currentModalIndex - 1;
    this.currentModalIndex = prevIndex;
  }

  get currentCard(): Discover | null {
    if (this.currentModalIndex === null) return null;
    return this.filteredItems[this.currentModalIndex] || null;
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.isModalOpen) return;
    
    switch(event.key) {
      case 'Escape':
        this.closeModal();
        break;
      case 'ArrowLeft':
        this.previousCard();
        break;
      case 'ArrowRight':
        this.nextCard();
        break;
    }
  }
}
