import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, writeBatch, Timestamp, getDocs, serverTimestamp } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { LoggerService } from './logger.service';

export type NotificationType = 
  | 'profile_view' 
  | 'wishlist' 
  | 'shortlist' 
  | 'chat_request' 
  | 'chat_accepted' 
  | 'message' 
  | 'analytics_view'
  | 'analytics_wishlist'
  | 'analytics_shortlist'
  | 'system';

export type NotificationCategory = 'discover' | 'chat' | 'analytics' | 'system';

export interface NotificationMetadata {
  actorId?: string;
  actorName?: string;
  actorPhotoUrl?: string;
  producerId?: string;
  producerName?: string;
  producerPhotoUrl?: string;
  chatId?: string;
  isPremium?: boolean;
  analyticsType?: string;
  viewCount?: number;
  profileId?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata: NotificationMetadata;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore = inject(Firestore);
  private logger = inject(LoggerService);

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private unsubscribe: (() => void) | null = null;

  /**
   * Initialize notification listener for a user
   */
  initializeNotifications(userId: string): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const notificationsRef = collection(this.firestore, `notifications/${userId}/items`);
    const q = query(
      notificationsRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: AppNotification[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data['userId'],
            type: data['type'],
            category: data['category'],
            title: data['title'],
            message: data['message'],
            timestamp: data['timestamp']?.toDate() || new Date(),
            read: data['read'] || false,
            actionUrl: data['actionUrl'],
            metadata: data['metadata'] || {}
          } as AppNotification;
        });

        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);
      },
      (error) => {
        this.logger.error('Error listening to notifications:', error);
      }
    );
  }

  /**
   * Stop listening to notifications
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Create a notification for profile view (Actor receives this)
   */
  async createProfileViewNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'profile_view',
        category: 'discover',
        title: 'Profile View',
        message: `${producerName} viewed your profile`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/profile`,
        metadata: {
          producerId,
          producerName,
          producerPhotoUrl
        }
      });
    } catch (error) {
      this.logger.error('Error creating profile view notification:', error);
    }
  }

  /**
   * Create a notification for wishlist addition (Actor receives this)
   */
  async createWishlistNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'wishlist',
        category: 'discover',
        title: 'Added to Wishlist',
        message: `${producerName} added you to their wishlist`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/profile`,
        metadata: {
          producerId,
          producerName,
          producerPhotoUrl
        }
      });
    } catch (error) {
      this.logger.error('Error creating wishlist notification:', error);
    }
  }

  /**
   * Create a notification for shortlist addition (Actor receives this)
   */
  async createShortlistNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'shortlist',
        category: 'discover',
        title: 'Added to Shortlist',
        message: `${producerName} shortlisted you`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/profile`,
        metadata: {
          producerId,
          producerName,
          producerPhotoUrl
        }
      });
    } catch (error) {
      this.logger.error('Error creating shortlist notification:', error);
    }
  }

  /**
   * Create a notification for chat request acceptance (Producer receives this)
   */
  async createChatAcceptedNotification(
    producerId: string,
    actorId: string,
    actorName: string,
    chatId: string,
    actorPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'chat_accepted',
        category: 'chat',
        title: 'Chat Request Accepted',
        message: `${actorName} accepted your chat request`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/chat?chatId=${chatId}`,
        metadata: {
          actorId,
          actorName,
          actorPhotoUrl,
          chatId
        }
      });
    } catch (error) {
      this.logger.error('Error creating chat accepted notification:', error);
    }
  }

  /**
   * Create analytics notification (Premium feature)
   */
  async createAnalyticsNotification(
    userId: string,
    userRole: 'actor' | 'producer',
    analyticsType: 'view' | 'wishlist' | 'shortlist',
    count: number,
    isPremium: boolean = true
  ): Promise<void> {
    if (!isPremium) {
      return;
    }

    try {
      const notificationsRef = collection(this.firestore, `notifications/${userId}/items`);
      
      const typeMessages = {
        view: `Your profile received ${count} new views`,
        wishlist: `You were added to ${count} new wishlists`,
        shortlist: `You were added to ${count} new shortlists`
      };

      await addDoc(notificationsRef, {
        userId,
        type: `analytics_${analyticsType}`,
        category: 'analytics',
        title: 'Analytics Update',
        message: typeMessages[analyticsType],
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/settings/analytics`,
        metadata: {
          isPremium: true,
          analyticsType,
          viewCount: count
        }
      });
    } catch (error) {
      this.logger.error('Error creating analytics notification:', error);
    }
  }

  /**
   * Create a new message notification
   */
  async createMessageNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    chatId: string,
    messagePreview: string,
    senderPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${recipientId}/items`);
      
      await addDoc(notificationsRef, {
        userId: recipientId,
        type: 'message',
        category: 'chat',
        title: `New message from ${senderName}`,
        message: messagePreview.substring(0, 100),
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/chat?chatId=${chatId}`,
        metadata: {
          actorId: senderId,
          actorName: senderName,
          actorPhotoUrl: senderPhotoUrl,
          chatId
        }
      });
    } catch (error) {
      this.logger.error('Error creating message notification:', error);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(this.firestore, `notifications/${userId}/items/${notificationId}`);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${userId}/items`);
      const q = query(notificationsRef, where('read', '==', false));
      const snapshot = await getDocs(q);

      const batch = writeBatch(this.firestore);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(this.firestore, `notifications/${userId}/items/${notificationId}`);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      this.logger.error('Error deleting notification:', error);
    }
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(notifications: AppNotification[]): void {
    const unreadCount = notifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Batch create analytics notifications for weekly/daily summaries
   */
  async createAnalyticsSummaryNotification(
    userId: string,
    isPremium: boolean,
    summaryData: {
      views: number;
      wishlists: number;
      shortlists: number;
      period: 'daily' | 'weekly';
    }
  ): Promise<void> {
    if (!isPremium) {
      return;
    }

    try {
      const notificationsRef = collection(this.firestore, `notifications/${userId}/items`);
      
      const message = `${summaryData.period === 'daily' ? 'Today' : 'This week'}: ${summaryData.views} views, ${summaryData.wishlists} wishlists, ${summaryData.shortlists} shortlists`;

      await addDoc(notificationsRef, {
        userId,
        type: 'analytics_view',
        category: 'analytics',
        title: `${summaryData.period === 'daily' ? 'Daily' : 'Weekly'} Analytics Summary`,
        message,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/settings/analytics`,
        metadata: {
          isPremium: true,
          analyticsType: 'summary',
          viewCount: summaryData.views
        }
      });
    } catch (error) {
      this.logger.error('Error creating analytics summary notification:', error);
    }
  }
}
