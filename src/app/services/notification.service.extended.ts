import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { LoggerService } from './logger.service';

/**
 * Extended notification methods for comprehensive notification system
 * Import and use these methods alongside the main NotificationService
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationServiceExtended {
  private firestore = inject(Firestore);
  private logger = inject(LoggerService);

  // ==================== ACTOR NOTIFICATIONS ====================

  /**
   * Producer sends connection request to actor
   */
  async createConnectionRequestNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    connectionId: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'connection_request',
        category: 'chat',
        title: 'Connection Request',
        message: `${producerName} sent you a connection request`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/connections?connectionId=${connectionId}`,
        metadata: {
          producerId,
          producerName,
          producerPhotoUrl,
          connectionId
        }
      });
    } catch (error) {
      this.logger.error('Error creating connection request notification:', error);
    }
  }

  /**
   * Actor accepts connection - notify producer
   */
  async createConnectionAcceptedNotification(
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
        type: 'connection_accepted',
        category: 'chat',
        title: 'Connection Accepted',
        message: `${actorName} accepted your connection request — Start chat`,
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
      this.logger.error('Error creating connection accepted notification:', error);
    }
  }

  /**
   * Actor declines connection - notify producer
   */
  async createConnectionDeclinedNotification(
    producerId: string,
    actorId: string,
    actorName: string,
    actorPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'connection_declined',
        category: 'chat',
        title: 'Connection Declined',
        message: `${actorName} declined your connection request`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/search`,
        metadata: {
          actorId,
          actorName,
          actorPhotoUrl
        }
      });
    } catch (error) {
      this.logger.error('Error creating connection declined notification:', error);
    }
  }

  /**
   * Connection established - notify actor
   */
  async createConnectionEstablishedNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    chatId: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'connection_accepted',
        category: 'chat',
        title: 'Connection Established',
        message: `Connection established with ${producerName} — Start chat`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/chat?chatId=${chatId}`,
        metadata: {
          producerId,
          producerName,
          producerPhotoUrl,
          chatId
        }
      });
    } catch (error) {
      this.logger.error('Error creating connection established notification:', error);
    }
  }

  /**
   * Producer requests additional media from actor
   */
  async createMediaRequestNotification(
    actorId: string,
    producerId: string,
    producerName: string,
    mediaType: 'photo' | 'video' | 'voice',
    chatId: string,
    producerPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      const mediaTypeText = mediaType === 'photo' ? 'photos' : mediaType === 'video' ? 'videos' : 'voice intro';
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'media_request',
        category: 'chat',
        title: 'Media Request',
        message: `${producerName} requested additional ${mediaTypeText}`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/chat?chatId=${chatId}`,
        metadata: {
          producerId,
          producerName,
          producerPhotoUrl,
          mediaType,
          chatId
        }
      });
    } catch (error) {
      this.logger.error('Error creating media request notification:', error);
    }
  }

  /**
   * Monthly profile views analytics (Premium - Actor)
   */
  async createMonthlyViewsNotification(
    actorId: string,
    viewCount: number,
    isPremium: boolean
  ): Promise<void> {
    if (!isPremium) return;

    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'analytics_views_monthly',
        category: 'analytics',
        title: 'Monthly Profile Views',
        message: `Your profile got ${viewCount} views this month ${isPremium ? '— View full analytics' : '🔒 View full analytics'}`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: isPremium ? `/discover/settings/analytics` : `/discover/settings/subscription`,
        metadata: {
          isPremium,
          viewCount,
          analyticsType: 'monthly_views'
        }
      });
    } catch (error) {
      this.logger.error('Error creating monthly views notification:', error);
    }
  }

  /**
   * Monthly search appearances analytics (Premium - Actor)
   */
  async createMonthlySearchesNotification(
    actorId: string,
    searchCount: number,
    isPremium: boolean
  ): Promise<void> {
    if (!isPremium) return;

    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'analytics_searches_monthly',
        category: 'analytics',
        title: 'Monthly Search Appearances',
        message: `You appeared in ${searchCount} searches this month ${isPremium ? '— View full analytics' : '🔒 View full analytics'}`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: isPremium ? `/discover/settings/analytics` : `/discover/settings/subscription`,
        metadata: {
          isPremium,
          searchCount,
          analyticsType: 'monthly_searches'
        }
      });
    } catch (error) {
      this.logger.error('Error creating monthly searches notification:', error);
    }
  }

  /**
   * Profile completeness reminder (Actor)
   */
  async createProfileCompletenessReminder(
    actorId: string,
    completenessPercentage: number
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'profile_completeness_reminder',
        category: 'system',
        title: 'Complete Your Profile',
        message: `Your profile is ${completenessPercentage}% complete. Add more details to increase visibility`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/profile/edit`,
        metadata: {
          completenessPercentage
        }
      });
    } catch (error) {
      this.logger.error('Error creating profile completeness reminder:', error);
    }
  }

  /**
   * Visibility improvement suggestion (Actor)
   */
  async createVisibilitySuggestion(
    actorId: string,
    suggestion: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'visibility_suggestion',
        category: 'system',
        title: 'Improve Your Visibility',
        message: suggestion,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/profile/edit`,
        metadata: {}
      });
    } catch (error) {
      this.logger.error('Error creating visibility suggestion:', error);
    }
  }

  /**
   * Subscription expiry warning (Actor)
   */
  async createSubscriptionExpiryNotification(
    actorId: string,
    daysUntilExpiry: number
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'subscription_expiry',
        category: 'system',
        title: 'Subscription Expiring Soon',
        message: `Your premium subscription expires in ${daysUntilExpiry} days. Renew to keep premium features`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/settings/subscription`,
        metadata: {
          daysUntilExpiry
        }
      });
    } catch (error) {
      this.logger.error('Error creating subscription expiry notification:', error);
    }
  }

  /**
   * Subscription renewal confirmation (Actor)
   */
  async createSubscriptionRenewalNotification(
    actorId: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'subscription_renewal',
        category: 'system',
        title: 'Subscription Renewed',
        message: 'Your premium subscription has been successfully renewed',
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/settings/subscription`,
        metadata: {}
      });
    } catch (error) {
      this.logger.error('Error creating subscription renewal notification:', error);
    }
  }

  /**
   * Security alert - new device login (Actor)
   */
  async createSecurityAlertNotification(
    actorId: string,
    deviceInfo: string,
    ipAddress: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'security_alert',
        category: 'system',
        title: 'New Device Login',
        message: `New login detected from ${deviceInfo}. If this wasn't you, secure your account immediately`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/settings/security`,
        metadata: {
          deviceInfo,
          ipAddress
        }
      });
    } catch (error) {
      this.logger.error('Error creating security alert notification:', error);
    }
  }

  /**
   * Platform update announcement (Actor)
   */
  async createPlatformUpdateNotification(
    actorId: string,
    updateTitle: string,
    updateMessage: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${actorId}/items`);
      
      await addDoc(notificationsRef, {
        userId: actorId,
        type: 'platform_update',
        category: 'system',
        title: updateTitle,
        message: updateMessage,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/updates`,
        metadata: {}
      });
    } catch (error) {
      this.logger.error('Error creating platform update notification:', error);
    }
  }

  // ==================== PRODUCER NOTIFICATIONS ====================

  /**
   * Actor uploaded requested media (Producer)
   */
  async createMediaUploadedNotification(
    producerId: string,
    actorId: string,
    actorName: string,
    mediaType: 'photo' | 'video' | 'voice',
    mediaUrl: string,
    actorPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      const mediaTypeText = mediaType === 'photo' ? 'photos' : mediaType === 'video' ? 'video' : 'voice intro';
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'media_uploaded',
        category: 'discover',
        title: 'Media Uploaded',
        message: `${actorName} uploaded requested ${mediaTypeText}`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/actor/${actorId}`,
        metadata: {
          actorId,
          actorName,
          actorPhotoUrl,
          mediaType,
          mediaUrl
        }
      });
    } catch (error) {
      this.logger.error('Error creating media uploaded notification:', error);
    }
  }

  /**
   * Shortlisted actor activity update (Producer)
   */
  async createShortlistActivityNotification(
    producerId: string,
    actorId: string,
    actorName: string,
    activityType: string,
    actorPhotoUrl?: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'shortlist_activity',
        category: 'discover',
        title: 'Shortlist Activity',
        message: `${actorName} ${activityType}`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/actor/${actorId}`,
        metadata: {
          actorId,
          actorName,
          actorPhotoUrl
        }
      });
    } catch (error) {
      this.logger.error('Error creating shortlist activity notification:', error);
    }
  }

  /**
   * New actors match saved search (Producer)
   */
  async createNewActorMatchesNotification(
    producerId: string,
    matchCount: number,
    searchId: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'new_actor_matches',
        category: 'discover',
        title: 'New Actor Matches',
        message: `${matchCount} new actors match your saved search criteria`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/search?searchId=${searchId}`,
        metadata: {
          matchCount
        }
      });
    } catch (error) {
      this.logger.error('Error creating new actor matches notification:', error);
    }
  }

  /**
   * Smart actor suggestions available (Producer)
   */
  async createActorSuggestionsNotification(
    producerId: string,
    suggestionCount: number
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'actor_suggestions',
        category: 'discover',
        title: 'Smart Suggestions',
        message: `${suggestionCount} new actor suggestions available based on your preferences`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/suggestions`,
        metadata: {
          matchCount: suggestionCount
        }
      });
    } catch (error) {
      this.logger.error('Error creating actor suggestions notification:', error);
    }
  }

  /**
   * Actor database growth update (Producer)
   */
  async createDatabaseGrowthNotification(
    producerId: string,
    newActorCount: number
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'database_growth',
        category: 'system',
        title: 'New Actors Joined',
        message: `${newActorCount} new actors joined this week. Explore fresh talent`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/search?filter=new`,
        metadata: {
          newActorCount
        }
      });
    } catch (error) {
      this.logger.error('Error creating database growth notification:', error);
    }
  }

  /**
   * Shortlist engagement summary (Producer)
   */
  async createShortlistEngagementNotification(
    producerId: string,
    engagementScore: number,
    activeActors: number
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'shortlist_engagement',
        category: 'analytics',
        title: 'Shortlist Engagement',
        message: `${activeActors} actors from your shortlist were active this week`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/shortlist`,
        metadata: {
          engagementScore
        }
      });
    } catch (error) {
      this.logger.error('Error creating shortlist engagement notification:', error);
    }
  }

  /**
   * Subscription or billing update (Producer)
   */
  async createSubscriptionBillingNotification(
    producerId: string,
    message: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'subscription_billing',
        category: 'system',
        title: 'Billing Update',
        message,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/settings/billing`,
        metadata: {}
      });
    } catch (error) {
      this.logger.error('Error creating subscription billing notification:', error);
    }
  }

  /**
   * Security alert - new device login (Producer)
   */
  async createProducerSecurityAlertNotification(
    producerId: string,
    deviceInfo: string,
    ipAddress: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'producer_security_alert',
        category: 'system',
        title: 'New Device Login',
        message: `New login detected from ${deviceInfo}. If this wasn't you, secure your account immediately`,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/settings/security`,
        metadata: {
          deviceInfo,
          ipAddress
        }
      });
    } catch (error) {
      this.logger.error('Error creating producer security alert notification:', error);
    }
  }

  /**
   * Platform update announcement (Producer)
   */
  async createProducerPlatformUpdateNotification(
    producerId: string,
    updateTitle: string,
    updateMessage: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(this.firestore, `notifications/${producerId}/items`);
      
      await addDoc(notificationsRef, {
        userId: producerId,
        type: 'producer_platform_update',
        category: 'system',
        title: updateTitle,
        message: updateMessage,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/discover/updates`,
        metadata: {}
      });
    } catch (error) {
      this.logger.error('Error creating producer platform update notification:', error);
    }
  }
}
