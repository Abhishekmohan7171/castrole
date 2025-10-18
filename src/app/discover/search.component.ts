import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, query, where, getDocs, DocumentData } from '@angular/fire/firestore';

interface Actor {
  uid: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  height?: string;
  weight?: string;
  skills?: string[];
  photoURL?: string;
}

interface SearchFilters {
  characterType: string;
  minAge: number;
  maxAge: number;
  gender: string;
  heightFt: string;
  heightIn: string;
  weightItch: string;
  languages: string[];
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
                    [(ngModel)]="filters().weightItch"
                    placeholder="itch"
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
            } @else if (filteredActors().length > 0) {
              <!-- Results -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (actor of filteredActors(); track actor.uid) {
                  <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden hover:border-fuchsia-500/50 transition-all duration-300 group">
                    <!-- Actor Photo -->
                    <div class="relative aspect-[3/4] bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
                      @if (actor.photoURL) {
                        <img [src]="actor.photoURL" [alt]="actor.name" class="w-full h-full object-cover">
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-6xl font-bold text-neutral-700">
                          {{ actor.name.charAt(0).toUpperCase() }}
                        </div>
                      }
                      
                      <!-- Hover Overlay -->
                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <!-- Actor Info -->
                    <div class="p-4">
                      <h3 class="text-lg font-semibold text-neutral-100 mb-1">{{ actor.name }}</h3>
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
            } @else {
              <!-- Empty State -->
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-neutral-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 class="text-xl font-semibold text-neutral-400 mb-2">No actors found</h3>
                <p class="text-neutral-500">Try adjusting your search or filters</p>
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
                        {{ actor.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-neutral-200 truncate">{{ actor.name }}</p>
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
export class SearchComponent implements OnInit {
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Search state
  searchQuery = signal('');
  searchTags = signal<string[]>([]);
  
  // Actors data
  allActors = signal<Actor[]>([]);
  loading = signal(true);
  
  // Filters
  filters = signal<SearchFilters>({
    characterType: 'any',
    minAge: 18,
    maxAge: 50,
    gender: 'any',
    heightFt: '',
    heightIn: '',
    weightItch: '',
    languages: []
  });

  // Wishlist
  wishlist = signal<Actor[]>([]);

  // Computed filtered actors
  filteredActors = computed(() => {
    let actors = this.allActors();
    const query = this.searchQuery().toLowerCase();
    const currentFilters = this.filters();

    // Apply search query
    if (query) {
      actors = actors.filter(actor => 
        actor.name.toLowerCase().includes(query) ||
        actor.email.toLowerCase().includes(query) ||
        actor.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (currentFilters.gender !== 'any') {
      actors = actors.filter(actor => actor.gender?.toLowerCase() === currentFilters.gender);
    }

    if (currentFilters.minAge || currentFilters.maxAge) {
      actors = actors.filter(actor => {
        const age = actor.age || 0;
        return age >= currentFilters.minAge && age <= currentFilters.maxAge;
      });
    }

    return actors;
  });

  ngOnInit(): void {
    this.loadActors();
  }

  async loadActors(): Promise<void> {
    this.loading.set(true);
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('currentRole', '==', 'actor'));
      const querySnapshot = await getDocs(q);
      
      const actors: Actor[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        actors.push({
          uid: doc.id,
          name: data['name'] || 'Unknown',
          email: data['email'] || '',
          age: data['age'],
          gender: data['gender'],
          height: data['height'],
          weight: data['weight'],
          skills: data['skills'] || [],
          photoURL: data['photoURL']
        });
      });
      
      this.allActors.set(actors);
    } catch (error) {
      console.error('Error loading actors:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(): void {
    // Extract tags from search query (simple implementation)
    const query = this.searchQuery();
    const words = query.split(' ').filter(w => w.length > 2);
    this.searchTags.set(words.slice(0, 5)); // Limit to 5 tags
  }

  removeTag(tag: string): void {
    const currentTags = this.searchTags();
    this.searchTags.set(currentTags.filter(t => t !== tag));
    
    // Update search query
    const query = this.searchQuery();
    const newQuery = query.replace(tag, '').trim();
    this.searchQuery.set(newQuery);
  }

  applyFilters(): void {
    // Filters are automatically applied via computed signal
  }

  toggleWishlist(actor: Actor): void {
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

  isInWishlist(actor: Actor): boolean {
    return this.wishlist().some(a => a.uid === actor.uid);
  }

  viewProfile(actor: Actor): void {
    // Navigate to actor profile or chat
    this.router.navigate(['/discover/chat'], { 
      queryParams: { userId: actor.uid }
    });
  }

  viewAllWishlist(): void {
    // Could navigate to a dedicated wishlist page or export
    console.log('View all wishlist:', this.wishlist());
  }
}