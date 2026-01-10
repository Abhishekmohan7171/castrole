import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { NotificationService } from './notification.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService {
  private firestore = inject(Firestore);
  private notificationService = inject(NotificationService);
  private logger = inject(LoggerService);

  /**
   * Send platform update to all users of a specific role
   */
  async sendPlatformUpdate(
    role: 'actor' | 'producer' | 'all',
    title: string,
    message: string
  ): Promise<void> {
    try {
      const usersRef = collection(this.firestore, 'users');
      let q;

      if (role === 'all') {
        q = query(usersRef);
      } else {
        q = query(usersRef, where('currentRole', '==', role));
      }

      const snapshot = await getDocs(q);
      
      this.logger.info(`Sending platform update to ${snapshot.size} ${role} users`);

      const promises = snapshot.docs.map(async (doc) => {
        const userId = doc.id;
        const userRole = doc.data()['currentRole'];

        if (userRole === 'actor') {
          await this.notificationService.createActorPlatformUpdateNotification(
            userId,
            title,
            message
          );
        } else if (userRole === 'producer') {
          await this.notificationService.createProducerPlatformUpdateNotification(
            userId,
            title,
            message
          );
        }
      });

      await Promise.all(promises);
      this.logger.info(`Platform update sent successfully to ${snapshot.size} users`);
    } catch (error) {
      this.logger.error('Error sending platform update:', error);
      throw error;
    }
  }

  /**
   * Send security alert to a specific user
   */
  async sendSecurityAlert(
    userId: string,
    role: 'actor' | 'producer',
    deviceInfo: string,
    ipAddress: string
  ): Promise<void> {
    try {
      if (role === 'actor') {
        await this.notificationService.createActorSecurityAlertNotification(
          userId,
          deviceInfo,
          ipAddress
        );
      } else {
        await this.notificationService.createProducerSecurityAlertNotification(
          userId,
          deviceInfo,
          ipAddress
        );
      }
      this.logger.info(`Security alert sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Error sending security alert:', error);
      throw error;
    }
  }

  /**
   * Send subscription billing reminder to all premium actors
   */
  async sendBillingReminders(): Promise<void> {
    try {
      const profilesRef = collection(this.firestore, 'profiles');
      const snapshot = await getDocs(profilesRef);

      let count = 0;
      const promises = snapshot.docs.map(async (doc) => {
        const profile = doc.data();
        const actorProfile = profile['actorProfile'];

        if (actorProfile?.isSubscribed) {
          const expiryDate = actorProfile.subscriptionExpiryDate?.toDate();
          if (expiryDate) {
            const now = new Date();
            const daysUntilExpiry = Math.ceil(
              (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
              await this.notificationService.createSubscriptionReminderNotification(
                doc.id,
                daysUntilExpiry,
                expiryDate
              );
              count++;
            }
          }
        }
      });

      await Promise.all(promises);
      this.logger.info(`Sent billing reminders to ${count} users`);
    } catch (error) {
      this.logger.error('Error sending billing reminders:', error);
      throw error;
    }
  }

  /**
   * Send producer billing reminder
   */
  async sendProducerBillingReminder(
    producerId: string,
    billingMessage: string
  ): Promise<void> {
    try {
      await this.notificationService.createProducerBillingNotification(
        producerId,
        billingMessage
      );
      this.logger.info(`Billing reminder sent to producer ${producerId}`);
    } catch (error) {
      this.logger.error('Error sending producer billing reminder:', error);
      throw error;
    }
  }
}
