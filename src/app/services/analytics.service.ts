import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  docData,
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AnalyticsEvent, UserAnalytics, SearchImpressionMetadata } from '../../assets/interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private firestore = inject(Firestore);

  /**
   * Check if user has ghost mode enabled
   */
  async checkGhostMode(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', userId));
      return userDoc.data()?.['ghost'] === true;
    } catch (error) {
      console.error('Error checking ghost mode:', error);
      return false; // Default to not ghost mode on error
    }
  }

  /**
   * Track profile view event
   * @param actorId The actor whose profile is being viewed
   * @param producerId The producer viewing the profile
   * @param duration Optional view duration in seconds
   */
  async trackProfileView(
    actorId: string,
    producerId: string,
    duration?: number
  ): Promise<void> {
    // Check if actor has ghost mode enabled
    const isGhostMode = await this.checkGhostMode(actorId);
    if (isGhostMode) {
      console.log('Ghost mode enabled - skipping analytics tracking');
      return;
    }

    try {
      // Create analytics event
      const event: AnalyticsEvent = {
        eventType: 'profile_view',
        actorId,
        producerId,
        timestamp: serverTimestamp() as any,
        metadata: duration ? { duration } : undefined,
      };

      // Add to analytics_events collection
      await addDoc(collection(this.firestore, 'analytics_events'), event);

      // Update aggregated analytics
      const analyticsRef = doc(this.firestore, 'user_analytics', actorId);
      const analyticsDoc = await getDoc(analyticsRef);

      if (analyticsDoc.exists()) {
        // Document exists - increment counters
        const updateData: any = {
          'profileViews.total': increment(1),
          'profileViews.last30Days': increment(1),
          lastUpdated: serverTimestamp(),
        };

        // Update average duration if provided
        if (duration) {
          const currentData = analyticsDoc.data() as UserAnalytics;
          const currentTotal = currentData.profileViews.total;
          const currentAvg = currentData.profileViews.avgDuration || 0;
          const newAvg = (currentAvg * currentTotal + duration) / (currentTotal + 1);
          updateData['profileViews.avgDuration'] = newAvg;
        }

        await updateDoc(analyticsRef, updateData);
      } else {
        // Document doesn't exist - create it
        const newAnalytics: UserAnalytics = {
          actorId,
          profileViews: {
            total: 1,
            last30Days: 1,
            avgDuration: duration || 0,
          },
          wishlistCount: 0,
          visibilityScore: 0,
          lastUpdated: serverTimestamp() as any,
        };
        await setDoc(analyticsRef, newAnalytics);
      }

      console.log('✓ Profile view tracked for actor:', actorId);
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  }

  /**
   * Track wishlist addition event
   * @param actorId The actor being added to wishlist
   * @param producerId The producer adding to wishlist
   */
  async trackWishlistAdd(actorId: string, producerId: string): Promise<void> {
    // Check if actor has ghost mode enabled
    const isGhostMode = await this.checkGhostMode(actorId);
    if (isGhostMode) {
      console.log('Ghost mode enabled - skipping analytics tracking');
      return;
    }

    try {
      // Create analytics event
      const event: AnalyticsEvent = {
        eventType: 'wishlist_add',
        actorId,
        producerId,
        timestamp: serverTimestamp() as any,
      };

      // Add to analytics_events collection
      await addDoc(collection(this.firestore, 'analytics_events'), event);

      // Update aggregated analytics
      const analyticsRef = doc(this.firestore, 'user_analytics', actorId);
      const analyticsDoc = await getDoc(analyticsRef);

      if (analyticsDoc.exists()) {
        // Document exists - increment wishlist counter
        await updateDoc(analyticsRef, {
          wishlistCount: increment(1),
          lastUpdated: serverTimestamp(),
        });
      } else {
        // Document doesn't exist - create it
        const newAnalytics: UserAnalytics = {
          actorId,
          profileViews: {
            total: 0,
            last30Days: 0,
            avgDuration: 0,
          },
          wishlistCount: 1,
          visibilityScore: 0,
          lastUpdated: serverTimestamp() as any,
        };
        await setDoc(analyticsRef, newAnalytics);
      }

      console.log('✓ Wishlist addition tracked for actor:', actorId);
    } catch (error) {
      console.error('Error tracking wishlist addition:', error);
    }
  }

  /**
   * Get user analytics for an actor
   * @param actorId The actor's user ID
   * @returns Observable of UserAnalytics or null if no data exists
   */
  getUserAnalytics(actorId: string): Observable<UserAnalytics | null> {
    const analyticsRef = doc(this.firestore, 'user_analytics', actorId);
    return docData(analyticsRef, { idField: 'id' }).pipe(
      map((data) => {
        if (data) {
          return data as UserAnalytics;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error fetching user analytics:', error);
        return of(null);
      })
    );
  }

  /**
   * Track search impression event
   * Called when actor profile appears in producer's search results
   * @param actorId The actor whose profile appeared in search
   * @param producerId The producer performing the search
   * @param searchFilters Applied filters at time of impression
   * @param visibleVideos Array of video fileNames visible in the search result
   */
  async trackSearchImpression(
    actorId: string,
    producerId: string,
    searchFilters: SearchImpressionMetadata,
    visibleVideos: string[]
  ): Promise<void> {
    // Check if actor has ghost mode enabled
    const isGhostMode = await this.checkGhostMode(actorId);
    if (isGhostMode) {
      console.log('Ghost mode enabled - skipping search impression tracking');
      return;
    }

    try {
      const event: AnalyticsEvent = {
        eventType: 'search_impression',
        actorId,
        producerId,
        timestamp: serverTimestamp() as any,
        metadata: {
          searchFilters,
          visibleVideos,
        },
      };

      // Log event to analytics_events collection
      await addDoc(collection(this.firestore, 'analytics_events'), event);

      console.log('✓ Search impression tracked for actor:', actorId);
    } catch (error) {
      console.error('Error tracking search impression:', error);
    }
  }

  /**
   * Track video view event
   * Called when a video is played (anywhere in the app)
   * @param actorId The actor who owns the video
   * @param producerId The producer viewing the video
   * @param videoId Video file name (unique identifier)
   * @param videoTitle Video description/title
   * @param videoTags Tags associated with the video
   * @param watchDuration How long the video was watched (seconds)
   */
  async trackVideoView(
    actorId: string,
    producerId: string,
    videoId: string,
    videoTitle: string,
    videoTags: string[],
    watchDuration?: number
  ): Promise<void> {
    // Check if actor has ghost mode enabled
    const isGhostMode = await this.checkGhostMode(actorId);
    if (isGhostMode) {
      console.log('Ghost mode enabled - skipping video view tracking');
      return;
    }

    try {
      const event: AnalyticsEvent = {
        eventType: 'video_view',
        actorId,
        producerId,
        timestamp: serverTimestamp() as any,
        metadata: {
          videoId,
          videoFileName: videoId,
          videoTitle,
          videoTags,
          watchDuration,
        },
      };

      // Log event to analytics_events collection
      await addDoc(collection(this.firestore, 'analytics_events'), event);

      console.log('✓ Video view tracked:', videoId);
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  }

  /**
   * Get video analytics for an actor
   * @param actorId The actor's user ID
   * @returns Observable of video analytics data
   */
  getVideoAnalytics(actorId: string): Observable<any | null> {
    const videoAnalyticsRef = doc(
      this.firestore,
      'video_analytics',
      `${actorId}_videos`
    );
    return docData(videoAnalyticsRef, { idField: 'id' }).pipe(
      map((data) => data || null),
      catchError((error) => {
        console.error('Error fetching video analytics:', error);
        return of(null);
      })
    );
  }

  /**
   * Get tag analytics for an actor
   * @param actorId The actor's user ID
   * @returns Observable of tag analytics data
   */
  getTagAnalytics(actorId: string): Observable<any | null> {
    const tagAnalyticsRef = doc(
      this.firestore,
      'tag_analytics',
      `${actorId}_tags`
    );
    return docData(tagAnalyticsRef, { idField: 'id' }).pipe(
      map((data) => data || null),
      catchError((error) => {
        console.error('Error fetching tag analytics:', error);
        return of(null);
      })
    );
  }
}
