import { Injectable, inject, signal } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { Profile, ActorProfile, ProducerProfile } from '../../assets/interfaces/profile.interfaces';
import { SubscriptionMetadata } from '../interfaces/payment.interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  // Profile data signal
  profileData = signal<Profile | null>(null);

  async loadProfileData(): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.profileData.set(null);
      return;
    }

    try {
      const profileDocRef = doc(this.firestore, 'profiles', user.uid);
      const profileDoc = await getDoc(profileDocRef);
      
      if (profileDoc.exists()) {
        const profile = profileDoc.data() as Profile;
        
        // Ensure isSubscribed defaults to false if not set for actors
        if (profile.actorProfile && profile.actorProfile.isSubscribed === undefined) {
          profile.actorProfile.isSubscribed = false;
          // Update the document in Firestore to persist this default
          await updateDoc(profileDocRef, {
            'actorProfile.isSubscribed': false
          });
        }
        
        this.profileData.set(profile);
      } else {
        this.profileData.set(null);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      this.profileData.set(null);
    }
  }

  getActorProfile(): ActorProfile | null {
    const profile = this.profileData();
    return profile?.actorProfile || null;
  }

  getProducerProfile(): ProducerProfile | null {
    const profile = this.profileData();
    return profile?.producerProfile || null;
  }

  isActorSubscribed(): boolean {
    const actorProfile = this.getActorProfile();
    return actorProfile?.isSubscribed ?? false;
  }

  async updateActorSubscription(isSubscribed: boolean): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const profileDocRef = doc(this.firestore, 'profiles', user.uid);
      const currentProfile = this.profileData();
      
      // Update based on which profile exists
      if (currentProfile?.actorProfile) {
        await updateDoc(profileDocRef, {
          'actorProfile.isSubscribed': isSubscribed
        });
        currentProfile.actorProfile.isSubscribed = isSubscribed;
        this.profileData.set({ ...currentProfile });
      } else if (currentProfile?.producerProfile) {
        await updateDoc(profileDocRef, {
          'producerProfile.isSubscribed': isSubscribed
        });
        currentProfile.producerProfile.isSubscribed = isSubscribed;
        this.profileData.set({ ...currentProfile });
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  }

  // ==================== SUBSCRIPTION METADATA METHODS ====================

  /**
   * Get subscription metadata for actor or producer
   * @returns SubscriptionMetadata or null if not subscribed
   */
  getSubscriptionMetadata(): SubscriptionMetadata | null {
    const profile = this.profileData();
    if (!profile) return null;
    
    // Check actor profile first, then producer profile
    const actorMetadata = profile.actorProfile?.subscriptionMetadata;
    const producerMetadata = profile.producerProfile?.subscriptionMetadata;
    
    return actorMetadata || producerMetadata || null;
  }

  /**
   * Update subscription metadata for actor or producer
   * Used by Cloud Functions after successful payment
   * 
   * @param metadata - Complete subscription metadata
   */
  async updateSubscriptionMetadata(metadata: SubscriptionMetadata): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const profileDocRef = doc(this.firestore, 'profiles', user.uid);
      await updateDoc(profileDocRef, {
        'actorProfile.subscriptionMetadata': metadata,
        'actorProfile.isSubscribed': true,
      });

      // Update local state
      const currentProfile = this.profileData();
      if (currentProfile?.actorProfile) {
        currentProfile.actorProfile.subscriptionMetadata = metadata;
        currentProfile.actorProfile.isSubscribed = true;
        this.profileData.set({ ...currentProfile });
      }

      console.log('✓ Subscription metadata updated');
    } catch (error) {
      console.error('Error updating subscription metadata:', error);
      throw error;
    }
  }

  /**
   * Check if subscription is currently active
   * Checks both isSubscribed flag and subscription status
   * 
   * @returns true if subscription is active
   */
  isSubscriptionActive(): boolean {
    const metadata = this.getSubscriptionMetadata();
    if (!metadata) return false;

    // Check if subscription status is active
    if (metadata.status !== 'active') return false;

    // Check if subscription has expired
    const now = new Date();
    const endDate = metadata.endDate?.toDate ? metadata.endDate.toDate() : new Date(metadata.endDate);
    
    return endDate > now;
  }

  /**
   * Get subscription end date
   * @returns Date object or null
   */
  getSubscriptionEndDate(): Date | null {
    const metadata = this.getSubscriptionMetadata();
    if (!metadata?.endDate) return null;

    return metadata.endDate.toDate ? metadata.endDate.toDate() : new Date(metadata.endDate);
  }

  /**
   * Get subscription start date
   * @returns Date object or null
   */
  getSubscriptionStartDate(): Date | null {
    const metadata = this.getSubscriptionMetadata();
    if (!metadata?.startDate) return null;

    return metadata.startDate.toDate ? metadata.startDate.toDate() : new Date(metadata.startDate);
  }

  /**
   * Get subscription plan type
   * @returns 'monthly' | 'yearly' | null
   */
  getSubscriptionPlan(): 'monthly' | 'yearly' | null {
    const metadata = this.getSubscriptionMetadata();
    return metadata?.plan || null;
  }

  /**
   * Get days remaining in subscription
   * @returns number of days or null if not subscribed
   */
  getDaysRemaining(): number | null {
    const endDate = this.getSubscriptionEndDate();
    if (!endDate) return null;

    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Check if subscription is expiring soon (within 7 days)
   * @returns true if expiring within 7 days
   */
  isSubscriptionExpiringSoon(): boolean {
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining === null) return false;

    return daysRemaining <= 7 && daysRemaining > 0;
  }

  /**
   * Get formatted subscription amount
   * @returns Formatted amount string (e.g., '₹222') or null
   */
  getSubscriptionAmount(): string | null {
    const metadata = this.getSubscriptionMetadata();
    if (!metadata) return null;

    return `₹${metadata.amountRupees}`;
  }

  /**
   * Check if subscription is cancelled (but still active until end date)
   * @returns true if cancelled
   */
  isSubscriptionCancelled(): boolean {
    const metadata = this.getSubscriptionMetadata();
    return metadata?.status === 'cancelled';
  }

  /**
   * Get cancellation reason if subscription was cancelled
   * @returns Cancellation reason or null
   */
  getCancellationReason(): string | null {
    const metadata = this.getSubscriptionMetadata();
    if (metadata?.status !== 'cancelled') return null;

    return metadata.cancellationReason || null;
  }

  /**
   * Refresh profile data from Firestore
   * Useful after payment completion to get updated subscription status
   */
  async refreshProfileData(): Promise<void> {
    await this.loadProfileData();
  }
}