import { Injectable, inject, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  increment,
  Timestamp,
  query,
  where,
  getCountFromServer,
} from '@angular/fire/firestore';
import {
  UserAnalyticsDoc,
  DailyAnalyticsDoc,
  WishlistDoc,
  AnalyticsIncrement,
  VideoTrackingSession,
} from '../../assets/interfaces/analytics.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService implements OnDestroy {
  private firestore = inject(Firestore);

  // Profile view tracking
  private profileViewStartTime: number | null = null;
  private currentProfileActorId: string | null = null;

  // Video tracking sessions (keyed by videoPath)
  private videoSessions = new Map<string, VideoTrackingSession>();
  private videoFlushInterval: any = null;

  // Constants
  private readonly MIN_PROFILE_VIEW_MS = 1000; // 1 second minimum
  private readonly MAX_PROFILE_VIEW_MS = 600000; // 10 minutes maximum
  private readonly VIDEO_VIEW_THRESHOLD_MS = 3000; // Count view after 3 seconds
  private readonly VIDEO_FLUSH_INTERVAL_MS = 20000; // Flush every 20 seconds
  private readonly MAX_WATCH_DELTA_MS = 30000; // Max 30s delta between updates

  constructor() {
    // Start video flush timer
    this.startVideoFlushTimer();
  }

  ngOnDestroy() {
    // Cleanup: flush all pending video sessions
    this.flushAllVideoSessions();
    if (this.videoFlushInterval) {
      clearInterval(this.videoFlushInterval);
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get today's date ID in yyyyMMdd format (local timezone)
   */
  private getTodayId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Check if actor has ghost mode enabled
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
   * Update both lifetime and daily analytics atomically using writeBatch
   * @param actorId Actor whose analytics to update
   * @param increments Fields to increment
   */
  private async updateActorAnalytics(
    actorId: string,
    increments: AnalyticsIncrement
  ): Promise<void> {
    try {
      const batch = writeBatch(this.firestore);
      const todayId = this.getTodayId();

      // Lifetime document
      const lifetimeRef = doc(this.firestore, 'user_analytics', actorId);

      // Daily document
      const dailyRef = doc(
        this.firestore,
        'user_analytics',
        actorId,
        'daily',
        todayId
      );

      // Build increment object
      const incrementData: any = { updatedAt: Timestamp.now() };

      if (increments.profileViews) {
        incrementData.profileViews = increment(increments.profileViews);
      }
      if (increments.totalProfileViewMs) {
        incrementData.totalProfileViewMs = increment(
          increments.totalProfileViewMs
        );
      }
      if (increments.searchAppearances) {
        incrementData.searchAppearances = increment(increments.searchAppearances);
      }
      if (increments.totalVideoViews) {
        incrementData.totalVideoViews = increment(increments.totalVideoViews);
      }
      if (increments.totalWatchMs) {
        incrementData.totalWatchMs = increment(increments.totalWatchMs);
      }

      // Check if documents exist
      const lifetimeSnap = await getDoc(lifetimeRef);
      const dailySnap = await getDoc(dailyRef);

      if (!lifetimeSnap.exists()) {
        // Initialize lifetime document
        const initData: UserAnalyticsDoc = {
          actorId,
          profileViews: increments.profileViews || 0,
          totalProfileViewMs: increments.totalProfileViewMs || 0,
          searchAppearances: increments.searchAppearances || 0,
          totalVideoViews: increments.totalVideoViews || 0,
          totalWatchMs: increments.totalWatchMs || 0,
          updatedAt: Timestamp.now(),
        };
        batch.set(lifetimeRef, initData);
      } else {
        batch.update(lifetimeRef, incrementData);
      }

      if (!dailySnap.exists()) {
        // Initialize daily document
        const initData: DailyAnalyticsDoc = {
          date: todayId,
          profileViews: increments.profileViews || 0,
          totalProfileViewMs: increments.totalProfileViewMs || 0,
          searchAppearances: increments.searchAppearances || 0,
          totalVideoViews: increments.totalVideoViews || 0,
          totalWatchMs: increments.totalWatchMs || 0,
          updatedAt: Timestamp.now(),
        };
        batch.set(dailyRef, initData);
      } else {
        batch.update(dailyRef, incrementData);
      }

      await batch.commit();
      console.log('✓ Analytics updated:', actorId, increments);
    } catch (error) {
      console.error('Error updating analytics:', error);
      // Non-fatal - don't throw
    }
  }

  // ==================== PROFILE VIEW TRACKING ====================

  /**
   * Start tracking profile view duration
   * Call when user lands on profile page
   * @param actorId Actor whose profile is being viewed
   */
  async startProfileView(actorId: string): Promise<void> {
    // Check ghost mode
    const isGhost = await this.checkGhostMode(actorId);
    if (isGhost) {
      console.log('Ghost mode enabled - skipping profile view tracking');
      return;
    }

    this.currentProfileActorId = actorId;
    this.profileViewStartTime = Date.now();

    console.log('Started profile view tracking:', actorId);
  }

  /**
   * End tracking profile view duration and record analytics
   * Call when user leaves profile page (ngOnDestroy, route change, etc.)
   */
  async endProfileView(): Promise<void> {
    if (!this.currentProfileActorId || !this.profileViewStartTime) {
      return;
    }

    const durationMs = Date.now() - this.profileViewStartTime;

    // Only count views >= 1 second, cap at 10 minutes
    if (durationMs < this.MIN_PROFILE_VIEW_MS) {
      console.log('Profile view too short, not tracked');
      this.resetProfileView();
      return;
    }

    const cappedDurationMs = Math.min(durationMs, this.MAX_PROFILE_VIEW_MS);

    // Update analytics
    await this.updateActorAnalytics(this.currentProfileActorId, {
      profileViews: 1,
      totalProfileViewMs: cappedDurationMs,
    });

    console.log(`Profile view tracked: ${cappedDurationMs}ms`);
    this.resetProfileView();
  }

  private resetProfileView() {
    this.currentProfileActorId = null;
    this.profileViewStartTime = null;
  }

  // ==================== SEARCH IMPRESSION TRACKING ====================

  /**
   * Track search impressions for actors appearing in search results
   * Call when search results are displayed (first 20 actors only)
   * @param actorIds Array of actor IDs displayed in search results
   */
  async trackSearchImpressions(actorIds: string[]): Promise<void> {
    if (!actorIds || actorIds.length === 0) return;

    // Limit to first 20 displayed
    const displayedActors = actorIds.slice(0, 20);

    try {
      // Batch update: chunk if more than 200 actors (Firestore limit is 500 ops)
      // Each actor requires 2 operations (lifetime + daily), so 200 actors = 400 ops
      const CHUNK_SIZE = 200;

      for (let i = 0; i < displayedActors.length; i += CHUNK_SIZE) {
        const chunk = displayedActors.slice(i, i + CHUNK_SIZE);

        // Process chunk in parallel
        await Promise.all(
          chunk.map((actorId) =>
            this.updateActorAnalytics(actorId, { searchAppearances: 1 })
          )
        );
      }

      console.log(
        `✓ Search impressions tracked for ${displayedActors.length} actors`
      );
    } catch (error) {
      console.error('Error tracking search impressions:', error);
    }
  }

  // ==================== VIDEO VIEW TRACKING ====================

  private startVideoFlushTimer() {
    this.videoFlushInterval = setInterval(() => {
      this.flushAllVideoSessions();
    }, this.VIDEO_FLUSH_INTERVAL_MS);
  }

  /**
   * Start tracking video view
   * Call when video starts playing
   * @param actorId Actor who owns the video
   * @param videoId Video document ID
   * @param userId User ID (for constructing path: uploads/{userId}/userUploads/{videoId})
   */
  async startVideoTracking(
    actorId: string,
    videoId: string,
    userId: string
  ): Promise<void> {
    // Check ghost mode
    const isGhost = await this.checkGhostMode(actorId);
    if (isGhost) {
      console.log('Ghost mode enabled - skipping video tracking');
      return;
    }

    const videoPath = `uploads/${userId}/userUploads/${videoId}`;

    if (this.videoSessions.has(videoPath)) {
      console.log('Video session already active:', videoPath);
      return;
    }

    const session: VideoTrackingSession = {
      actorId,
      videoId,
      videoPath,
      lastPosition: 0,
      accumulatedWatchMs: 0,
      lastUpdateTime: Date.now(),
      viewCountIncremented: false,
    };

    this.videoSessions.set(videoPath, session);
    console.log('Started video tracking:', videoPath);
  }

  /**
   * Update video tracking on timeupdate event
   * Call periodically (every few seconds) from video player
   * @param videoId Video document ID
   * @param userId User ID
   * @param currentTime Current playback position in seconds
   */
  updateVideoProgress(
    videoId: string,
    userId: string,
    currentTime: number
  ): void {
    const videoPath = `uploads/${userId}/userUploads/${videoId}`;
    const session = this.videoSessions.get(videoPath);

    if (!session) {
      console.warn('No active video session for:', videoPath);
      return;
    }

    const now = Date.now();

    // Calculate watch time delta (clamp to max 30s to ignore seeks)
    const positionDelta = Math.abs(currentTime - session.lastPosition);
    const watchDelta = Math.min(positionDelta * 1000, this.MAX_WATCH_DELTA_MS);

    session.accumulatedWatchMs += watchDelta;
    session.lastPosition = currentTime;
    session.lastUpdateTime = now;

    // Check if we should count this as a view (after 3 seconds)
    if (
      !session.viewCountIncremented &&
      session.accumulatedWatchMs >= this.VIDEO_VIEW_THRESHOLD_MS
    ) {
      session.viewCountIncremented = true;
      console.log('View threshold reached for:', videoPath);
    }
  }

  /**
   * End video tracking
   * Call when video ends, pauses, or user navigates away
   * @param videoId Video document ID
   * @param userId User ID
   */
  async endVideoTracking(videoId: string, userId: string): Promise<void> {
    const videoPath = `uploads/${userId}/userUploads/${videoId}`;
    await this.flushVideoSession(videoPath);
  }

  /**
   * Flush a single video session to Firestore
   */
  private async flushVideoSession(videoPath: string): Promise<void> {
    const session = this.videoSessions.get(videoPath);
    if (!session) return;

    // Only flush if there's accumulated data
    if (session.accumulatedWatchMs === 0 && !session.viewCountIncremented) {
      this.videoSessions.delete(videoPath);
      return;
    }

    try {
      const batch = writeBatch(this.firestore);

      // 1. Update video document in uploads collection
      const videoRef = doc(this.firestore, session.videoPath);

      const videoUpdates: any = {};
      if (session.viewCountIncremented) {
        videoUpdates['metadata.viewCount'] = increment(1);
      }
      if (session.accumulatedWatchMs > 0) {
        videoUpdates['metadata.totalWatchMs'] = increment(
          session.accumulatedWatchMs
        );
      }

      if (Object.keys(videoUpdates).length > 0) {
        batch.update(videoRef, videoUpdates);
      }

      // Commit batch
      await batch.commit();

      // 2. Update actor analytics (separate operation after batch)
      const increments: AnalyticsIncrement = {};
      if (session.viewCountIncremented) {
        increments.totalVideoViews = 1;
      }
      if (session.accumulatedWatchMs > 0) {
        increments.totalWatchMs = session.accumulatedWatchMs;
      }

      if (Object.keys(increments).length > 0) {
        await this.updateActorAnalytics(session.actorId, increments);
      }

      console.log('✓ Video session flushed:', session.videoPath, {
        viewCounted: session.viewCountIncremented,
        watchMs: session.accumulatedWatchMs,
      });
    } catch (error) {
      console.error('Error flushing video session:', error);
    } finally {
      this.videoSessions.delete(videoPath);
    }
  }

  /**
   * Flush all active video sessions
   */
  private async flushAllVideoSessions(): Promise<void> {
    const sessions = Array.from(this.videoSessions.keys());

    for (const videoPath of sessions) {
      await this.flushVideoSession(videoPath);
    }
  }

  // ==================== WISHLIST TRACKING ====================

  /**
   * Add actor to producer's wishlist
   * @param actorId Actor being wishlisted
   * @param producerId Producer adding to wishlist
   */
  async addToWishlist(actorId: string, producerId: string): Promise<void> {
    try {
      const wishlistId = `${producerId}_${actorId}`;
      const wishlistRef = doc(this.firestore, 'wishlists', wishlistId);

      const wishlistDoc: WishlistDoc = {
        producerId,
        actorId,
        addedAt: Timestamp.now(),
      };

      await setDoc(wishlistRef, wishlistDoc);
      console.log('✓ Added to wishlist:', wishlistId);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  /**
   * Remove actor from producer's wishlist
   * @param actorId Actor being removed from wishlist
   * @param producerId Producer removing from wishlist
   */
  async removeFromWishlist(
    actorId: string,
    producerId: string
  ): Promise<void> {
    try {
      const wishlistId = `${producerId}_${actorId}`;
      const wishlistRef = doc(this.firestore, 'wishlists', wishlistId);

      await deleteDoc(wishlistRef);
      console.log('✓ Removed from wishlist:', wishlistId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  /**
   * Get wishlist count for an actor
   * @param actorId Actor whose wishlist count to get
   * @returns Wishlist count
   */
  async getWishlistCount(actorId: string): Promise<number> {
    try {
      const q = query(
        collection(this.firestore, 'wishlists'),
        where('actorId', '==', actorId)
      );

      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting wishlist count:', error);
      return 0;
    }
  }

  /**
   * Check if producer has wishlisted an actor
   * @param actorId Actor to check
   * @param producerId Producer to check
   * @returns True if in wishlist
   */
  async isInWishlist(actorId: string, producerId: string): Promise<boolean> {
    try {
      const wishlistId = `${producerId}_${actorId}`;
      const wishlistRef = doc(this.firestore, 'wishlists', wishlistId);
      const snapshot = await getDoc(wishlistRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  }

  /**
   * Get all actors in producer's wishlist
   * @param producerId Producer whose wishlist to get
   * @returns Array of actor IDs
   */
  async getProducerWishlist(producerId: string): Promise<string[]> {
    try {
      const q = query(
        collection(this.firestore, 'wishlists'),
        where('producerId', '==', producerId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data()['actorId'] as string);
    } catch (error) {
      console.error('Error getting producer wishlist:', error);
      return [];
    }
  }

  // ==================== ANALYTICS RETRIEVAL ====================

  /**
   * Get lifetime analytics for an actor
   * @param actorId Actor whose analytics to retrieve
   * @returns Lifetime analytics or null
   */
  async getLifetimeAnalytics(
    actorId: string
  ): Promise<UserAnalyticsDoc | null> {
    try {
      const docRef = doc(this.firestore, 'user_analytics', actorId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as UserAnalyticsDoc;
    } catch (error) {
      console.error('Error fetching lifetime analytics:', error);
      return null;
    }
  }

  /**
   * Get daily analytics for a specific date range
   * @param actorId Actor whose analytics to retrieve
   * @param startDate Start date (yyyyMMdd)
   * @param endDate End date (yyyyMMdd)
   * @returns Array of daily analytics
   */
  async getDailyAnalytics(
    actorId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyAnalyticsDoc[]> {
    try {
      const dailyCollectionRef = collection(
        this.firestore,
        'user_analytics',
        actorId,
        'daily'
      );

      const results: DailyAnalyticsDoc[] = [];

      // Generate date range
      const dates = this.generateDateRange(startDate, endDate);

      for (const date of dates) {
        const docRef = doc(dailyCollectionRef, date);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          results.push(snapshot.data() as DailyAnalyticsDoc);
        }
      }

      return results;
    } catch (error) {
      console.error('Error fetching daily analytics:', error);
      return [];
    }
  }

  /**
   * Generate array of date strings between start and end (inclusive)
   */
  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];

    const start = new Date(
      parseInt(startDate.substring(0, 4)),
      parseInt(startDate.substring(4, 6)) - 1,
      parseInt(startDate.substring(6, 8))
    );

    const end = new Date(
      parseInt(endDate.substring(0, 4)),
      parseInt(endDate.substring(4, 6)) - 1,
      parseInt(endDate.substring(6, 8))
    );

    const current = new Date(start);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      dates.push(`${year}${month}${day}`);

      current.setDate(current.getDate() + 1);
    }

    return dates;
  }
}
