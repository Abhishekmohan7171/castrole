import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Notification {
  id: string;
  type: 'message' | 'request' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  avatarUrl?: string;
  actionUrl?: string;
}

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
                    <img *ngIf="notification.avatarUrl; else defaultIcon"
                         [src]="notification.avatarUrl"
                         [alt]="notification.title"
                         class="w-full h-full object-cover">
                    <ng-template #defaultIcon>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                           [ngClass]="{
                             'text-purple-300': isActor,
                             'text-neutral-400': !isActor
                           }"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path *ngIf="notification.type === 'message'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        <path *ngIf="notification.type === 'request'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        <path *ngIf="notification.type === 'system'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </ng-template>
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-sm font-medium truncate"
                        [ngClass]="{
                          'text-purple-100': isActor && !notification.read,
                          'text-purple-200/70': isActor && notification.read,
                          'text-neutral-100': !isActor && !notification.read,
                          'text-neutral-300/70': !isActor && notification.read
                        }">
                      {{ notification.title }}
                    </h3>
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
export class NotificationDrawerComponent {
  @Input() isOpen: boolean = false;
  @Input() isActor: boolean = true;
  @Input() notifications: Notification[] = [];
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<Notification>();
  @Output() markAsReadEvent = new EventEmitter<Notification>();
  @Output() markAllAsReadEvent = new EventEmitter<void>();

  get filteredNotifications(): Notification[] {
    return this.notifications;
  }

  get hasUnreadNotifications(): boolean {
    return this.filteredNotifications.some(n => !n.read);
  }

  close(): void {
    this.closeDrawer.emit();
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.markAsReadEvent.emit(notification);
    }
    if (notification.actionUrl) {
      this.notificationClick.emit(notification);
    }
  }

  markAllAsRead(): void {
    this.markAllAsReadEvent.emit();
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
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
