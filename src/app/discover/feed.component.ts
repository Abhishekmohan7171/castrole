import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Discover, PostType } from '../../assets/interfaces/discover.interface';

@Component({
  selector: 'app-discover-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen" (keydown)="onKeyDown($event)" tabindex="0">
      <!-- Tabs -->
      <section class="mb-8">
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button 
            type="button" 
            class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
            [ngClass]="{
              'bg-indigo-500/20 text-indigo-200 ring-2 ring-indigo-500/40': tab === 'all',
              'bg-neutral-800/50 text-neutral-400 ring-1 ring-white/10 hover:bg-neutral-800 hover:text-neutral-200': tab !== 'all'
            }"
            (click)="tab='all'">
            all
          </button>
          <button 
            type="button" 
            class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
            [ngClass]="{
              'bg-indigo-500/20 text-indigo-200 ring-2 ring-indigo-500/40': tab === 'academic',
              'bg-neutral-800/50 text-neutral-400 ring-1 ring-white/10 hover:bg-neutral-800 hover:text-neutral-200': tab !== 'academic'
            }"
            (click)="tab='academic'">
            academic
          </button>
          <button 
            type="button" 
            class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
            [ngClass]="{
              'bg-indigo-500/20 text-indigo-200 ring-2 ring-indigo-500/40': tab === 'news',
              'bg-neutral-800/50 text-neutral-400 ring-1 ring-white/10 hover:bg-neutral-800 hover:text-neutral-200': tab !== 'news'
            }"
            (click)="tab='news'">
            news
          </button>
          <button 
            type="button" 
            class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
            [ngClass]="{
              'bg-indigo-500/20 text-indigo-200 ring-2 ring-indigo-500/40': tab === 'trending',
              'bg-neutral-800/50 text-neutral-400 ring-1 ring-white/10 hover:bg-neutral-800 hover:text-neutral-200': tab !== 'trending'
            }"
            (click)="tab='trending'">
            trending
          </button>
        </div>
      </section>

      <!-- Content grid -->
      <section>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ng-container *ngFor="let item of filteredItems; let i = index">
            <article 
              class="group rounded-2xl bg-neutral-900/40 backdrop-blur-sm border border-white/5 overflow-hidden cursor-pointer transition-all duration-300 hover:bg-neutral-900/60 hover:border-white/10 hover:shadow-xl hover:shadow-black/20"
              (click)="openModal(i)">
              <!-- Image -->
              <div class="aspect-video relative overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
                <img 
                  [src]="item.imageUrl" 
                  [alt]="item.title"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
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
                  class="px-6 py-3 rounded-full bg-indigo-500/20 text-indigo-200 font-medium text-sm ring-2 ring-indigo-500/40 hover:bg-indigo-500/30 hover:ring-indigo-500/60 transition-all duration-200">
                  go to page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
export class FeedComponent {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  role: 'actor' | 'producer' = 'actor';
  tab: 'all' | 'academic' | 'news' | 'trending' = 'all';
  search = '';
  currentModalIndex: number | null = null;
  isModalOpen = false;

  private actorItems: Discover[] = [
    { 
      id: 'a1',
      authorId: 'auth001',
      authorName: 'Film News Daily',
      postDate: new Date('2024-10-28'),
      title: 'director of Manache Shlok renaming the film after it was halted, actor anjali Sivaraman responding to trolls',
      subtitle: 'tiger shroff new film lion captured by zoo in luthiana',
      content: 'Today\'s film news includes the Malayalam film Kalamkaval receiving a U/A 16+ certificate, the Hindi film Thamma continuing its box office run, and several celebrity updates including Priyanka Chopra\'s birthday wish for Parineeti Chopra and an apology from Lucky Ali to Javed Akhtar. In Hollywood, the Evil Dead Burn sequel has finished shooting and Tron: Ares debuted at the box office.',
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
      category: 'news',
      tags: ['news', 'film', 'bollywood'],
      type: PostType.article,
      isFeatured: true,
      isActive: true,
      createdAt: new Date('2024-10-28'),
      updatedAt: new Date('2024-10-28')
    },
    { 
      id: 'a2',
      authorId: 'auth002',
      authorName: 'Casting Director',
      postDate: new Date('2024-10-25'),
      title: 'Web series supporting cast needed',
      subtitle: 'Female, 22-35 • Remote • Paid',
      content: 'Looking for talented actors for a new web series. This is a paid opportunity with flexible shooting schedules. The role requires strong dramatic skills and comfort with emotional scenes.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
      category: 'all',
      tags: ['audition', 'web-series', 'paid'],
      type: PostType.text,
      isFeatured: false,
      location: 'Remote',
      isActive: true,
      createdAt: new Date('2024-10-25'),
      updatedAt: new Date('2024-10-25')
    },
    { 
      id: 'a3',
      authorId: 'auth003',
      authorName: 'Ad Agency',
      postDate: new Date('2024-10-26'),
      title: 'TV ad - fitness brand campaign',
      subtitle: 'All genders, 18-28 • Bangalore • Paid',
      content: 'Major fitness brand looking for energetic talent for upcoming TV commercial. 2-day shoot in Bangalore. Competitive compensation and great exposure opportunity.',
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
      category: 'trending',
      tags: ['ad', 'fitness', 'commercial'],
      type: PostType.ad,
      isFeatured: true,
      location: 'Bangalore',
      isActive: true,
      createdAt: new Date('2024-10-26'),
      updatedAt: new Date('2024-10-26')
    },
    { 
      id: 'a4',
      authorId: 'auth004',
      authorName: 'Acting Academy',
      postDate: new Date('2024-10-20'),
      title: 'Academic workshop on method acting',
      subtitle: 'All levels • Online • Free',
      content: 'Join renowned acting coach for an intensive workshop on method acting techniques. Learn from industry professionals and enhance your craft.',
      imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
      category: 'academic',
      tags: ['workshop', 'training', 'method-acting'],
      type: PostType.text,
      isFeatured: false,
      location: 'Online',
      isActive: true,
      createdAt: new Date('2024-10-20'),
      updatedAt: new Date('2024-10-20')
    },
  ];

  private producerItems: Discover[] = [
    { 
      id: 'p1',
      authorId: 'actor001',
      authorName: 'Arjun K',
      postDate: new Date('2024-10-15'),
      title: 'Arjun K • 5y experience',
      subtitle: 'Action | Drama | Hindi, English',
      content: 'Versatile actor with 5 years of experience in action and drama genres. Fluent in Hindi and English. Based in Mumbai with strong portfolio in commercial and independent films.',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      category: 'all',
      tags: ['actor', 'action', 'drama'],
      type: PostType.text,
      isFeatured: false,
      location: 'Mumbai',
      isActive: true,
      createdAt: new Date('2024-10-15'),
      updatedAt: new Date('2024-10-15')
    },
    { 
      id: 'p2',
      authorId: 'actor002',
      authorName: 'Meera S',
      postDate: new Date('2024-10-18'),
      title: 'Meera S • 3y experience',
      subtitle: 'Romance | Comedy | Tamil, Telugu',
      content: 'Talented actress specializing in romantic comedies. 3 years of experience in Tamil and Telugu cinema. Known for natural acting style and strong screen presence.',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      category: 'trending',
      tags: ['actor', 'romance', 'comedy'],
      type: PostType.text,
      isFeatured: true,
      location: 'Chennai',
      isActive: true,
      createdAt: new Date('2024-10-18'),
      updatedAt: new Date('2024-10-18')
    },
    { 
      id: 'p3',
      authorId: 'actor003',
      authorName: 'Ravi T',
      postDate: new Date('2024-10-22'),
      title: 'Ravi T • Newcomer',
      subtitle: 'Theatre | Hindi',
      content: 'Fresh talent from Delhi theatre scene. Strong foundation in classical acting techniques. Looking for breakthrough role in Hindi cinema.',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      category: 'news',
      tags: ['actor', 'theatre', 'newcomer'],
      type: PostType.text,
      isFeatured: false,
      location: 'Delhi',
      isActive: true,
      createdAt: new Date('2024-10-22'),
      updatedAt: new Date('2024-10-22')
    },
  ];

  get items() { return this.role === 'actor' ? this.actorItems : this.producerItems; }

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

  onSearch(q: string) { this.search = q; }

  onPrimary(item: Discover) {
    if (this.role === 'actor') {
      // Apply logic
    } else {
      // Shortlist logic
    }
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
