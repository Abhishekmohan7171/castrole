import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  increment,
  Timestamp,
  docData,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ActorProfile, ActorAnalytics, VideoAnalytics } from '../../assets/interfaces/profile.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private firestore = inject(Firestore);

  /**
   * Check if actor has ghost mode enabled
   * Ghost mode is stored in users/{userId}.ghost field
   */
  private async checkGhostMode(actorId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', actorId));
      if (!userDoc.exists()) return false;

      return userDoc.data()?.['ghost'] === true;
    } catch (error) {
      console.error('Error checking ghost mode:', error);
      return false;
    }
  }

  /**
   * Track profile view event - Updates profile document in real-time
   * @param actorId The actor whose profile is being viewed
   * @param producerId The producer viewing the profile
   * @param duration Optional view duration in seconds (deprecated, not used)
   */
  async trackProfileView(
    actorId: string,
    producerId: string,
    duration?: number
  ): Promise<void> {
    try {
      // Check ghost mode
      const isGhostMode = await this.checkGhostMode(actorId);
      if (isGhostMode) {
        console.log('Ghost mode enabled - skipping analytics tracking');
        return;
      }

      const profileRef = doc(this.firestore, 'profiles', actorId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        console.error('Profile not found:', actorId);
        return;
      }

      const profile = profileDoc.data() as ActorProfile;
      const currentAnalytics: ActorAnalytics[] = profile.actorAnalytics || [];

      // Find existing entry for this producer
      const existingIndex = currentAnalytics.findIndex(a => a.producerId === producerId);

      if (existingIndex >= 0) {
        // Update existing entry
        currentAnalytics[existingIndex] = {
          ...currentAnalytics[existingIndex],
          lastViewedAt: Timestamp.now(),
          totalViews: currentAnalytics[existingIndex].totalViews + 1,
        };
      } else {
        // Add new entry
        currentAnalytics.push({
          producerId,
          lastViewedAt: Timestamp.now(),
          totalViews: 1,
          isWishlist: false,
          videosWatched: [],
          firstViewedAt: Timestamp.now(),
        });
      }

      // Keep only last 100 entries (sorted by most recent)
      const sortedAnalytics = currentAnalytics
        .sort((a, b) => b.lastViewedAt.toMillis() - a.lastViewedAt.toMillis())
        .slice(0, 100);

      // Update Firestore
      await updateDoc(profileRef, {
        profileViewCount: increment(1),
        actorAnalytics: sortedAnalytics,
      });

      console.log('✓ Profile view tracked for actor:', actorId);
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  }

  /**
   * Track wishlist addition - Updates profile document in real-time
   * @param actorId The actor being added to wishlist
   * @param producerId The producer adding to wishlist
   */
  async trackWishlistAdd(actorId: string, producerId: string): Promise<void> {
    try {
      // Check ghost mode
      const isGhostMode = await this.checkGhostMode(actorId);
      if (isGhostMode) {
        console.log('Ghost mode enabled - skipping analytics tracking');
        return;
      }

      const profileRef = doc(this.firestore, 'profiles', actorId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        console.error('Profile not found:', actorId);
        return;
      }

      const profile = profileDoc.data() as ActorProfile;
      const currentAnalytics: ActorAnalytics[] = profile.actorAnalytics || [];

      // Find producer in analytics array
      const existingIndex = currentAnalytics.findIndex(a => a.producerId === producerId);

      if (existingIndex >= 0) {
        // Update existing entry
        currentAnalytics[existingIndex].isWishlist = true;
      } else {
        // Create new entry
        currentAnalytics.push({
          producerId,
          lastViewedAt: Timestamp.now(),
          totalViews: 0,
          isWishlist: true,
          videosWatched: [],
          firstViewedAt: Timestamp.now(),
        });
      }

      // Update Firestore
      await updateDoc(profileRef, {
        wishListCount: increment(1),
        actorAnalytics: currentAnalytics,
      });

      console.log('✓ Wishlist addition tracked for actor:', actorId);
    } catch (error) {
      console.error('Error tracking wishlist addition:', error);
    }
  }

  /**
   * Track wishlist removal - Updates profile document in real-time
   * @param actorId The actor being removed from wishlist
   * @param producerId The producer removing from wishlist
   */
  async trackWishlistRemove(actorId: string, producerId: string): Promise<void> {
    try {
      const profileRef = doc(this.firestore, 'profiles', actorId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        console.error('Profile not found:', actorId);
        return;
      }

      const profile = profileDoc.data() as ActorProfile;
      const currentAnalytics: ActorAnalytics[] = profile.actorAnalytics || [];

      // Find and update producer entry
      const existingIndex = currentAnalytics.findIndex(a => a.producerId === producerId);

      if (existingIndex >= 0) {
        currentAnalytics[existingIndex].isWishlist = false;

        await updateDoc(profileRef, {
          wishListCount: increment(-1),
          actorAnalytics: currentAnalytics,
        });

        console.log('✓ Wishlist removal tracked for actor:', actorId);
      }
    } catch (error) {
      console.error('Error tracking wishlist removal:', error);
    }
  }

  /**
   * Track video view event - Updates profile document in real-time
   * @param actorId The actor who owns the video
   * @param producerId The producer viewing the video
   * @param videoId Video file name (unique identifier)
   * @param videoTitle Video description/title
   * @param videoTags Tags associated with the video (deprecated, not used)
   * @param watchDuration How long the video was watched (deprecated, not used)
   */
  async trackVideoView(
    actorId: string,
    producerId: string,
    videoId: string,
    videoTitle: string,
    videoTags: string[] = [],
    watchDuration?: number
  ): Promise<void> {
    try {
      // Check ghost mode
      const isGhostMode = await this.checkGhostMode(actorId);
      if (isGhostMode) {
        console.log('Ghost mode enabled - skipping video view tracking');
        return;
      }

      const profileRef = doc(this.firestore, 'profiles', actorId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        console.error('Profile not found:', actorId);
        return;
      }

      const profile = profileDoc.data() as ActorProfile;

      // Update actorAnalytics (add video to videosWatched)
      const currentAnalytics: ActorAnalytics[] = profile.actorAnalytics || [];
      const existingIndex = currentAnalytics.findIndex(a => a.producerId === producerId);

      if (existingIndex >= 0) {
        const videosWatched = currentAnalytics[existingIndex].videosWatched || [];
        if (!videosWatched.includes(videoId)) {
          videosWatched.push(videoId);
          currentAnalytics[existingIndex].videosWatched = videosWatched.slice(-10); // Keep last 10
        }
      }

      // Update videoAnalytics
      const currentVideoAnalytics: VideoAnalytics[] = profile.videoAnalytics || [];
      const videoIndex = currentVideoAnalytics.findIndex(v => v.videoId === videoId);

      if (videoIndex >= 0) {
        // Increment existing video
        currentVideoAnalytics[videoIndex] = {
          ...currentVideoAnalytics[videoIndex],
          viewCount: currentVideoAnalytics[videoIndex].viewCount + 1,
          lastViewedAt: Timestamp.now(),
          lastViewedBy: producerId,
        };
      } else {
        // Add new video
        currentVideoAnalytics.push({
          videoId,
          videoTitle,
          viewCount: 1,
          lastViewedAt: Timestamp.now(),
          lastViewedBy: producerId,
        });
      }

      // Update Firestore
      await updateDoc(profileRef, {
        actorAnalytics: currentAnalytics,
        videoAnalytics: currentVideoAnalytics,
      });

      console.log('✓ Video view tracked:', videoId);
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  }

  /**
   * Get analytics summary for an actor from their profile
   * @param actorId The actor's user ID
   * @returns Analytics data from profile document
   */
  async getProfileAnalytics(actorId: string): Promise<{
    profileViewCount: number;
    wishListCount: number;
    actorAnalytics: ActorAnalytics[];
    videoAnalytics: VideoAnalytics[];
  } | null> {
    try {
      const profileDoc = await getDoc(doc(this.firestore, 'profiles', actorId));

      if (!profileDoc.exists()) {
        return null;
      }

      const profile = profileDoc.data() as ActorProfile;

      return {
        profileViewCount: profile.profileViewCount || 0,
        wishListCount: profile.wishListCount || 0,
        actorAnalytics: profile.actorAnalytics || [],
        videoAnalytics: profile.videoAnalytics || [],
      };
    } catch (error) {
      console.error('Error fetching profile analytics:', error);
      return null;
    }
  }

  /**
   * Get real-time analytics Observable for an actor from their profile
   * This Observable will emit updates whenever the profile document changes
   * @param actorId The actor's user ID
   * @returns Observable of analytics data
   */
  getProfileAnalyticsRealtime(actorId: string): Observable<{
    profileViewCount: number;
    wishListCount: number;
    actorAnalytics: ActorAnalytics[];
    videoAnalytics: VideoAnalytics[];
    visibilityScore: number;
  } | null> {
    const profileRef = doc(this.firestore, 'profiles', actorId);

    return docData(profileRef, { idField: 'uid' }).pipe(
      map((data) => {
        if (!data) return null;

        const profile = data as ActorProfile;
        const profileViewCount = profile.profileViewCount || 0;
        const wishListCount = profile.wishListCount || 0;

        // Calculate visibility score (simple formula: views + wishlist * 2, normalized to 0-100)
        const rawScore = profileViewCount + (wishListCount * 2);
        const visibilityScore = Math.min(Math.round(rawScore / 10), 100);

        return {
          profileViewCount,
          wishListCount,
          actorAnalytics: profile.actorAnalytics || [],
          videoAnalytics: profile.videoAnalytics || [],
          visibilityScore,
        };
      }),
      catchError((error) => {
        console.error('Error fetching profile analytics:', error);
        return of(null);
      })
    );
  }
}
