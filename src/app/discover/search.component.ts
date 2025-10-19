import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, query, where, getDocs, DocumentData } from '@angular/fire/firestore';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Profile, ActorProfile } from '../../assets/interfaces/profile.interfaces';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { LoggerService } from '../services/logger.service';

interface ActorSearchResult {
  uid: string;
  stageName: string;
  age?: string;
  gender?: string;
  location?: string;
  height?: string;
  weight?: string;
  skills?: string[];
  languages?: string[];
  profileImageUrl?: string;
  carouselImages?: string[];
  profileViewCount?: number;
  wishlistCount?: number;
  // For search relevance
  relevanceScore?: number;
}

interface SearchFilters {
  characterType: string;
  minAge: number;
  maxAge: number;
  gender: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  languages: string[];
}

interface ParsedSearchQuery {
  ageRange?: { min: number; max: number };
  gender?: string;
  skills?: string[];
  physicalTraits?: string[];
  keywords?: string[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-black text-neutral-200">
      <!-- Search Bar -->
      <div class="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-neutral-800">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Describe your character — e.g. 25-year-old fair boy with boxing skills"
              class="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-6 py-4 pr-24 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-fuchsia-500 transition-colors">
            
            <!-- Voice and AI icons -->
            <div class="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
              <button class="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-fuchsia-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button class="p-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-600 transition-colors text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Search Tags -->
          @if (searchTags().length > 0) {
            <div class="flex flex-wrap gap-2 mt-3">
              @for (tag of searchTags(); track tag) {
                <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-sm text-neutral-300">
                  {{ tag }}
                  <button (click)="removeTag(tag)" class="hover:text-fuchsia-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Filters Sidebar -->
          <aside class="lg:col-span-1">
            <div class="sticky top-32 bg-neutral-900 rounded-xl border border-neutral-800 p-6">
              <h2 class="text-lg font-semibold text-neutral-100 mb-6">Filters</h2>

              <!-- Character Type -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Character Type</label>
                <select 
                  [(ngModel)]="filters().characterType"
                  (change)="applyFilters()"
                  class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-fuchsia-500">
                  <option value="any">Any</option>
                  <option value="lead">Lead</option>
                  <option value="supporting">Supporting</option>
                  <option value="extra">Extra</option>
                </select>
              </div>

              <!-- Age Range -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Age</label>
                <div class="flex items-center gap-3">
                  <input 
                    type="number" 
                    [(ngModel)]="filters().minAge"
                    (change)="applyFilters()"
                    min="18" 
                    max="100"
                    class="w-20 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-center focus:outline-none focus:border-fuchsia-500">
                  <div class="flex-1 relative">
                    <input 
                      type="range" 
                      [(ngModel)]="filters().maxAge"
                      (change)="applyFilters()"
                      min="18" 
                      max="100"
                      class="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500">
                  </div>
                  <span class="w-12 text-center text-neutral-300">{{ filters().maxAge }}</span>
                </div>
              </div>

              <!-- Gender -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-3">Gender</label>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="any"
                      [(ngModel)]="filters().gender"
                      (change)="applyFilters()"
                      class="w-4 h-4 accent-fuchsia-500">
                    <span class="text-neutral-300">Any</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="male"
                      [(ngModel)]="filters().gender"
                      (change)="applyFilters()"
                      class="w-4 h-4 accent-fuchsia-500">
                    <span class="text-neutral-300">Male</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="female"
                      [(ngModel)]="filters().gender"
                      (change)="applyFilters()"
                      class="w-4 h-4 accent-fuchsia-500">
                    <span class="text-neutral-300">Female</span>
                  </label>
                </div>
              </div>

              <!-- Height / Weight -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Height / Weight</label>
                <div class="grid grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    [(ngModel)]="filters().heightFt"
                    placeholder="ft"
                    class="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-center focus:outline-none focus:border-fuchsia-500">
                  <input 
                    type="text" 
                    [(ngModel)]="filters().heightIn"
                    placeholder="In"
                    class="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-center focus:outline-none focus:border-fuchsia-500">
                  <input 
                    type="text" 
                    [(ngModel)]="filters().weight"
                    placeholder="weight"
                    class="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-center focus:outline-none focus:border-fuchsia-500">
                </div>
              </div>

              <!-- Languages -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Languages</label>
                <input 
                  type="text" 
                  placeholder="e.g., English, Hindi"
                  class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-fuchsia-500">
              </div>

              <!-- Apply Filters Button -->
              <button 
                (click)="applyFilters()"
                class="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-medium py-3 rounded-lg transition-colors">
                Apply Filters
              </button>
            </div>
          </aside>

          <!-- Actor Cards Grid -->
          <main class="lg:col-span-2">
            @if (loading()) {
              <!-- Loading State -->
              <div class="flex items-center justify-center py-20">
                <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-fuchsia-500 border-r-transparent"></div>
              </div>
            } @else if (error()) {
              <!-- Error State -->
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl font-semibold text-neutral-400 mb-2">{{ error() }}</h3>
                <button 
                  (click)="loadActors()" 
                  class="mt-4 px-6 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg transition-colors">
                  Retry
                </button>
              </div>
            } @else if (filteredActors().length > 0) {
              <!-- Results -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (actor of filteredActors(); track actor.uid) {
                  <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden hover:border-fuchsia-500/50 transition-all duration-300 group">
                    <!-- Actor Photo -->
                    <div class="relative aspect-[3/4] bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
                      @if (actor.profileImageUrl) {
                        <img [src]="actor.profileImageUrl" [alt]="actor.stageName" class="w-full h-full object-cover">
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-6xl font-bold text-neutral-700">
                          {{ actor.stageName.charAt(0).toUpperCase() }}
                        </div>
                      }
                      
                      <!-- Hover Overlay -->
                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <!-- Actor Info -->
                    <div class="p-4">
                      <h3 class="text-lg font-semibold text-neutral-100 mb-1">{{ actor.stageName }}</h3>
                      <p class="text-sm text-neutral-400 mb-3">{{ actor.age || 'N/A' }} years old</p>

                      <!-- Skills/Tags -->
                      @if (actor.skills && actor.skills.length > 0) {
                        <div class="flex flex-wrap gap-1.5 mb-4">
                          @for (skill of actor.skills.slice(0, 3); track skill) {
                            <span class="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300">
                              {{ skill }}
                            </span>
                          }
                        </div>
                      }

                      <!-- Actions -->
                      <div class="flex items-center gap-2">
                        <button 
                          (click)="viewProfile(actor)"
                          class="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          (click)="toggleWishlist(actor)"
                          [class]="isInWishlist(actor) ? 'bg-fuchsia-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-fuchsia-400'"
                          class="p-2 rounded-lg transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" [attr.fill]="isInWishlist(actor) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else if (searchQuery() || hasActiveFilters()) {
              <!-- No Results State (only show if user has searched) -->
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-neutral-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 class="text-xl font-semibold text-neutral-400 mb-2">No actors found</h3>
                <p class="text-neutral-500">Try adjusting your search or filters</p>
              </div>
            } @else {
              <!-- Initial State -->
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-fuchsia-500/20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 class="text-2xl font-semibold text-neutral-300 mb-3">Find Your Perfect Actor</h3>
                <p class="text-neutral-500 mb-2 max-w-md">
                  Describe the character you're looking for or use the filters to discover talented actors
                </p>
                <p class="text-sm text-neutral-600">
                  Try: "25-year-old male actor with boxing skills" or "tall actress who knows Tamil"
                </p>
              </div>
            }
          </main>

          <!-- Wishlist Sidebar -->
          <aside class="lg:col-span-1">
            <div class="sticky top-32 bg-neutral-900 rounded-xl border border-neutral-800 p-6">
              <h2 class="text-lg font-semibold text-neutral-100 mb-4">Wishlist</h2>

              @if (wishlist().length > 0) {
                <div class="space-y-3 mb-4">
                  @for (actor of wishlist(); track actor.uid) {
                    <div class="flex items-center gap-3 p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors">
                      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm">
                        {{ actor.stageName.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-neutral-200 truncate">{{ actor.stageName }}</p>
                      </div>
                      <button 
                        (click)="toggleWishlist(actor)"
                        class="text-neutral-400 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>

                <button 
                  (click)="viewAllWishlist()"
                  class="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  View Profile
                </button>
              } @else {
                <div class="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p class="text-sm text-neutral-500">No actors in wishlist</p>
                </div>
              }
            </div>
          </aside>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Custom scrollbar for filters */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #171717;
    }
    ::-webkit-scrollbar-thumb {
      background: #404040;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #525252;
    }
  `]
})
export class SearchComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private destroy$ = new Subject<void>();

  // Search state
  searchQuery = signal('');
  searchTags = signal<string[]>([]);
  private searchSubject = new Subject<string>();
  parsedQuery = signal<ParsedSearchQuery>({});
  
  // Actors data
  allActors = signal<ActorSearchResult[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Pagination
  currentPage = signal(0);
  itemsPerPage = 20;
  hasMore = signal(false);
  
  // Filters
  filters = signal<SearchFilters>({
    characterType: 'any',
    minAge: 18,
    maxAge: 50,
    gender: 'any',
    heightFt: '',
    heightIn: '',
    weight: '',
    languages: []
  });

  // Wishlist
  wishlist = signal<ActorSearchResult[]>([]);

  // Computed filtered actors with advanced logic
  filteredActors = computed(() => {
    const searchText = this.searchQuery().toLowerCase();
    const currentFilters = this.filters();
    const parsed = this.parsedQuery();

    // Don't show results if no search query and default filters
    const hasSearchQuery = searchText.trim().length > 0;
    const hasNonDefaultFilters = 
      currentFilters.gender !== 'any' ||
      currentFilters.minAge !== 18 ||
      currentFilters.maxAge !== 50 ||
      currentFilters.heightFt !== '' ||
      currentFilters.heightIn !== '' ||
      currentFilters.weight !== '' ||
      currentFilters.languages.length > 0;

    if (!hasSearchQuery && !hasNonDefaultFilters) {
      this.logger.log('No search query or filters active');
      return [];
    }

    let actors = this.allActors();
    this.logger.log(`Filtering ${actors.length} total actors with query: "${searchText}"`);

    // Apply smart search across all profile fields
    if (searchText) {
      actors = actors.filter(actor => {
        const matchesName = actor.stageName?.toLowerCase().includes(searchText);
        const matchesSkills = actor.skills?.some(skill => 
          typeof skill === 'string' && skill.toLowerCase().includes(searchText)
        );
        const matchesLanguages = actor.languages?.some(lang => 
          typeof lang === 'string' && lang.toLowerCase().includes(searchText)
        );
        const matchesLocation = actor.location?.toLowerCase().includes(searchText);
        const matchesGender = actor.gender?.toLowerCase().includes(searchText);
        const matchesAge = actor.age?.toString().includes(searchText);
        
        return matchesName || matchesSkills || matchesLanguages || 
               matchesLocation || matchesGender || matchesAge;
      });

      // Calculate relevance scores
      actors = actors.map(actor => ({
        ...actor,
        relevanceScore: this.calculateRelevance(actor, searchText, parsed)
      }));

      // Sort by relevance
      actors.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    // Apply gender filter
    if (currentFilters.gender !== 'any') {
      actors = actors.filter(actor => 
        actor.gender?.toLowerCase() === currentFilters.gender.toLowerCase()
      );
    }

    // Apply age range filter (only if changed from defaults)
    const hasAgeFilter = currentFilters.minAge !== 18 || currentFilters.maxAge !== 50;
    if (hasAgeFilter) {
      actors = actors.filter(actor => {
        const age = parseInt(actor.age || '0');
        return age >= currentFilters.minAge && age <= currentFilters.maxAge;
      });
    }

    // Apply height filter if specified
    if (currentFilters.heightFt || currentFilters.heightIn) {
      const targetHeightInches = this.convertToInches(
        currentFilters.heightFt, 
        currentFilters.heightIn
      );
      if (targetHeightInches > 0) {
        actors = actors.filter(actor => {
          const actorHeight = this.parseHeight(actor.height || '');
          // Allow ±2 inches tolerance
          return Math.abs(actorHeight - targetHeightInches) <= 2;
        });
      }
    }

    // Apply weight filter if specified
    if (currentFilters.weight) {
      const targetWeight = parseInt(currentFilters.weight);
      if (targetWeight > 0) {
        actors = actors.filter(actor => {
          const actorWeight = parseInt(actor.weight || '0');
          // Allow ±5 kg tolerance
          return Math.abs(actorWeight - targetWeight) <= 5;
        });
      }
    }

    // Apply languages filter
    if (currentFilters.languages.length > 0) {
      actors = actors.filter(actor => {
        return currentFilters.languages.some(lang => 
          actor.languages?.some(actorLang => 
            typeof actorLang === 'string' && typeof lang === 'string' &&
            actorLang.toLowerCase().includes(lang.toLowerCase())
          )
        );
      });
    }

    this.logger.log(`Filtered results: ${actors.length} actors found`);
    return actors;
  });

  ngOnInit(): void {
    // Load actors in background but don't display until search
    this.loadActors();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  /**
   * Load actors from profiles collection
   * First gets actor UIDs from users collection, then fetches full profiles
   */
  async loadActors(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      // Step 1: Get all actor UIDs from users collection
      const usersRef = collection(this.firestore, 'users');
      const usersQuery = query(usersRef, where('currentRole', '==', 'actor'));
      const userDocs = await getDocs(usersQuery);
      
      const actorUids = userDocs.docs.map(doc => doc.id);
      this.logger.log(`Found ${actorUids.length} actors`);

      if (actorUids.length === 0) {
        this.allActors.set([]);
        this.loading.set(false);
        return;
      }

      // Step 2: Batch fetch profiles (Firestore 'in' query limit is 10)
      const actors: ActorSearchResult[] = [];
      
      for (let i = 0; i < actorUids.length; i += 10) {
        const batch = actorUids.slice(i, i + 10);
        const profilesRef = collection(this.firestore, 'profiles');
        const profilesQuery = query(profilesRef, where('uid', 'in', batch));
        const profileDocs = await getDocs(profilesQuery);
        
        profileDocs.forEach((doc) => {
          const profile = doc.data() as Profile;
          const actorResult = this.transformProfileToSearchResult(profile);
          if (actorResult) {
            actors.push(actorResult);
          }
        });
      }
      
      this.logger.log(`Loaded ${actors.length} actor profiles`);
      this.allActors.set(actors);
      
    } catch (err) {
      const errorMsg = 'Failed to load actors. Please try again.';
      this.error.set(errorMsg);
      this.logger.error('Error loading actors:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Transform Profile document to ActorSearchResult
   */
  private transformProfileToSearchResult(profile: Profile): ActorSearchResult | null {
    if (!profile.actorProfile) {
      this.logger.log('Profile missing actorProfile:', profile.uid);
      return null;
    }

    const actor = profile.actorProfile;
    
    // Ensure skills and languages are always string arrays
    const ensureStringArray = (arr: any[] | undefined): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.filter(item => typeof item === 'string') as string[];
    };
    
    const result = {
      uid: profile.uid,
      stageName: actor.stageName || 'Unknown',
      age: profile.age,
      gender: profile.gender,
      location: profile.location,
      height: actor.height,
      weight: actor.weight,
      skills: ensureStringArray(actor.skills),
      languages: ensureStringArray(actor.languages),
      profileImageUrl: actor.actorProfileImageUrl,
      carouselImages: actor.carouselImagesUrl || [],
      profileViewCount: actor.profileViewCount || 0,
      wishlistCount: actor.wishListCount || 0
    };
    
    this.logger.log('Transformed actor:', result.stageName, result);
    return result;
  }

  /**
   * Setup debounced search with RxJS
   */
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query) => {
      this.parseSearchQuery(query);
      this.extractSearchTags(query);
    });
  }

  onSearchChange(): void {
    const query = this.searchQuery();
    this.searchSubject.next(query);
  }

  /**
   * Parse natural language search query
   * Examples:
   * - "25-year-old fair boy with boxing skills" → age:25, gender:male, skills:[boxing]
   * - "tall female actor who knows Tamil" → gender:female, languages:[Tamil]
   */
  private parseSearchQuery(query: string): void {
    const parsed: ParsedSearchQuery = {};
    const lowerQuery = query.toLowerCase();

    // Extract age patterns
    const agePatterns = [
      /(\d{2})[-\s]?year[-\s]?old/i,
      /age[:\s]+(\d{2})/i,
      /(\d{2})\s*yo/i
    ];
    
    for (const pattern of agePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        parsed.ageRange = { min: age - 2, max: age + 2 };
        break;
      }
    }

    // Extract gender
    if (lowerQuery.includes('male') && !lowerQuery.includes('female')) {
      parsed.gender = 'male';
    } else if (lowerQuery.includes('female')) {
      parsed.gender = 'female';
    } else if (lowerQuery.includes('boy') || lowerQuery.includes('man')) {
      parsed.gender = 'male';
    } else if (lowerQuery.includes('girl') || lowerQuery.includes('woman')) {
      parsed.gender = 'female';
    }

    // Extract skills (common acting skills)
    const skillKeywords = [
      'acting', 'boxing', 'dancing', 'singing', 'martial arts', 'gymnastics',
      'swimming', 'horse riding', 'stunt', 'comedy', 'drama', 'action'
    ];
    
    parsed.skills = skillKeywords.filter(skill => 
      lowerQuery.includes(skill)
    );

    // Extract physical traits
    const traitKeywords = [
      'tall', 'short', 'fair', 'dark', 'athletic', 'slim', 'muscular'
    ];
    
    parsed.physicalTraits = traitKeywords.filter(trait => 
      lowerQuery.includes(trait)
    );

    // Extract remaining keywords
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const excludeWords = [
      'with', 'who', 'knows', 'year', 'old', 'and', 'the', 'actor', 'actress'
    ];
    
    parsed.keywords = words.filter(w => 
      !excludeWords.includes(w.toLowerCase()) &&
      !skillKeywords.includes(w.toLowerCase()) &&
      !traitKeywords.includes(w.toLowerCase())
    );

    this.parsedQuery.set(parsed);
    this.logger.log('Parsed search query:', parsed);
  }

  /**
   * Extract visual tags from search query
   */
  private extractSearchTags(query: string): void {
    const parsed = this.parsedQuery();
    const tags: string[] = [];

    if (parsed.gender) {
      tags.push(parsed.gender);
    }

    if (parsed.ageRange) {
      tags.push(`${parsed.ageRange.min}-${parsed.ageRange.max} years`);
    }

    if (parsed.skills && parsed.skills.length > 0) {
      tags.push(...parsed.skills.slice(0, 3));
    }

    if (parsed.physicalTraits && parsed.physicalTraits.length > 0) {
      tags.push(...parsed.physicalTraits.slice(0, 2));
    }

    this.searchTags.set(tags.slice(0, 5)); // Limit to 5 tags
  }

  /**
   * Calculate relevance score for search ranking
   */
  private calculateRelevance(
    actor: ActorSearchResult, 
    searchText: string, 
    parsed: ParsedSearchQuery
  ): number {
    let score = 0;

    // Exact name match is highest priority
    if (actor.stageName?.toLowerCase() === searchText) {
      score += 100;
    } else if (actor.stageName?.toLowerCase().includes(searchText)) {
      score += 50;
    }

    // Skills match
    if (parsed.skills && parsed.skills.length > 0) {
      const matchingSkills = actor.skills?.filter(skill =>
        typeof skill === 'string' && 
        parsed.skills!.some(s => skill.toLowerCase().includes(s))
      ).length || 0;
      score += matchingSkills * 20;
    }

    // Age match
    if (parsed.ageRange) {
      const actorAge = parseInt(actor.age || '0');
      if (actorAge >= parsed.ageRange.min && actorAge <= parsed.ageRange.max) {
        score += 30;
      }
    }

    // Gender match
    if (parsed.gender && actor.gender?.toLowerCase() === parsed.gender) {
      score += 25;
    }

    // Popular actors boost (based on view count)
    score += Math.min((actor.profileViewCount || 0) / 10, 10);

    // Wishlist count boost
    score += Math.min((actor.wishlistCount || 0) / 5, 5);

    return score;
  }

  /**
   * Convert height to inches for comparison
   */
  private convertToInches(feet: string, inches: string): number {
    const ft = parseInt(feet) || 0;
    const inch = parseInt(inches) || 0;
    return ft * 12 + inch;
  }

  /**
   * Parse height string (e.g., "5'8\"", "5 feet 8 inches", "173cm")
   */
  private parseHeight(height: string): number {
    if (!height) return 0;

    // Try feet'inches" format
    const feetInchesMatch = height.match(/(\d+)'\s*(\d+)/);
    if (feetInchesMatch) {
      return parseInt(feetInchesMatch[1]) * 12 + parseInt(feetInchesMatch[2]);
    }

    // Try cm format
    const cmMatch = height.match(/(\d+)\s*cm/i);
    if (cmMatch) {
      return Math.round(parseInt(cmMatch[1]) / 2.54); // Convert cm to inches
    }

    return 0;
  }

  removeTag(tag: string): void {
    const currentTags = this.searchTags();
    this.searchTags.set(currentTags.filter(t => t !== tag));
    
    // Update search query
    const query = this.searchQuery();
    const newQuery = query.replace(tag, '').trim();
    this.searchQuery.set(newQuery);
  }

  /**
   * Check if user has applied any non-default filters
   */
  hasActiveFilters(): boolean {
    const currentFilters = this.filters();
    return (
      currentFilters.gender !== 'any' ||
      currentFilters.minAge !== 18 ||
      currentFilters.maxAge !== 50 ||
      currentFilters.heightFt !== '' ||
      currentFilters.heightIn !== '' ||
      currentFilters.weight !== '' ||
      currentFilters.languages.length > 0
    );
  }

  applyFilters(): void {
    // Filters are automatically applied via computed signal
  }

  toggleWishlist(actor: ActorSearchResult): void {
    const currentWishlist = this.wishlist();
    const index = currentWishlist.findIndex(a => a.uid === actor.uid);
    
    if (index > -1) {
      // Remove from wishlist
      this.wishlist.set(currentWishlist.filter(a => a.uid !== actor.uid));
    } else {
      // Add to wishlist
      this.wishlist.set([...currentWishlist, actor]);
    }
  }

  isInWishlist(actor: ActorSearchResult): boolean {
    return this.wishlist().some(a => a.uid === actor.uid);
  }

  viewProfile(actor: ActorSearchResult): void {
    // Navigate to actor profile or chat
    this.router.navigate(['/discover/chat'], { 
      queryParams: { userId: actor.uid }
    });
  }

  viewAllWishlist(): void {
    // Could navigate to a dedicated wishlist page or export
    this.logger.log('View all wishlist:', this.wishlist());
  }
}