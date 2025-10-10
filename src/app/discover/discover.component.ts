import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Observable, Subscription, map, of, shareReplay, switchMap, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, onSnapshot, DocumentData, collection, query, where, getDocs } from '@angular/fire/firestore';
import { LoaderComponent } from '../common-components/loader/loader.component';
import { ClickOutsideDirective } from '../common-components/directives/click-outside.directive';

interface Actor {
  uid: string;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet, ClickOutsideDirective, LoaderComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-200" [ngClass]="navTheme()">
      <!-- Loader -->
      <app-loader [show]="isLoggingOut" message="Logging out..."></app-loader>
      <!-- Top bar -->
      <header class="sticky top-0 z-40 backdrop-blur"
              [ngClass]="{'bg-black/70': !isActor(), 'bg-black/60': isActor()}">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <a routerLink="/discover"
             class="text-3xl font-black tracking-wider select-none transition-colors duration-300"
             [ngClass]="{'text-purple-200/80': isActor(), 'text-neutral-300': !isActor()}">
            castrole
          </a>
          <nav class="flex items-center gap-8 text-sm">
            <a routerLink="/discover"
               #discoverLink="routerLinkActive"
               routerLinkActive
               [routerLinkActiveOptions]="{ exact: true }"
               class="transition-colors duration-200"
               [ngClass]="{
                 'text-purple-200 font-semibold': discoverLink.isActive && isActor(),
                 'text-purple-300/60 hover:text-purple-200': !discoverLink.isActive && isActor(),
                 'text-neutral-100 font-semibold': discoverLink.isActive && !isActor(),
                 'text-neutral-500 hover:text-neutral-300': !discoverLink.isActive && !isActor()
               }">discover</a>
            <!-- Upload link for actors -->
            <a *ngIf="isActor()"
               routerLink="/discover/upload"
               #uploadLink="routerLinkActive"
               routerLinkActive
               class="transition-colors duration-200"
               [ngClass]="{
                 'text-purple-200 font-semibold': uploadLink.isActive,
                 'text-purple-300/60 hover:text-purple-200': !uploadLink.isActive
               }">upload</a>
            
            <!-- Search dropdown for producers -->
            <div *ngIf="!isActor()" class="relative" clickOutside (clickOutside)="closeActorsDropdown()">
              <button
                (click)="toggleActorsDropdown()"
                class="transition-colors duration-200 focus:outline-none flex items-center gap-1"
                [ngClass]="{
                  'text-neutral-100 font-semibold': showActorsDropdown,
                  'text-neutral-500 hover:text-neutral-300': !showActorsDropdown
                }">
                search
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Actors dropdown menu -->
              <div *ngIf="showActorsDropdown"
                   class="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg shadow-lg ring-1 py-2 z-50 bg-neutral-800/95 ring-neutral-700/50 backdrop-blur-sm">
                
                <!-- Search input -->
                <div class="px-3 pb-2 sticky top-0 bg-neutral-800/95 backdrop-blur-sm">
                  <input 
                    type="text"
                    [(ngModel)]="actorSearchQuery"
                    placeholder="Search actors..."
                    class="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-fuchsia-500 text-sm">
                </div>

                <!-- Loading state -->
                <div *ngIf="loadingActors" class="px-4 py-8 text-center text-neutral-400 text-sm">
                  <div class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-fuchsia-500 border-r-transparent"></div>
                  <p class="mt-2">Loading actors...</p>
                </div>

                <!-- Actors list -->
                <div *ngIf="!loadingActors && filteredActors().length > 0" class="space-y-1">
                  <button
                    *ngFor="let actor of filteredActors()"
                    (click)="selectActor(actor)"
                    class="w-full text-left px-4 py-3 hover:bg-fuchsia-500/10 transition-colors duration-200 flex items-center gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold">
                      {{ actor.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-neutral-200 font-medium truncate">{{ actor.name }}</p>
                      <p class="text-neutral-400 text-xs truncate">{{ actor.email }}</p>
                    </div>
                  </button>
                </div>

                <!-- Empty state -->
                <div *ngIf="!loadingActors && filteredActors().length === 0" class="px-4 py-8 text-center text-neutral-400 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No actors found</p>
                </div>
              </div>
            </div>
            <a routerLink="/discover/chat"
               #chatLink="routerLinkActive"
               routerLinkActive
               class="relative transition-colors duration-200"
               [ngClass]="{
                 'text-purple-200 font-semibold': chatLink.isActive && isActor(),
                 'text-purple-300/60 hover:text-purple-200': !chatLink.isActive && isActor(),
                 'text-neutral-100 font-semibold': chatLink.isActive && !isActor(),
                 'text-neutral-500 hover:text-neutral-300': !chatLink.isActive && !isActor()
               }">
              chat
              <ng-container *ngIf="chatNotificationCount$ | async as notificationCount">
                <span
                  *ngIf="notificationCount > 0"
                  class="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full text-white text-xs animate-pulse"
                  [ngClass]="{
                    'bg-purple-500': isActor(),
                    'bg-fuchsia-600': !isActor()
                  }"
                >
                  {{ notificationCount }}
                </span>
              </ng-container>
            </a>

            <!-- User profile dropdown -->
            <div class="relative" clickOutside (clickOutside)="closeDropdown()">
              <button
                (click)="toggleDropdown()"
                class="flex items-center gap-2 transition-colors duration-200 focus:outline-none"
                [ngClass]="{
                  'text-purple-300 hover:text-purple-200': isProfileActive && isActor(),
                  'text-purple-300/60 hover:text-purple-200': !isProfileActive && isActor(),
                  'text-neutral-100 font-semibold': isProfileActive && !isActor(),
                  'text-neutral-400 hover:text-neutral-200': !isProfileActive && !isActor()
                }">
                <ng-container *ngIf="userNameLoaded; else loadingName">
                  <span>{{ userName }}</span>
                </ng-container>
                <ng-template #loadingName>
                  <span class="inline-flex items-center">
                    <span class="inline-block h-2.5 w-20 bg-neutral-700/50 rounded animate-pulse"></span>
                  </span>
                </ng-template>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown menu -->
              <div *ngIf="showDropdown"
                   class="absolute right-0 mt-2 w-48 rounded-md shadow-lg ring-1 py-1 z-50 transition-all duration-200"
                   [ngClass]="{
                     'bg-purple-950/40 ring-purple-900/10 backdrop-blur-xl': isActor(),
                     'bg-neutral-800/95 ring-neutral-700/50 backdrop-blur-sm': !isActor()
                   }">
                <a routerLink="/discover/profile"
                   [routerLinkActive]="isActor() ? 'bg-purple-900/25' : 'bg-fuchsia-500/10'"
                   class="block px-4 py-2 text-sm transition-colors duration-200"
                   [ngClass]="{
                     'text-purple-200/90 hover:bg-purple-900/15': isActor(),
                     'text-neutral-200 hover:bg-fuchsia-500/10': !isActor()
                   }">
                  Profile
                </a>
                <button (click)="logout()"
                        class="w-full text-left block px-4 py-2 text-sm transition-colors duration-200"
                        [ngClass]="{
                          'text-purple-200/90 hover:bg-purple-900/25': isActor(),
                          'text-neutral-200 hover:bg-fuchsia-500/10': !isActor()
                        }">
                  Logout
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <!-- Child content -->
      <main class="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    /* Subtle purple gradient background for actors */
    .actor-theme::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at top left, rgba(147, 51, 234, 0.025) 0%, transparent 35%),
                  radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.015) 0%, transparent 35%);
      pointer-events: none;
      z-index: 0;
    }
    .actor-theme {
      position: relative;
    }
    /* Ensure header stays above the gradient */
    header {
      position: relative;
      z-index: 40;
    }
    main {
      position: relative;
      z-index: 1;
    }
  `]
})
export class DiscoverComponent implements OnInit, OnDestroy {
  showDropdown = false;
  isLoggingOut = false;
  isProfileActive = false;
  userName = '';
  userNameLoaded = false;

  // User role signals
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');
  navTheme = computed(() => this.isActor() ? 'actor-theme' : '');

  // Actors search dropdown
  showActorsDropdown = false;
  actorSearchQuery = '';
  loadingActors = false;
  allActors = signal<Actor[]>([]);
  filteredActors = computed(() => {
    const query = this.actorSearchQuery.toLowerCase().trim();
    if (!query) {
      return this.allActors();
    }
    return this.allActors().filter(actor => 
      actor.name.toLowerCase().includes(query) || 
      actor.email.toLowerCase().includes(query)
    );
  });

  // Chat notification count for the header
  chatNotificationCount$: Observable<number>;
  private subscriptions = new Subscription();
  private uid: string | null = null;

  private firebaseAuth: Auth;
  private firestore: Firestore;

  constructor(
    private auth: AuthService,
    private router: Router,
    private chatService: ChatService
  ) {
    // Initialize with empty observable
    this.chatNotificationCount$ = of(0);
    this.firebaseAuth = inject(Auth);
    this.firestore = inject(Firestore);
  }

  ngOnInit(): void {
    // Subscribe to router events to clear notifications when navigating to chat
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        // If navigating to chat page, refresh notification count
        if (event.url.includes('/chat') && this.uid) {
          this.refreshNotificationCount();
        }
      })
    );

    // Get current user data
    this.subscriptions.add(
      onAuthStateChanged(this.firebaseAuth, (user) => {
        if (user) {
          // Get user document from Firestore
          this.subscriptions.add(
            this.getUserDoc(user.uid).subscribe((userData: DocumentData | undefined) => {
              if (userData) {
                this.userName = userData['name'] || user.email?.split('@')[0] || 'User';
                this.userNameLoaded = true;
                this.uid = user.uid;
                // Set user role for theming
                this.userRole.set(userData['role'] || 'actor');

                // Initialize chat notification count
                if (userData['role'] === 'actor') {
                  // For actors, combine unread messages and requests
                  const chatUnread$ = this.chatService.getTotalUnreadCount(user.uid, userData['role']);
                  const requestsCount$ = this.chatService.getChatRequestsCount(user.uid);
                  this.chatNotificationCount$ = chatUnread$.pipe(
                    switchMap(unreadCount =>
                      requestsCount$.pipe(
                        map(requestCount => unreadCount + requestCount)
                      )
                    ),
                    shareReplay(1)
                  );
                } else {
                  // For producers, just show unread messages
                  this.chatNotificationCount$ = this.chatService.getTotalUnreadCount(user.uid, userData['role'] || 'producer');
                }
              }
            })
          );
        }
      })
    );

    // Check if profile route is active
    this.isProfileActive = this.router.url.includes('/profile');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }
  closeDropdown(): void {
    this.showDropdown = false;
  }

  // Actors dropdown methods
  toggleActorsDropdown(): void {
    this.showActorsDropdown = !this.showActorsDropdown;
    if (this.showActorsDropdown && this.allActors().length === 0) {
      this.loadActors();
    }
  }

  closeActorsDropdown(): void {
    this.showActorsDropdown = false;
    this.actorSearchQuery = '';
  }

  // Load all actors from Firestore
  async loadActors(): Promise<void> {
    this.loadingActors = true;
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('role', '==', 'actor'));
      const querySnapshot = await getDocs(q);
      
      const actors: Actor[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        actors.push({
          uid: doc.id,
          name: data['name'] || 'Unknown',
          email: data['email'] || '',
          role: data['role'] || 'actor'
        });
      });
      
      this.allActors.set(actors);
    } catch (error) {
      console.error('Error loading actors:', error);
    } finally {
      this.loadingActors = false;
    }
  }

  // Select an actor (navigate to chat or profile)
  selectActor(actor: Actor): void {
    this.closeActorsDropdown();
    // Navigate to chat with this actor
    this.router.navigate(['/discover/chat'], { 
      queryParams: { userId: actor.uid }
    });
  }

  // Get user document from Firestore
  getUserDoc(uid: string): Observable<DocumentData | undefined> {
    return new Observable<DocumentData | undefined>(observer => {
      const userDocRef = doc(this.firestore, 'users', uid);

      // Subscribe to document changes
      const unsubscribe = onSnapshot(userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            observer.next(docSnap.data());
          } else {
            observer.next(undefined);
          }
        },
        (error) => {
          console.error('Error fetching user document:', error);
          observer.error(error);
        }
      );

      // Return unsubscribe function
      return () => unsubscribe();
    });
  }

  logout(): void {
    this.isLoggingOut = true;
    this.auth.logout().then(() => {
      this.router.navigate(['/login']);
    }).catch((error: Error) => {
      console.error('Logout error:', error);
      this.isLoggingOut = false;
    }).finally(() => {
      this.isLoggingOut = false;
    });
  }

  // Refresh notification count manually
  refreshNotificationCount(): void {
    if (this.uid) {
      // Get the user document to determine role
      this.getUserDoc(this.uid).pipe(take(1)).subscribe(userData => {
        if (userData) {
          // Update role for theming
          this.userRole.set(userData['role'] || 'actor');
          if (userData['role'] === 'actor') {
            // For actors, combine unread messages and requests
            // Force re-create observables to get fresh data
            const chatUnread$ = this.chatService.getTotalUnreadCount(this.uid!, userData['role']);
            const requestsCount$ = this.chatService.getChatRequestsCount(this.uid!);
            this.chatNotificationCount$ = chatUnread$.pipe(
              switchMap(unreadCount =>
                requestsCount$.pipe(
                  map(requestCount => unreadCount + requestCount)
                )
              ),
              shareReplay(1)
            );
          } else {
            // For producers, just show unread messages
            // Force re-create observable to get fresh data
            this.chatNotificationCount$ = this.chatService.getTotalUnreadCount(this.uid!, userData['role'] || 'producer');
          }

          // Force a refresh by subscribing
          this.subscriptions.add(
            this.chatNotificationCount$.subscribe()
          );
        }
      });
    }
  }
}
