import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, AppNotification, NotificationType } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50" *ngIf="isOpen">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
           (click)="close()"></div>
      
      <!-- Drawer -->
      <div class="fixed right-0 top-0 h-full w-full sm:w-[480px] md:w-[520px] shadow-2xl transform transition-transform duration-300 ease-in-out"
           [ngClass]="{
             'bg-purple-950/95 backdrop-blur-xl': isActor,
             'bg-neutral-900/95 backdrop-blur-xl': !isActor
           }">
        
        <!-- Header -->
        <div class="sticky top-0 z-10 px-4 py-4 border-b"
             [ngClass]="{
               'bg-purple-950/80 border-purple-900/30': isActor,
               'bg-neutral-900/80 border-neutral-800/50': !isActor
             }">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold"
                [ngClass]="{
                  'text-purple-100': isActor,
                  'text-neutral-100': !isActor
                }">
              Notifications
            </h2>
            <button (click)="close()"
                    class="p-1.5 rounded-full transition-colors duration-200"
                    [ngClass]="{
                      'hover:bg-purple-900/30 text-purple-300': isActor,
                      'hover:bg-neutral-800/50 text-neutral-400': !isActor
                    }">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="overflow-y-auto h-[calc(100vh-80px)] px-2 py-2">
          <ng-container *ngIf="filteredNotifications.length > 0; else emptyState">
            <div *ngFor="let notification of filteredNotifications; trackBy: trackByNotificationId"
                 class="mb-2 p-3 rounded-lg transition-all duration-200 cursor-pointer"
                 [ngClass]="{
                   'bg-purple-900/20 hover:bg-purple-900/30': isActor && !notification.read,
                   'bg-purple-900/10 hover:bg-purple-900/20': isActor && notification.read,
                   'bg-neutral-800/40 hover:bg-neutral-800/60': !isActor && !notification.read,
                   'bg-neutral-800/20 hover:bg-neutral-800/40': !isActor && notification.read
                 }"
                 (click)="markAsRead(notification)">
              
              <div class="flex gap-3">
                <!-- Avatar or Icon -->
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                       [ngClass]="{
                         'bg-purple-800/50': isActor,
                         'bg-neutral-700/50': !isActor
                       }">
                    <img *ngIf="notification.metadata?.actorPhotoUrl || notification.metadata?.producerPhotoUrl; else defaultIcon"
                         [src]="notification.metadata?.actorPhotoUrl || notification.metadata?.producerPhotoUrl"
                         [alt]="notification.title"
                         class="w-full h-full object-cover">
                    <ng-template #defaultIcon>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                           [ngClass]="{
                             'text-purple-300': isActor,
                             'text-neutral-400': !isActor
                           }"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getNotificationIcon(notification.type)" />
                      </svg>
                    </ng-template>
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <h3 class="text-sm font-medium truncate"
                            [ngClass]="{
                              'text-purple-100': isActor && !notification.read,
                              'text-purple-200/70': isActor && notification.read,
                              'text-neutral-100': !isActor && !notification.read,
                              'text-neutral-300/70': !isActor && notification.read
                            }">
                          {{ notification.title }}
                        </h3>
                        <span *ngIf="isPremiumNotification(notification)"
                              class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-300 uppercase">
                          Premium
                        </span>
                      </div>
                      <span class="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full"
                            [ngClass]="getCategoryBadgeColor(notification.category)">
                        {{ notification.category }}
                      </span>
                    </div>
                    <span *ngIf="!notification.read"
                          class="flex-shrink-0 w-2 h-2 rounded-full"
                          [ngClass]="{
                            'bg-purple-400': isActor,
                            'bg-fuchsia-500': !isActor
                          }"></span>
                  </div>
                  
                  <p class="text-xs mt-1 line-clamp-2"
                     [ngClass]="{
                       'text-purple-300/70': isActor,
                       'text-neutral-400': !isActor
                     }">
                    {{ notification.message }}
                  </p>
                  
                  <p class="text-xs mt-1.5"
                     [ngClass]="{
                       'text-purple-400/60': isActor,
                       'text-neutral-500': !isActor
                     }">
                    {{ getRelativeTime(notification.timestamp) }}
                  </p>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #emptyState>
            <div class="flex flex-col items-center justify-center h-full py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4"
                   [ngClass]="{
                     'text-purple-800/50': isActor,
                     'text-neutral-700/50': !isActor
                   }"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p class="text-sm font-medium"
                 [ngClass]="{
                   'text-purple-300/70': isActor,
                   'text-neutral-400': !isActor
                 }">
                No notifications
              </p>
              <p class="text-xs mt-1"
                 [ngClass]="{
                   'text-purple-400/50': isActor,
                   'text-neutral-500': !isActor
                 }">
                You're all caught up!
              </p>
            </div>
          </ng-template>
        </div>

        <!-- Footer Actions -->
        <div class="sticky bottom-0 px-4 py-3 border-t"
             [ngClass]="{
               'bg-purple-950/80 border-purple-900/30': isActor,
               'bg-neutral-900/80 border-neutral-800/50': !isActor
             }">
          <button *ngIf="hasUnreadNotifications"
                  (click)="markAllAsRead()"
                  class="w-full py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200"
                  [ngClass]="{
                    'bg-purple-900/40 text-purple-200 hover:bg-purple-900/60': isActor,
                    'bg-neutral-800/60 text-neutral-200 hover:bg-neutral-800/80': !isActor
                  }">
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class NotificationDrawerComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() isActor: boolean = true;
  @Input() userId: string = '';
  @Input() isSubscribed: boolean = false;
  @Output() closeDrawer = new EventEmitter<void>();

  notifications: AppNotification[] = [];
  private subscriptions = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get filteredNotifications(): AppNotification[] {
    // Filter out analytics notifications if user is not subscribed
    return this.notifications.filter(notification => {
      if (notification.category === 'analytics' && !this.isSubscribed) {
        return false;
      }
      return true;
    });
  }

  get hasUnreadNotifications(): boolean {
    return this.filteredNotifications.some(n => !n.read);
  }

  close(): void {
    this.closeDrawer.emit();
  }

  async markAsRead(notification: AppNotification): Promise<void> {
    if (!notification.read && this.userId) {
      await this.notificationService.markAsRead(this.userId, notification.id);
    }
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
      this.close();
    }
  }

  async markAllAsRead(): Promise<void> {
    if (this.userId) {
      await this.notificationService.markAllAsRead(this.userId);
    }
  }

  trackByNotificationId(index: number, notification: AppNotification): string {
    return notification.id;
  }

  getNotificationIcon(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      // Actor notifications
      'connection_request': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'connection_accepted': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'connection_declined': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'profile_view': 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      'wishlist': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      'message': 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      'media_request': 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
      'analytics_views_monthly': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'analytics_searches_monthly': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      'profile_completeness_reminder': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'visibility_suggestion': 'M13 10V3L4 14h7v7l9-11h-7z',
      'subscription_expiry': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'subscription_renewal': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'security_alert': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'platform_update': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      // Producer notifications
      'chat_request': 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      'chat_accepted': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'chat_declined': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'actor_message': 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      'media_uploaded': 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      'shortlist_activity': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      'new_actor_matches': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      'actor_suggestions': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      'database_growth': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'shortlist_engagement': 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
      'subscription_billing': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      'producer_security_alert': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'producer_platform_update': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      // Legacy/shared
      'shortlist': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      'analytics_view': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'analytics_wishlist': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      'analytics_shortlist': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      'system': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return iconMap[type] || iconMap['system'];
  }

  getCategoryBadgeColor(category: string): string {
    const colorMap: Record<string, string> = {
      'discover': this.isActor ? 'bg-purple-500/20 text-purple-300' : 'bg-fuchsia-500/20 text-fuchsia-300',
      'chat': this.isActor ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/20 text-blue-300',
      'analytics': 'bg-amber-500/20 text-amber-300',
      'system': 'bg-neutral-500/20 text-neutral-300'
    };
    return colorMap[category] || colorMap['system'];
  }

  isPremiumNotification(notification: AppNotification): boolean {
    return notification.metadata?.isPremium === true;
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
