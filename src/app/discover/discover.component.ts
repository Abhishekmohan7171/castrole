import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
    <div class="min-h-screen bg-black text-neutral-200">
      <!-- Loader -->
      <app-loader [show]="isLoggingOut" message="Logging out..."></app-loader>
      <!-- Top bar -->
      <header class="sticky top-0 z-40 bg-black/70 backdrop-blur">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <a routerLink="/discover" class="text-3xl font-black tracking-wider text-neutral-300 select-none">castrole</a>
          <nav class="flex items-center gap-8 text-sm">
            <a routerLink="/discover" routerLinkActive="text-fuchsia-300" [routerLinkActiveOptions]="{ exact: true }" class="text-neutral-500 hover:text-neutral-300 transition">discover</a>
            <a routerLink="/discover/upload" routerLinkActive="text-fuchsia-300" class="text-neutral-500 hover:text-neutral-300 transition">upload</a>
            <a routerLink="/discover/chat" routerLinkActive="text-fuchsia-300" class="text-neutral-500 hover:text-neutral-300 transition relative">
              chat
              <ng-container *ngIf="chatNotificationCount$ | async as notificationCount">
                <span
                  *ngIf="notificationCount > 0"
                  class="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-fuchsia-600 text-white text-xs animate-pulse"
                >
                  {{ notificationCount }}
                </span>
              </ng-container>
            </a>

            <!-- User profile dropdown -->
            <div class="relative" clickOutside (clickOutside)="closeDropdown()">
              <button
                (click)="toggleDropdown()"
                class="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition focus:outline-none"
                [class.text-fuchsia-300]="isProfileActive">
                <span>{{ userName }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown menu -->
              <div *ngIf="showDropdown" class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-neutral-800 ring-1 ring-black ring-opacity-5 py-1 z-50">
                <a routerLink="/discover/profile" routerLinkActive="bg-neutral-700" class="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition">Profile</a>
                <button (click)="logout()" class="w-full text-left block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition">Logout</button>
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
  styles: []
})
export class DiscoverComponent implements OnInit, OnDestroy {
  showDropdown = false;
  isLoggingOut = false;
  isProfileActive = false;
  userName = 'User';

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
                this.uid = user.uid;

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
