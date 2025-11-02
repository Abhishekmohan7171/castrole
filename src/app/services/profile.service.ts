import { Injectable, inject, signal } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Profile, ActorProfile, ProducerProfile } from '../../assets/interfaces/profile.interfaces';
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
      await updateDoc(profileDocRef, {
        'actorProfile.isSubscribed': isSubscribed
      });
      
      // Update local state
      const currentProfile = this.profileData();
      if (currentProfile?.actorProfile) {
        currentProfile.actorProfile.isSubscribed = isSubscribed;
        this.profileData.set({ ...currentProfile });
      }
    } catch (error) {
      console.error('Error updating actor subscription:', error);
    }
  }
}