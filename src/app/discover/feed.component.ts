import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-discover-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen">
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
          <ng-container *ngFor="let item of filteredItems">
            <!-- Collapsed card -->
            <article 
              *ngIf="!isExpanded(item.id)"
              class="group rounded-2xl bg-neutral-900/40 backdrop-blur-sm border border-white/5 overflow-hidden cursor-pointer transition-all duration-300 hover:bg-neutral-900/60 hover:border-white/10 hover:shadow-xl hover:shadow-black/20"
              (click)="toggleCard(item.id)">
              <!-- Image -->
              <div class="aspect-video relative overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
                <img 
                  [src]="item.image" 
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

            <!-- Expanded card -->
            <article 
              *ngIf="isExpanded(item.id)"
              class="md:col-span-2 lg:col-span-3 rounded-2xl bg-neutral-900/60 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl shadow-black/40 transition-all duration-300">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <!-- Image section -->
                <div class="relative aspect-video lg:aspect-auto lg:min-h-[400px] overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
                  <img 
                    [src]="item.image" 
                    [alt]="item.title"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  
                  <!-- Close button -->
                  <button 
                    type="button"
                    class="absolute top-4 right-4 p-2 rounded-full bg-black/60 backdrop-blur-sm text-neutral-300 hover:text-white hover:bg-black/80 transition-all duration-200 ring-1 ring-white/10"
                    (click)="toggleCard(item.id); $event.stopPropagation()">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <!-- Content section -->
                <div class="p-8 lg:p-10 flex flex-col justify-between">
                  <div class="space-y-6">
                    <div>
                      <h2 class="text-2xl lg:text-3xl font-bold text-neutral-100 mb-3 leading-tight">
                        {{ item.subtitle }}
                      </h2>
                      <p class="text-base text-neutral-300 leading-relaxed">
                        {{ item.description }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-8 flex items-center justify-end">
                    <button 
                      type="button"
                      class="px-6 py-3 rounded-full bg-indigo-500/20 text-indigo-200 font-medium text-sm ring-2 ring-indigo-500/40 hover:bg-indigo-500/30 hover:ring-indigo-500/60 transition-all duration-200"
                      (click)="$event.stopPropagation()">
                      go to page
                    </button>
                  </div>
                </div>
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
    </div>
  `,
  styles: []
})
export class FeedComponent {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  role: 'actor' | 'producer' = 'actor';
  tab: 'all' | 'academic' | 'news' | 'trending' = 'all';
  search = '';
  expandedCardId: string | null = null;

  private actorItems = [
    { 
      id: 'a1', 
      title: 'director of Manache Shlok renaming the film after it was halted, actor anjali Sivaraman responding to trolls',
      subtitle: 'tiger shroff new film lion captured by zoo in luthiana',
      description: 'Today\'s film news includes the Malayalam film Kalamkaval receiving a U/A 16+ certificate, the Hindi film Thamma continuing its box office run, and several celebrity updates including Priyanka Chopra\'s birthday wish for Parineeti Chopra and an apology from Lucky Ali to Javed Akhtar. In Hollywood, the Evil Dead Burn sequel has finished shooting and Tron: Ares debuted at the box office.',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
      tag: 'news',
      category: 'news'
    },
    { 
      id: 'a2', 
      title: 'Web series supporting cast needed',
      subtitle: 'Female, 22-35 • Remote • Paid',
      description: 'Looking for talented actors for a new web series. This is a paid opportunity with flexible shooting schedules. The role requires strong dramatic skills and comfort with emotional scenes.',
      image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
      tag: 'audition',
      category: 'all'
    },
    { 
      id: 'a3', 
      title: 'TV ad - fitness brand campaign',
      subtitle: 'All genders, 18-28 • Bangalore • Paid',
      description: 'Major fitness brand looking for energetic talent for upcoming TV commercial. 2-day shoot in Bangalore. Competitive compensation and great exposure opportunity.',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      tag: 'ad',
      category: 'trending'
    },
    { 
      id: 'a4', 
      title: 'Academic workshop on method acting',
      subtitle: 'All levels • Online • Free',
      description: 'Join renowned acting coach for an intensive workshop on method acting techniques. Learn from industry professionals and enhance your craft.',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
      tag: 'workshop',
      category: 'academic'
    },
  ];

  private producerItems = [
    { 
      id: 'p1', 
      title: 'Arjun K • 5y experience',
      subtitle: 'Action | Drama | Hindi, English',
      description: 'Versatile actor with 5 years of experience in action and drama genres. Fluent in Hindi and English. Based in Mumbai with strong portfolio in commercial and independent films.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      tag: 'actor',
      category: 'all'
    },
    { 
      id: 'p2', 
      title: 'Meera S • 3y experience',
      subtitle: 'Romance | Comedy | Tamil, Telugu',
      description: 'Talented actress specializing in romantic comedies. 3 years of experience in Tamil and Telugu cinema. Known for natural acting style and strong screen presence.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      tag: 'actor',
      category: 'trending'
    },
    { 
      id: 'p3', 
      title: 'Ravi T • Newcomer',
      subtitle: 'Theatre | Hindi',
      description: 'Fresh talent from Delhi theatre scene. Strong foundation in classical acting techniques. Looking for breakthrough role in Hindi cinema.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
      tag: 'actor',
      category: 'news'
    },
  ];

  get items() { return this.role === 'actor' ? this.actorItems : this.producerItems; }

  get filteredItems() {
    const q = this.search.trim().toLowerCase();
    let base = this.items;
    
    // Filter by tab
    if (this.tab !== 'all') {
      base = base.filter(i => i.category === this.tab);
    }
    
    // Filter by search
    if (q) {
      base = base.filter(i => [i.title, i.subtitle, i.description, i.tag].some(v => (v || '').toLowerCase().includes(q)));
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

  onPrimary(item: any) {
    if (this.role === 'actor') {
      // Apply logic
    } else {
      // Shortlist logic
    }
  }

  toggleCard(itemId: string) {
    this.expandedCardId = this.expandedCardId === itemId ? null : itemId;
  }

  isExpanded(itemId: string): boolean {
    return this.expandedCardId === itemId;
  }
}
