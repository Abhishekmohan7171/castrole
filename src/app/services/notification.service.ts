import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, map, shareReplay } from 'rxjs';
import { LoggerService } from './logger.service';
import { 
  Notification, 
  NotificationType, 
  NotificationCategory,
  NotificationMetadata 
} from '../discover/notification-drawer/notification-drawer.component';

interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: NotificationMetadata;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private db = inject(Firestore);
  private logger = inject(LoggerService);

  /**
   * Observe notifications for a user (real-time)
   */
  observeNotifications(userId: string): Observable<Notification[]> {
    return new Observable<Notification[]>((observer) => {
      const notifsRef = collection(this.db, `users/${userId}/notifications`);
      const q = query(notifsRef, orderBy('timestamp', 'desc'), limit(50));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data['userId'],
            type: data['type'] as NotificationType,
            category: data['category'] as NotificationCategory,
            title: data['title'],
            message: data['message'],
            timestamp: data['timestamp']?.toDate() || new Date(),
            read: data['read'] || false,
            actionUrl: data['actionUrl'],
            metadata: data['metadata'] || {}
          } as Notification;
        });
        observer.next(notifications);
      }, (error) => {
        this.logger.error('Error observing notifications:', error);
        observer.error(error);
      });
      
      return () => unsubscribe();
    }).pipe(shareReplay(1));
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): Observable<number> {
    return this.observeNotifications(userId).pipe(
      map(notifications => notifications.filter(n => !n.read).length)
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notifRef = doc(this.db, `users/${userId}/notifications/${notificationId}`);
      await updateDoc(notifRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifsRef = collection(this.db, `users/${userId}/notifications`);
      const q = query(notifsRef, where('read', '==', false));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(this.db);
      snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
        this.logger.info(`Marked ${snapshot.docs.length} notifications as read`);
      }
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', error);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const notifRef = doc(this.db, `users/${userId}/notifications/${notificationId}`);
      await updateDoc(notifRef, {
        read: true
      });
    } catch (error) {
      this.logger.error('Failed to delete notification', error);
    }
  }

  /**
   * Check if user has premium subscription
   */
  private async checkUserSubscription(userId: string, userRole: 'actor' | 'producer'): Promise<boolean> {
    try {
      const profileDocRef = doc(this.db, 'profiles', userId);
      const profileDoc = await getDoc(profileDocRef);
      
      if (!profileDoc.exists()) {
        return false;
      }
      
      const profileData = profileDoc.data();
      
      if (userRole === 'actor') {
        return profileData?.['actorProfile']?.['isSubscribed'] === true;
      } else {
        return profileData?.['producerProfile']?.['isSubscribed'] === true;
      }
    } catch (error) {
      this.logger.error('Error checking user subscription:', error);
      return false;
    }
  }

  /**
   * Core method to create any notification
   */
  private async createNotification(params: CreateNotificationParams): Promise<void> {
    try {
      const notifsRef = collection(this.db, `users/${params.recipientId}/notifications`);
      
      console.log('Creating notification:', {
        type: params.type,
        recipientId: params.recipientId,
        title: params.title,
        message: params.message
      });
      
      // Filter out undefined values from metadata to prevent Firestore errors
      const cleanMetadata: Record<string, any> = {};
      if (params.metadata) {
        const metadata = params.metadata as Record<string, any>;
        Object.keys(metadata).forEach(key => {
          if (metadata[key] !== undefined) {
            cleanMetadata[key] = metadata[key];
          }
        });
      }
      
      await addDoc(notifsRef, {
        userId: params.recipientId,
        type: params.type,
        category: params.category,
        title: params.title,
        message: params.message,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: params.actionUrl,
        metadata: cleanMetadata
      });

      console.log(`✓ Notification created: ${params.type} for user ${params.recipientId}`);
      this.logger.info(`Notification created: ${params.type} for user ${params.recipientId}`);
    } catch (error) {
      console.error(`✗ Failed to create notification: ${params.type}`, error);
      this.logger.error(`Failed to create notification: ${params.type}`, error);
      throw error;
    }
  }

  // ==================== ACTOR NOTIFICATIONS (12 types) ====================

  /**
   * 1. Producer sent connection request
   */
  async createConnectionRequestNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    connectionId: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'connection_request',
      category: 'connection',
      title: 'New Connection Request',
      message: `${producerName} wants to connect with you`,
      actionUrl: `/discover/chat/requests`,
      metadata: {
        producerId,
        producerName,
        producerPhotoUrl,
        connectionId
      }
    });
  }

  /**
   * 2. Connection established with producer
   */
  async createConnectionEstablishedNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    chatRoomId: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'connection_established',
      category: 'connection',
      title: 'Connection Established',
      message: `You're now connected with ${producerName} — Start chatting`,
      actionUrl: `/discover/chat/${chatRoomId}`,
      metadata: {
        producerId,
        producerName,
        producerPhotoUrl,
        chatRoomId
      }
    });
  }

  /**
   * 3. New message from producer
   */
  async createNewMessageNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    chatRoomId: string,
    messagePreview: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'new_message',
      category: 'message',
      title: `New message from ${producerName}`,
      message: messagePreview.substring(0, 100),
      actionUrl: `/discover/chat/${chatRoomId}`,
      metadata: {
        producerId,
        producerName,
        producerPhotoUrl,
        chatRoomId
      }
    });
  }

  /**
   * 4. Producer viewed profile (Premium shows name, Free shows generic)
   */
  async createProfileViewNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    isPremium: boolean,
    producerPhotoUrl?: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'profile_view',
      category: 'analytics',
      title: 'Profile View',
      message: isPremium 
        ? `${producerName} viewed your profile`
        : 'A producer viewed your profile',
      actionUrl: isPremium ? `/discover/settings/analytics` : `/discover/settings/subscription`,
      metadata: {
        producerId,
        producerName: isPremium ? producerName : undefined,
        producerPhotoUrl: isPremium ? producerPhotoUrl : undefined,
        isPremium
      }
    });
  }

  /**
   * 5. Added to producer wishlist (Premium shows name, Free shows generic)
   */
  async createWishlistAddNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    producerPhotoUrl?: string,
    isPremium: boolean = false
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'wishlist_add',
      category: 'analytics',
      title: 'Added to Wishlist',
      message: isPremium 
        ? `${producerName} added you to their wishlist`
        : 'A producer added you to their wishlist — Subscribe to see who',
      actionUrl: isPremium ? `/discover/profile` : `/discover/settings/subscription`,
      metadata: {
        producerId,
        producerName: isPremium ? producerName : undefined,
        producerPhotoUrl: isPremium ? producerPhotoUrl : undefined,
        isPremium
      }
    });
  }

  /**
   * 6. Monthly profile views analytics (Premium only)
   */
  async createMonthlyViewsNotification(
    actorId: string,
    viewCount: number
  ): Promise<void> {
    const isPremium = await this.checkUserSubscription(actorId, 'actor');
    
    if (!isPremium) return;

    await this.createNotification({
      recipientId: actorId,
      type: 'analytics_views_monthly',
      category: 'analytics',
      title: 'Monthly Profile Views',
      message: `Your profile got ${viewCount} views this month — View full analytics`,
      actionUrl: `/discover/settings/analytics`,
      metadata: {
        viewCount,
        isPremium: true
      }
    });
  }

  /**
   * 7. Monthly search appearances (Premium only)
   */
  async createMonthlySearchesNotification(
    actorId: string,
    searchCount: number
  ): Promise<void> {
    const isPremium = await this.checkUserSubscription(actorId, 'actor');
    
    if (!isPremium) return;

    await this.createNotification({
      recipientId: actorId,
      type: 'analytics_searches_monthly',
      category: 'analytics',
      title: 'Monthly Search Appearances',
      message: `You appeared in ${searchCount} searches this month — View full analytics`,
      actionUrl: `/discover/settings/analytics`,
      metadata: {
        searchCount,
        isPremium: true
      }
    });
  }

  /**
   * 8. Profile completeness reminder
   */
  async createProfileCompletenessReminder(
    actorId: string,
    completenessPercentage: number
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'profile_completeness',
      category: 'system',
      title: 'Complete Your Profile',
      message: `Your profile is ${completenessPercentage}% complete. Add more details to increase visibility`,
      actionUrl: `/discover/edit-profile`,
      metadata: {
        completenessPercentage
      }
    });
  }

  /**
   * 9. Visibility improvement suggestion
   */
  async createVisibilitySuggestion(
    actorId: string,
    suggestion: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'visibility_suggestion',
      category: 'system',
      title: 'Improve Your Visibility',
      message: suggestion,
      actionUrl: `/discover/edit-profile`,
      metadata: {}
    });
  }

  /**
   * 10. Subscription expiry/renewal reminder (Premium)
   */
  async createSubscriptionReminderNotification(
    actorId: string,
    daysUntilExpiry: number,
    isRenewal: boolean = false
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'subscription_reminder',
      category: 'system',
      title: isRenewal ? 'Subscription Renewed' : 'Subscription Expiring Soon',
      message: isRenewal 
        ? 'Your premium subscription has been successfully renewed'
        : `Your premium subscription expires in ${daysUntilExpiry} days. Renew to keep premium features`,
      actionUrl: `/discover/settings/subscription`,
      metadata: {
        daysUntilExpiry,
        isPremium: true
      }
    });
  }

  /**
   * 11. Security or new device login alert
   */
  async createSecurityAlertNotification(
    actorId: string,
    deviceInfo: string,
    ipAddress: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'security_alert',
      category: 'system',
      title: 'New Device Login',
      message: `New login detected from ${deviceInfo}. If this wasn't you, secure your account immediately`,
      actionUrl: `/discover/settings/account`,
      metadata: {
        deviceInfo,
        ipAddress
      }
    });
  }

  /**
   * 12. Platform update/announcement
   */
  async createPlatformUpdateNotification(
    actorId: string,
    updateTitle: string,
    updateMessage: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: actorId,
      type: 'platform_update',
      category: 'system',
      title: updateTitle,
      message: updateMessage,
      actionUrl: `/discover/feed`,
      metadata: {}
    });
  }

  // ==================== PRODUCER NOTIFICATIONS (8 types) ====================

  /**
   * 1. Actor accepted connection request
   */
  async createConnectionAcceptedNotification(
    producerId: string,
    actorId: string,
    actorName: string,
    chatRoomId: string,
    actorPhotoUrl?: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: producerId,
      type: 'connection_accepted',
      category: 'connection',
      title: 'Connection Accepted',
      message: `${actorName} accepted your connection request — Start chatting`,
      actionUrl: `/discover/chat/${chatRoomId}`,
      metadata: {
        actorId,
        actorName,
        actorPhotoUrl,
        chatRoomId
      }
    });
  }

  /**
   * 2. Actor declined connection request
   */
  async createConnectionDeclinedNotification(
    producerId: string,
    actorId: string,
    actorName: string,
    actorPhotoUrl?: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: producerId,
      type: 'connection_declined',
      category: 'connection',
      title: 'Connection Declined',
      message: `${actorName} declined your connection request`,
      actionUrl: `/discover/search`,
      metadata: {
        actorId,
        actorName,
        actorPhotoUrl
      }
    });
  }

  /**
   * 3. New message from actor
   */
  async createActorMessageNotification(
    producerId: string,
    actorId: string,
    actorName: string,
    chatRoomId: string,
    messagePreview: string,
    actorPhotoUrl?: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: producerId,
      type: 'actor_message',
      category: 'message',
      title: `New message from ${actorName}`,
      message: messagePreview.substring(0, 100),
      actionUrl: `/discover/chat/${chatRoomId}`,
      metadata: {
        actorId,
        actorName,
        actorPhotoUrl,
        chatRoomId
      }
    });
  }

  /**
   * 4. New actors match wishlist
   */
  async createWishlistMatchesNotification(
    producerId: string,
    matchCount: number
  ): Promise<void> {
    await this.createNotification({
      recipientId: producerId,
      type: 'wishlist_matches',
      category: 'analytics',
      title: 'New Actor Matches',
      message: `${matchCount} new actors match your wishlist criteria`,
      actionUrl: `/discover/search`,
      metadata: {
        matchCount
      }
    });
  }

  /**
   * 5. Actor database growth update
   */
  async createDatabaseGrowthNotification(
    producerId: string,
    growthPercentage: number,
    newActorCount: number
  ): Promise<void> {
    await this.createNotification({
      recipientId: producerId,
      type: 'database_growth',
      category: 'system',
      title: 'Actor Database Growth',
      message: `Database increased by ${growthPercentage}% — ${newActorCount} new actors joined this week`,
      actionUrl: `/discover/search`,
      metadata: {
        growthPercentage,
        newActorCount
      }
    });
  }

  /**
   * 6. Subscription or billing update (Premium)
   */
  async createSubscriptionBillingNotification(
    producerId: string,
    billingMessage: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: producerId,
      type: 'subscription_billing',
      category: 'system',
      title: 'Billing Update',
      message: billingMessage,
      actionUrl: `/discover/settings/subscription`,
      metadata: {
        isPremium: true
      }
    });
  }

  /**
   * 7. Security or new device login alert (Producer)
   */
  async createProducerSecurityAlertNotification(
    producerId: string,
    deviceInfo: string,
    ipAddress: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: producerId,
      type: 'producer_security_alert',
      category: 'system',
      title: 'New Device Login',
      message: `New login detected from ${deviceInfo}. If this wasn't you, secure your account immediately`,
      actionUrl: `/discover/settings/account`,
      metadata: {
        deviceInfo,
        ipAddress
      }
    });
  }

  /**
   * 8. Platform update/new tools announcement (Producer)
   */
  async createProducerPlatformUpdateNotification(
    producerId: string,
    updateTitle: string,
    updateMessage: string
  ): Promise<void> {
    await this.createNotification({
      recipientId: producerId,
      type: 'producer_platform_update',
      category: 'system',
      title: updateTitle,
      message: updateMessage,
      actionUrl: `/discover/feed`,
      metadata: {}
    });
  }

  // ==================== AUTO-TRIGGER HELPERS ====================

  /**
   * Check and send monthly analytics summary for actor
   * Call this on app load for actors
   */
  async checkAndSendMonthlyAnalytics(actorId: string): Promise<void> {
    try {
      // Check if we already sent this month's summary
      const lastSentKey = `analytics_sent_${actorId}_${this.getCurrentMonthKey()}`;
      const lastSent = localStorage.getItem(lastSentKey);
      
      if (lastSent) {
        return; // Already sent this month
      }

      // Check if actor has premium subscription
      const profileDoc = await getDoc(doc(this.db, 'profiles', actorId));
      if (!profileDoc.exists()) return;
      
      const isPremium = profileDoc.data()?.['actorProfile']?.['isSubscribed'] === true;
      if (!isPremium) return; // Only for premium users

      // Get analytics for last month
      const lastMonthId = this.getLastMonthId();
      const analyticsDoc = await getDoc(
        doc(this.db, `user_analytics/${actorId}/daily/${lastMonthId}`)
      );

      if (!analyticsDoc.exists()) return;

      const data = analyticsDoc.data();
      const profileViews = data?.['profileViews'] || 0;
      const searchImpressions = data?.['searchImpressions'] || 0;

      // Only send if there's activity
      if (profileViews > 0) {
        await this.createMonthlyViewsNotification(actorId, profileViews);
      }

      if (searchImpressions > 0) {
        await this.createMonthlySearchesNotification(actorId, searchImpressions);
      }

      // Mark as sent for this month
      localStorage.setItem(lastSentKey, new Date().toISOString());
    } catch (error) {
      this.logger.error('Error checking monthly analytics:', error);
    }
  }

  /**
   * Check profile completeness and send reminder if needed
   */
  async checkProfileCompleteness(actorId: string): Promise<void> {
    try {
      // Check if we already sent reminder this week
      const lastSentKey = `profile_reminder_${actorId}_${this.getCurrentWeekKey()}`;
      const lastSent = localStorage.getItem(lastSentKey);
      
      if (lastSent) return;

      const profileDoc = await getDoc(doc(this.db, 'profiles', actorId));
      if (!profileDoc.exists()) return;

      const profile = profileDoc.data();
      const actorProfile = profile?.['actorProfile'];
      if (!actorProfile) return;

      // Calculate completeness
      let completedFields = 0;
      let totalFields = 10;

      if (actorProfile.stageName) completedFields++;
      if (actorProfile.bio) completedFields++;
      if (actorProfile.actorProfileImageUrl) completedFields++;
      if (actorProfile.age) completedFields++;
      if (actorProfile.gender) completedFields++;
      if (actorProfile.height) completedFields++;
      if (actorProfile.weight) completedFields++;
      if (actorProfile.location) completedFields++;
      if (actorProfile.skills?.length > 0) completedFields++;
      if (actorProfile.languages?.length > 0) completedFields++;

      const percentage = Math.round((completedFields / totalFields) * 100);

      // Send reminder if less than 80% complete
      if (percentage < 80) {
        await this.createProfileCompletenessReminder(actorId, percentage);
        localStorage.setItem(lastSentKey, new Date().toISOString());
      }
    } catch (error) {
      this.logger.error('Error checking profile completeness:', error);
    }
  }

  /**
   * Check subscription expiry and send reminder
   */
  async checkSubscriptionExpiry(actorId: string): Promise<void> {
    try {
      const profileDoc = await getDoc(doc(this.db, 'profiles', actorId));
      if (!profileDoc.exists()) return;

      const actorProfile = profileDoc.data()?.['actorProfile'];
      if (!actorProfile?.isSubscribed) return;

      const expiryDate = actorProfile.subscriptionExpiryDate?.toDate();
      if (!expiryDate) return;

      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminder at 7, 3, and 1 day before expiry
      if ([7, 3, 1].includes(daysUntilExpiry)) {
        const lastSentKey = `subscription_reminder_${actorId}_${daysUntilExpiry}`;
        const lastSent = localStorage.getItem(lastSentKey);
        
        if (!lastSent) {
          await this.createSubscriptionReminderNotification(actorId, daysUntilExpiry, expiryDate);
          localStorage.setItem(lastSentKey, new Date().toISOString());
        }
      }
    } catch (error) {
      this.logger.error('Error checking subscription expiry:', error);
    }
  }

  /**
   * Check for wishlist matches (producer)
   */
  async checkWishlistMatches(producerId: string): Promise<void> {
    try {
      // Check if we already checked today
      const lastSentKey = `wishlist_matches_${producerId}_${this.getTodayKey()}`;
      const lastSent = localStorage.getItem(lastSentKey);
      
      if (lastSent) return;

      // Get producer's wishlist
      const wishlistQuery = query(
        collection(this.db, 'wishlists'),
        where('producerId', '==', producerId)
      );

      const wishlistSnapshot = await getDocs(wishlistQuery);
      const actorIds = wishlistSnapshot.docs.map(doc => doc.data()['actorId']);

      if (actorIds.length === 0) return;

      // Check for new uploads from wishlisted actors in last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let newUploadsCount = 0;
      for (const actorId of actorIds) {
        const uploadsQuery = query(
          collection(this.db, `userUploads/${actorId}/uploads`),
          where('uploadedAt', '>=', Timestamp.fromDate(yesterday))
        );
        const uploadsSnapshot = await getDocs(uploadsQuery);
        newUploadsCount += uploadsSnapshot.size;
      }

      if (newUploadsCount > 0) {
        await this.createWishlistMatchesNotification(producerId, newUploadsCount);
        localStorage.setItem(lastSentKey, new Date().toISOString());
      }
    } catch (error) {
      this.logger.error('Error checking wishlist matches:', error);
    }
  }

  /**
   * Check database growth (producer)
   */
  async checkDatabaseGrowth(producerId: string): Promise<void> {
    try {
      // Check if we already sent this week
      const lastSentKey = `database_growth_${producerId}_${this.getCurrentWeekKey()}`;
      const lastSent = localStorage.getItem(lastSentKey);
      
      if (lastSent) return;

      // Get count of new actors in last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const newActorsQuery = query(
        collection(this.db, 'users'),
        where('currentRole', '==', 'actor'),
        where('createdAt', '>=', Timestamp.fromDate(weekAgo))
      );

      const snapshot = await getDocs(newActorsQuery);
      const newActorCount = snapshot.size;

      if (newActorCount > 0) {
        await this.createDatabaseGrowthNotification(producerId, newActorCount, newActorCount);
        localStorage.setItem(lastSentKey, new Date().toISOString());
      }
    } catch (error) {
      // Silently fail - don't break the app if this check fails
      this.logger.error('Error checking database growth:', error);
    }
  }

  /**
   * Send visibility suggestion based on profile analytics
   */
  async checkAndSendVisibilitySuggestion(actorId: string): Promise<void> {
    try {
      // Check if we already sent this month
      const lastSentKey = `visibility_suggestion_${actorId}_${this.getCurrentMonthKey()}`;
      const lastSent = localStorage.getItem(lastSentKey);
      
      if (lastSent) return;

      // Get analytics for last 30 days
      const analyticsDoc = await getDoc(doc(this.db, 'user_analytics', actorId));
      if (!analyticsDoc.exists()) return;

      const data = analyticsDoc.data();
      const profileViews = data?.['profileViews'] || 0;

      // If low profile views, suggest improvements
      if (profileViews < 10) {
        const suggestion = 'Add more photos and videos to your profile to increase visibility. Complete profiles get 3x more views!';
        await this.createVisibilitySuggestion(actorId, suggestion);
        localStorage.setItem(lastSentKey, new Date().toISOString());
      }
    } catch (error) {
      this.logger.error('Error checking visibility suggestion:', error);
    }
  }

  // ==================== HELPER METHODS ====================

  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getCurrentWeekKey(): string {
    const now = new Date();
    const weekNumber = Math.ceil((now.getDate()) / 7);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-W${weekNumber}`;
  }

  private getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getLastMonthId(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = String(lastMonth.getMonth() + 1).padStart(2, '0');
    return `${year}${month}01`; // First day of last month
  }
}
