import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Observable, Subscription, map, of, shareReplay, switchMap, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, onSnapshot, DocumentData } from '@angular/fire/firestore';
import { LoaderComponent } from '../common-components/loader/loader.component';
import { ClickOutsideDirective } from '../common-components/directives/click-outside.directive';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ClickOutsideDirective, LoaderComponent],
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
            <a routerLink="/discover/upload"
               #uploadLink="routerLinkActive"
               routerLinkActive
               class="transition-colors duration-200"
               [ngClass]="{
                 'text-purple-200 font-semibold': uploadLink.isActive && isActor(),
                 'text-purple-300/60 hover:text-purple-200': !uploadLink.isActive && isActor(),
                 'text-neutral-100 font-semibold': uploadLink.isActive && !isActor(),
                 'text-neutral-500 hover:text-neutral-300': !uploadLink.isActive && !isActor()
               }">upload</a>
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
