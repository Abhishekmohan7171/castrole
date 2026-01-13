import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
  NavigationEnd,
} from '@angular/router';
import {
  Observable,
  Subscription,
  map,
  of,
  shareReplay,
  switchMap,
  filter,
  take,
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  onSnapshot,
  DocumentData,
} from '@angular/fire/firestore';
import { Storage, ref, getDownloadURL } from '@angular/fire/storage';
import { LoaderComponent } from '../common-components/loader/loader.component';
import { ClickOutsideDirective } from '../common-components/directives/click-outside.directive';
import { Profile } from '../../assets/interfaces/profile.interfaces';
import {
  NotificationDrawerComponent,
  Notification,
} from './notification-drawer/notification-drawer.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ClickOutsideDirective,
    LoaderComponent,
    NotificationDrawerComponent,
  ],
  template: `
    <div class="min-h-screen bg-black text-neutral-200" [ngClass]="navTheme()">
      <!-- Loader -->
      <app-loader [show]="isLoggingOut" [isActor]="isActor()" message="Logging out..."></app-loader>
      <!-- Top bar -->
      <header
        class="sticky top-0 z-40 backdrop-blur-xl border-b"
        [ngClass]="{
          'bg-gradient-to-b from-purple-950/40 via-purple-950/20 to-transparent border-purple-900/20': isActor(),
          'bg-gradient-to-b from-[#101214]/80 via-[#101214]/40 to-transparent border-neutral-800/30': !isActor()
        }"
      >
        <div
          class="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-2"
        >
          <a
            routerLink="/discover"
            class="text-xl sm:text-3xl font-black tracking-wider select-none transition-colors duration-300"
            [ngClass]="{
              'text-purple-200/80': isActor(),
              'text-neutral-300': !isActor()
            }"
          >
            kalacast
          </a>
          <nav class="flex items-center gap-3 sm:gap-8 text-xs sm:text-sm">
            <a
              routerLink="/discover"
              #discoverLink="routerLinkActive"
              routerLinkActive
              [routerLinkActiveOptions]="{ exact: true }"
              class="transition-colors duration-200"
              [ngClass]="{
                'text-purple-200 font-semibold':
                  discoverLink.isActive && isActor(),
                'text-purple-300/60 hover:text-purple-200':
                  !discoverLink.isActive && isActor(),
                'text-neutral-100 font-semibold':
                  discoverLink.isActive && !isActor(),
                'text-neutral-500 hover:text-neutral-300':
                  !discoverLink.isActive && !isActor()
              }"
              >discover</a
            >
            <!-- Upload link for actors -->
            <a
              *ngIf="isActor()"
              routerLink="/discover/upload"
              #uploadLink="routerLinkActive"
              routerLinkActive
              class="transition-colors duration-200"
              [ngClass]="{
                'text-purple-200 font-semibold': uploadLink.isActive,
                'text-purple-300/60 hover:text-purple-200': !uploadLink.isActive
              }"
              >upload</a
            >

            <!-- Search link for producers -->
            <a
              *ngIf="!isActor()"
              routerLink="/discover/search"
              #searchLink="routerLinkActive"
              routerLinkActive
              class="transition-colors duration-200"
              [ngClass]="{
                'text-neutral-100 font-semibold': searchLink.isActive,
                'text-neutral-500 hover:text-neutral-300': !searchLink.isActive
              }"
              >search</a
            >
            <a
              routerLink="/discover/chat"
              #chatLink="routerLinkActive"
              routerLinkActive
              class="relative transition-colors duration-200"
              [ngClass]="{
                'text-purple-200 font-semibold': chatLink.isActive && isActor(),
                'text-purple-300/60 hover:text-purple-200':
                  !chatLink.isActive && isActor(),
                'text-neutral-100 font-semibold':
                  chatLink.isActive && !isActor(),
                'text-neutral-500 hover:text-neutral-300':
                  !chatLink.isActive && !isActor()
              }"
            >
              chat
              <ng-container
                *ngIf="chatNotificationCount$ | async as notificationCount"
              >
                <span
                  *ngIf="notificationCount > 0"
                  class="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full text-white text-xs animate-pulse"
                  [ngClass]="{
                    'bg-purple-500': isActor(),
                    'bg-[#5E7E9A]': !isActor()
                  }"
                >
                  {{ notificationCount }}
                </span>
              </ng-container>
            </a>

            <!-- Notification Bell -->
            <button
              (click)="toggleNotificationDrawer()"
              class="relative p-2 rounded-full transition-colors duration-200 focus:outline-none"
              [ngClass]="{
                'hover:bg-purple-900/20 text-purple-300': isActor(),
                'hover:bg-neutral-800/30 text-neutral-400': !isActor()
              }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <!-- Notification badge -->
              <span
                *ngIf="unreadNotificationCount() > 0"
                class="absolute top-0 right-0 w-5 h-5 flex items-center justify-center rounded-full text-white text-xs font-medium animate-pulse"
                [ngClass]="{
                  'bg-purple-500': isActor(),
                  'bg-[#5E7E9A]': !isActor()
                }"
              >
                {{
                  unreadNotificationCount() > 9
                    ? '9+'
                    : unreadNotificationCount()
                }}
              </span>
            </button>

            <!-- User profile dropdown -->
            <div class="relative" clickOutside (clickOutside)="closeDropdown()">
              <button
                (click)="toggleDropdown()"
                class="flex items-center gap-2 transition-colors duration-200 focus:outline-none"
              >
                <ng-container *ngIf="userNameLoaded; else loadingAvatar">
                  <!-- Profile photo or default avatar -->
                  <div
                    class="w-8 h-8 rounded-full overflow-hidden ring-2 transition-all duration-200"
                    [ngClass]="{
                      'ring-purple-400/50': isActor(),
                      'ring-neutral-400/50': !isActor()
                    }"
                  >
                    <img
                      *ngIf="profilePhotoUrl(); else defaultAvatar"
                      [src]="profilePhotoUrl()"
                      [alt]="userName"
                      class="w-full h-full object-cover"
                      (error)="onImageError()"
                    />
                    <ng-template #defaultAvatar>
                      <div
                        class="w-full h-full flex items-center justify-center text-xs font-semibold"
                        [ngClass]="{
                          'bg-purple-600 text-purple-100': isActor(),
                          'bg-neutral-600 text-neutral-100': !isActor()
                        }"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </ng-template>
                  </div>
                </ng-container>
                <ng-template #loadingAvatar>
                  <div
                    class="w-8 h-8 rounded-full bg-neutral-700/50 animate-pulse"
                  ></div>
                </ng-template>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  [ngClass]="{
                    'text-purple-300': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- Dropdown menu -->
              <div
                *ngIf="showDropdown"
                class="absolute right-0 mt-2 w-56 rounded-md shadow-lg ring-1 z-50 transition-all duration-200 overflow-hidden"
                [ngClass]="{
                  'bg-[#2D1C36]/95 ring-[#946BA9]/20 backdrop-blur-xl': isActor(),
                  'bg-[#101214]/95 ring-[#53565F]/50 backdrop-blur-xl':
                    !isActor()
                }"
              >
                <!-- User name header -->
                <div
                  class="px-4 py-3 border-b"
                  [ngClass]="{
                    'border-purple-900/30': isActor(),
                    'border-neutral-700/50': !isActor()
                  }"
                >
                  <p
                    class="text-sm font-semibold truncate"
                    [ngClass]="{
                      'text-purple-100': isActor(),
                      'text-neutral-100': !isActor()
                    }"
                  >
                    {{ userName }}
                  </p>
                  <p
                    class="text-xs mt-0.5"
                    [ngClass]="{
                      'text-purple-300/60': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    {{ isActor() ? 'Actor' : 'Producer' }}
                  </p>
                </div>

                <!-- Menu items -->
                <div class="py-1">
                  <a
                    routerLink="/discover/profile"
                    (click)="closeDropdown()"
                    [routerLinkActive]="
                      isActor() ? 'bg-[#946BA9]/20' : 'bg-[#515D69]/30'
                    "
                    class="block px-4 py-2 text-sm transition-colors duration-200"
                    [ngClass]="{
                      'text-white hover:bg-[#946BA9]/15': isActor(),
                      'text-neutral-200 hover:bg-[#515D69]/20': !isActor()
                    }"
                  >
                    profile
                  </a>
                  <a
                    routerLink="/discover/settings"
                    (click)="closeDropdown()"
                    [routerLinkActive]="
                      isActor() ? 'bg-[#946BA9]/20' : 'bg-[#515D69]/30'
                    "
                    class="block px-4 py-2 text-sm transition-colors duration-200"
                    [ngClass]="{
                      'text-white hover:bg-[#946BA9]/15': isActor(),
                      'text-neutral-200 hover:bg-[#515D69]/20': !isActor()
                    }"
                  >
                    <section></section>settings
                  </a>
                  <button
                    (click)="logout()"
                    class="w-full text-left block px-4 py-2 text-sm transition-colors duration-200"
                    [ngClass]="{
                      'text-white hover:bg-[#946BA9]/15': isActor(),
                      'text-neutral-200 hover:bg-[#515D69]/20': !isActor()
                    }"
                  >
                    logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <!-- Child content -->
      <main class="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <router-outlet></router-outlet>
      </main>

      <!-- Notification Drawer -->
      <app-notification-drawer
        [isOpen]="showNotificationDrawer()"
        [isActor]="isActor()"
        [notifications]="notifications()"
        (closeDrawer)="closeNotificationDrawer()"
        (notificationClick)="handleNotificationClick($event)"
        (markAsReadEvent)="markNotificationAsRead($event)"
        (markAllAsReadEvent)="markAllNotificationsAsRead()"
      >
      </app-notification-drawer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      /* Actor gradient background - subtle like producer */
      .actor-theme::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          180deg,
          #14081bff 0%,
          #000000 100%
        );
        pointer-events: none;
        z-index: 0;
      }
      .actor-theme {
        position: relative;
      }
      /* Producer gradient background */
      .producer-theme::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          180deg,
          
          #0d1419 30%,
          #000000 100%
        );
        pointer-events: none;
        z-index: 0;
      }
      .producer-theme {
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
    `,
  ],
})
export class DiscoverComponent implements OnInit, OnDestroy {
  showDropdown = false;
  isLoggingOut = false;
  isProfileActive = false;
  userName = '';
  userNameLoaded = false;
  profilePhotoUrl = signal<string | undefined>(undefined);

  // User role signals
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');
  navTheme = computed(() => (this.isActor() ? 'actor-theme' : 'producer-theme'));

  // Notification drawer
  showNotificationDrawer = signal<boolean>(false);
  notifications = signal<Notification[]>([]);
  unreadNotificationCount = computed(() => {
    return this.notifications().filter((n) => !n.read).length;
  });

  // Chat notification count for the header
  chatNotificationCount$: Observable<number>;
  private subscriptions = new Subscription();
  private uid: string | null = null;

  private firebaseAuth: Auth;
  private firestore: Firestore;
  private storage: Storage;

  constructor(
    private auth: AuthService,
    private router: Router,
    private chatService: ChatService,
    private logger: LoggerService,
    private notificationService: NotificationService
  ) {
    // Initialize with empty observable
    this.chatNotificationCount$ = of(0);
    this.firebaseAuth = inject(Auth);
    this.firestore = inject(Firestore);
    this.storage = inject(Storage);
  }

  ngOnInit(): void {
    // Subscribe to router events to clear notifications when navigating to chat
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event: any) => {
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
            this.getUserDoc(user.uid).subscribe(
              (userData: DocumentData | undefined) => {
                if (userData) {
                  this.userName =
                    userData['name'] || user.email?.split('@')[0] || 'User';
                  this.userNameLoaded = true;
                  this.uid = user.uid;
                  // Set user role for theming
                  this.userRole.set(userData['currentRole'] || 'actor');

                  // Fetch profile photo
                  this.fetchProfilePhoto(user.uid);

                  // Initialize real-time notifications
                  this.subscriptions.add(
                    this.notificationService.observeNotifications(user.uid).subscribe(
                      (notifications) => {
                        this.notifications.set(notifications);
                      },
                      (error) => {
                        this.logger.error('Error loading notifications:', error);
                      }
                    )
                  );

                  // Auto-trigger notification checks (once per session)
                  const sessionKey = `notifications_checked_${user.uid}`;
                  if (!sessionStorage.getItem(sessionKey)) {
                    // Mark as checked for this session
                    sessionStorage.setItem(sessionKey, 'true');
                    
                    // Run checks based on user role (with error handling)
                    if (userData['currentRole'] === 'actor') {
                      // Actor-specific checks
                      this.notificationService.checkAndSendMonthlyAnalytics(user.uid).catch(err => 
                        this.logger.error('Error checking monthly analytics:', err)
                      );
                      // NOTE: checkProfileCompleteness removed - only triggers on edit-profile save
                      this.notificationService.checkSubscriptionExpiry(user.uid).catch(err => 
                        this.logger.error('Error checking subscription expiry:', err)
                      );
                      this.notificationService.checkAndSendVisibilitySuggestion(user.uid).catch(err => 
                        this.logger.error('Error checking visibility suggestion:', err)
                      );
                    } else if (userData['currentRole'] === 'producer') {
                      // Producer-specific checks
                      this.notificationService.checkWishlistMatches(user.uid).catch(err => 
                        this.logger.error('Error checking wishlist matches:', err)
                      );
                      this.notificationService.checkDatabaseGrowth(user.uid).catch(err => 
                        this.logger.error('Error checking database growth:', err)
                      );
                    }
                  }

                  // Initialize chat notification count
                  if (userData['currentRole'] === 'actor') {
                    // For actors, combine unread messages and requests
                    const chatUnread$ = this.chatService.getTotalUnreadCount(
                      user.uid,
                      userData['currentRole']
                    );
                    const requestsCount$ =
                      this.chatService.getChatRequestsCount(user.uid);
                    this.chatNotificationCount$ = chatUnread$.pipe(
                      switchMap((unreadCount) =>
                        requestsCount$.pipe(
                          map((requestCount) => unreadCount + requestCount)
                        )
                      ),
                      shareReplay(1)
                    );
                  } else {
                    // For producers, just show unread messages
                    this.chatNotificationCount$ =
                      this.chatService.getTotalUnreadCount(
                        user.uid,
                        userData['currentRole'] || 'producer'
                      );
                  }
                }
              }
            )
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
    return new Observable<DocumentData | undefined>((observer) => {
      const userDocRef = doc(this.firestore, 'users', uid);

      // Subscribe to document changes
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            observer.next(docSnap.data());
          } else {
            observer.next(undefined);
          }
        },
        (error) => {
          this.logger.error('Error fetching user document:', error);
          observer.error(error);
        }
      );

      // Return unsubscribe function
      return () => unsubscribe();
    });
  }

  logout(): void {
    this.isLoggingOut = true;
    this.auth
      .logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch((error: Error) => {
        this.logger.error('Logout error:', error);
        this.isLoggingOut = false;
      })
      .finally(() => {
        this.isLoggingOut = false;
      });
  }

  // Refresh notification count manually
  refreshNotificationCount(): void {
    if (this.uid) {
      // Get the user document to determine role
      this.getUserDoc(this.uid)
        .pipe(take(1))
        .subscribe((userData) => {
          if (userData) {
            // Update role for theming
            this.userRole.set(userData['currentRole'] || 'actor');
            if (userData['currentRole'] === 'actor') {
              // For actors, combine unread messages and requests
              // Force re-create observables to get fresh data
              const chatUnread$ = this.chatService.getTotalUnreadCount(
                this.uid!,
                userData['currentRole']
              );
              const requestsCount$ = this.chatService.getChatRequestsCount(
                this.uid!
              );
              this.chatNotificationCount$ = chatUnread$.pipe(
                switchMap((unreadCount) =>
                  requestsCount$.pipe(
                    map((requestCount) => unreadCount + requestCount)
                  )
                ),
                shareReplay(1)
              );
            } else {
              // For producers, just show unread messages
              // Force re-create observable to get fresh data
              this.chatNotificationCount$ =
                this.chatService.getTotalUnreadCount(
                  this.uid!,
                  userData['currentRole'] || 'producer'
                );
            }

            // Force a refresh by subscribing
            this.subscriptions.add(this.chatNotificationCount$.subscribe());
          }
        });
    }
  }

  // Fetch profile photo from Firestore
  private async fetchProfilePhoto(uid: string): Promise<void> {
    try {
      const profileDocRef = doc(this.firestore, 'profiles', uid);
      const profileDocSnap = await getDoc(profileDocRef);
      if (profileDocSnap.exists()) {
        const profileData = profileDocSnap.data() as Profile;
        const photoUrl =
          profileData.actorProfile?.actorProfileImageUrl ||
          profileData.producerProfile?.producerProfileImageUrl;
        this.profilePhotoUrl.set(photoUrl);
      }
    } catch (error) {
      this.logger.error('Error fetching profile photo:', error);
    }
  }

  // Handle image loading errors
  onImageError(): void {
  }

  // Notification drawer methods
  toggleNotificationDrawer(): void {
    this.showNotificationDrawer.update((v) => !v);
  }

  closeNotificationDrawer(): void {
    this.showNotificationDrawer.set(false);
  }

  handleNotificationClick(notification: Notification): void {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
      this.closeNotificationDrawer();
    }
  }

  async markNotificationAsRead(notification: Notification): Promise<void> {
    if (!this.uid) return;
    
    try {
      // Only mark as read, no navigation or drawer closing
      await this.notificationService.markAsRead(this.uid, notification.id);
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    if (!this.uid) return;
    
    try {
      await this.notificationService.markAllAsRead(this.uid);
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
    }
  }

}
