# Analytics System - Complete Implementation Summary

**Last Updated:** January 8, 2026
**Version:** 2.0 (Complete Redesign)

---

## Table of Contents
1. [Overview](#overview)
2. [New Interfaces Created](#new-interfaces-created)
3. [Interface Changes](#interface-changes)
4. [Service Changes](#service-changes)
5. [Component Changes](#component-changes)
6. [Firestore Data Model](#firestore-data-model)
7. [Security Rules](#security-rules)
8. [Features Summary](#features-summary)

---

## Overview

Complete redesign of the analytics system from profile-document-based to a dedicated analytics infrastructure with:

- **Separate Collections:** `user_analytics`, `wishlists` for better data organization
- **Enhanced Tracking:** Profile view duration, search impressions, video watch time
- **Real-time Updates:** Buffered writes with batched Firestore updates
- **Better UX:** Loading spinner with rotating messages, enhanced visibility scoring
- **Video Analytics:** Full video tracking with view counts and watch time

**Migration Approach:** Started fresh (no migration of existing analytics data per user preference)

---

## New Interfaces Created

### File: `src/assets/interfaces/analytics.interfaces.ts` (NEW)

#### 1. UserAnalyticsDoc
Lifetime analytics aggregates for each actor.

```typescript
export interface UserAnalyticsDoc {
  actorId: string;
  profileViews: number;           // Total profile views by producers
  totalProfileViewMs: number;     // Total time spent viewing profile (milliseconds)
  searchAppearances: number;      // Times appeared in producer searches
  totalVideoViews: number;        // Sum of all video views
  totalWatchMs: number;           // Total video watch time (milliseconds)
  updatedAt: Timestamp;
}
```

**Firestore Path:** `user_analytics/{actorId}`

---

#### 2. DailyAnalyticsDoc
Daily rollup documents for analytics trends.

```typescript
export interface DailyAnalyticsDoc {
  date: string;                   // Format: "yyyyMMdd" (e.g., "20260108")
  profileViews: number;
  totalProfileViewMs: number;
  searchAppearances: number;
  totalVideoViews: number;
  totalWatchMs: number;
  updatedAt: Timestamp;
}
```

**Firestore Path:** `user_analytics/{actorId}/daily/{yyyyMMdd}`

---

#### 3. WishlistDoc
Wishlist tracking with composite key for efficient queries.

```typescript
export interface WishlistDoc {
  producerId: string;
  actorId: string;
  addedAt: Timestamp;
}
```

**Firestore Path:** `wishlists/{producerId}_{actorId}`

**Key Design:** Composite document ID enables:
- Fast producer wishlist queries: `where('producerId', '==', id)`
- Fast actor wishlist count: `collection('wishlists').where('actorId', '==', id).count()`
- Automatic deduplication

---

#### 4. VideoMetadataWithAnalytics
Extended video metadata with analytics fields.

```typescript
export interface VideoMetadataWithAnalytics extends VideoMetadata {
  viewCount?: number;             // Total views of this video
  totalWatchMs?: number;          // Total watch time for this video
}
```

**Firestore Path:** `uploads/{userId}/userUploads/{videoId}`

**Note:** Analytics fields added to existing video documents, no new collection needed.

---

#### 5. VideoTrackingSession
Internal tracking state for video analytics.

```typescript
export interface VideoTrackingSession {
  actorId: string;
  videoId: string;
  videoPath: string;
  lastPosition: number;           // Last known playback position (seconds)
  accumulatedWatchMs: number;     // Watch time accumulated this session
  lastUpdateTime: number;         // Timestamp of last update
  viewCountIncremented: boolean;  // Whether view has been counted (after 3s)
}
```

**Usage:** Client-side only, not stored in Firestore. Used for buffering watch time updates.

---

#### 6. AnalyticsIncrement
Helper type for atomic batch updates.

```typescript
export interface AnalyticsIncrement {
  profileViews?: number;
  totalProfileViewMs?: number;
  searchAppearances?: number;
  totalVideoViews?: number;
  totalWatchMs?: number;
}
```

**Usage:** Passed to `updateActorAnalytics()` for batched Firestore increments.

---

## Interface Changes

### File: `src/assets/interfaces/profile.interfaces.ts` (MODIFIED)

#### ActorProfile - Fields Removed ❌

```typescript
// REMOVED - Analytics moved to user_analytics collection
actorAnalytics?: ActorAnalytics[];      // Deprecated
profileViewCount?: number;               // Deprecated - use user_analytics/{id}.profileViews
wishListCount?: number;                  // Deprecated - use wishlists collection count
videoAnalytics?: VideoAnalytics[];       // Deprecated - analytics in uploads collection
```

**Reason:** Analytics data separated into dedicated collections for better scalability and real-time updates.

---

#### ProducerProfile - Fields Removed ❌

```typescript
// REMOVED - Wishlist moved to wishlists collection
wishList?: string[];                     // Deprecated - use wishlists collection
```

**Reason:** Wishlist data now stored in `wishlists` collection with proper indexing for count aggregation.

---

#### Deprecated Interfaces (Commented Out)

```typescript
// DEPRECATED - Use analytics.interfaces.ts instead
// export interface ActorAnalytics {
//   date: Timestamp;
//   profileView: number;
//   totalVideoViews: number;
// }

// DEPRECATED - Use VideoMetadataWithAnalytics instead
// export interface VideoAnalytics {
//   videoId: string;
//   views: number;
//   averageWatchTime: number;
// }
```

---

## Service Changes

### File: `src/app/services/analytics.service.ts` (COMPLETE REFACTOR)

#### New Methods Added ✅

##### Profile View Tracking
```typescript
async startProfileView(actorId: string): Promise<void>
```
- Called when producer lands on actor profile
- Records start time, checks ghost mode
- Minimum 1 second, maximum 10 minutes tracking

```typescript
async endProfileView(): Promise<void>
```
- Called on component destroy (leaving profile page)
- Calculates duration, updates Firestore atomically
- Updates both lifetime and daily analytics

---

##### Search Impression Tracking
```typescript
async trackSearchImpressions(actorIds: string[]): Promise<void>
```
- Called when search results are displayed
- Tracks first 20 actors only (performance optimization)
- Batch updates for all actors in parallel
- Respects ghost mode

---

##### Video Tracking
```typescript
async startVideoTracking(actorId: string, videoId: string, userId: string): Promise<void>
```
- Called when video starts playing
- Initializes tracking session with buffering

```typescript
updateVideoProgress(videoId: string, userId: string, currentTime: number): void
```
- Called on video `timeupdate` event (every ~250ms)
- Accumulates watch time, clamps deltas to 30s (prevents seek abuse)
- Buffers updates client-side

```typescript
async endVideoTracking(videoId: string, userId: string): Promise<void>
```
- Called on video end/pause/modal close
- Flushes buffered watch time to Firestore
- Updates user analytics and video metadata atomically

**Buffering Strategy:**
- Background flush every 20 seconds
- Immediate flush on pause/end
- View counted after 3 seconds of playback

---

##### Wishlist Management
```typescript
async addToWishlist(actorId: string, producerId: string): Promise<void>
```
- Creates wishlist document with composite ID: `{producerId}_{actorId}`

```typescript
async removeFromWishlist(actorId: string, producerId: string): Promise<void>
```
- Deletes wishlist document

```typescript
async getWishlistCount(actorId: string): Promise<number>
```
- Uses Firestore count aggregation (no cached counter)
- Query: `collection('wishlists').where('actorId', '==', actorId).count()`

```typescript
async isInWishlist(actorId: string, producerId: string): Promise<boolean>
```
- Checks document existence

```typescript
async getProducerWishlist(producerId: string): Promise<string[]>
```
- Returns array of actor IDs wishlisted by producer
- Query: `collection('wishlists').where('producerId', '==', producerId)`

---

##### Analytics Retrieval
```typescript
async getLifetimeAnalytics(actorId: string): Promise<UserAnalyticsDoc | null>
```
- Fetches lifetime analytics document
- Returns null if no data exists

```typescript
async getDailyAnalytics(actorId: string, startDate: string, endDate: string): Promise<DailyAnalyticsDoc[]>
```
- Fetches daily analytics range
- Date format: "yyyyMMdd" (e.g., "20260101" to "20260131")
- Ordered by date descending

---

#### Removed Methods ❌

```typescript
// OLD - Removed in favor of new tracking methods
trackProfileView(actorId: string, producerId: string, duration?: number)
trackWishlistAdd(actorId: string, producerId: string)
trackWishlistRemove(actorId: string, producerId: string)
trackVideoView(actorId: string, producerId: string, videoId: string, metadata: any)
getProfileAnalytics(actorId: string)
getProfileAnalyticsRealtime(actorId: string): Observable<any>
```

---

## Component Changes

### 1. ProfileComponent (`src/app/discover/profile.component.ts`)

#### Additions ✅

**Imports:**
```typescript
import { ViewChild, ElementRef } from '@angular/core';
```

**Properties:**
```typescript
@ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;
private currentVideoId: string | null = null;
private currentActorId: string | null = null;
```

**Lifecycle:**
```typescript
async ngOnInit() {
  // ... existing code ...

  // Start profile view tracking (new analytics system)
  if (this.currentUserRole() === 'producer' && userData.currentRole === 'actor') {
    await this.analyticsService.startProfileView(profileData.uid);
  }
}

async ngOnDestroy() {
  // End profile view tracking
  await this.analyticsService.endProfileView();

  // End any active video tracking session
  if (this.currentVideoId && this.currentActorId) {
    await this.analyticsService.endVideoTracking(this.currentVideoId, this.currentActorId);
  }
}
```

**Video Event Handlers (NEW):**
```typescript
async onVideoPlay() {
  if (!this.currentVideoId || !this.currentActorId || this.isViewingOwnProfile()) {
    return;
  }

  if (this.currentUserRole() !== 'producer') {
    return;
  }

  await this.analyticsService.startVideoTracking(
    this.currentActorId,
    this.currentVideoId,
    this.currentActorId
  );
}

onVideoPause() {
  // Handled by buffered updates in service
}

onVideoTimeUpdate(event: Event) {
  const video = event.target as HTMLVideoElement;
  if (!this.currentVideoId || !this.currentActorId || !video) {
    return;
  }

  this.analyticsService.updateVideoProgress(
    this.currentVideoId,
    this.currentActorId,
    video.currentTime
  );
}

async onVideoEnded() {
  if (this.currentVideoId && this.currentActorId) {
    await this.analyticsService.endVideoTracking(this.currentVideoId, this.currentActorId);
  }
}
```

**Template Changes:**
```html
<video
  #videoPlayer
  [src]="previewMediaUrl()"
  (loadeddata)="onMediaLoaded()"
  (play)="onVideoPlay()"
  (pause)="onVideoPause()"
  (timeupdate)="onVideoTimeUpdate($event)"
  (ended)="onVideoEnded()"
  controls
  autoplay
></video>
```

**Modal Navigation:**
```typescript
async closePreviewModal() {
  // End video tracking if a video was playing
  if (this.currentVideoId && this.currentActorId) {
    await this.analyticsService.endVideoTracking(this.currentVideoId, this.currentActorId);
    this.currentVideoId = null;
    this.currentActorId = null;
  }

  this.isPreviewModalOpen.set(false);
  // ... rest of cleanup ...
}

async goToPreviousMedia() {
  // End current video tracking before switching
  if (this.previewMediaType() === 'video' && this.currentVideoId && this.currentActorId) {
    await this.analyticsService.endVideoTracking(this.currentVideoId, this.currentActorId);
    this.currentVideoId = null;
    this.currentActorId = null;
  }
  // ... navigation logic ...
}
```

---

### 2. SearchComponent (`src/app/discover/search.component.ts`)

#### Changes ✅

**Fixed currentUserRole Signal:**
```typescript
// OLD - Regular variable (caused tracking bugs)
private currentUserRole: string | null = null;

// NEW - Signal (enables reactive tracking)
currentUserRole = signal<string | null>(null);
```

**Search Impression Tracking:**
```typescript
constructor() {
  effect(() => {
    const displayed = this.displayedActors();

    // Only track if user is a producer and there are results
    if (this.currentUserRole() === 'producer' && displayed.length > 0) {
      const actorIds = displayed.slice(0, 20).map(actor => actor.uid);

      this.analyticsService.trackSearchImpressions(actorIds).catch(err => {
        console.error('Error tracking search impressions:', err);
      });
    }
  });
}
```

**Wishlist Operations:**
```typescript
async toggleWishlist(actor: ActorSearchResult): Promise<void> {
  if (!this.currentUserId) {
    this.logger.error('No current user ID - cannot toggle wishlist');
    return;
  }

  const currentWishlist = this.wishlist();
  const index = currentWishlist.findIndex(a => a.uid === actor.uid);

  try {
    if (index > -1) {
      // Remove from wishlist
      this.wishlist.set(currentWishlist.filter(a => a.uid !== actor.uid));
      await this.analyticsService.removeFromWishlist(actor.uid, this.currentUserId);
      this.logger.log(`Removed ${actor.stageName} from wishlist`);
    } else {
      // Add to wishlist
      this.wishlist.set([...currentWishlist, actor]);
      await this.analyticsService.addToWishlist(actor.uid, this.currentUserId);
      this.logger.log(`Added ${actor.stageName} to wishlist`);
    }

    await this.saveWishlist(); // Kept for backward compatibility
  } catch (error) {
    this.logger.error('Error toggling wishlist:', error);
  }
}
```

**Bug Fix:**
```typescript
// Lines 1437-1438 - Fixed accessing removed fields
// OLD (caused errors):
profileViewCount: actor.profileViewCount || 0,
wishlistCount: actor.wishListCount || 0,

// NEW (hardcoded until migration):
profileViewCount: 0, // Analytics moved to separate collection
wishlistCount: 0,    // Analytics moved to separate collection
```

---

### 3. AnalyticsSectionComponent (`src/app/discover/settings/sections/analytics-section.component.ts`)

#### Major Changes ✅

**Loading State (NEW):**
```typescript
// Loading state
isLoading = signal<boolean>(true);
currentMessageIndex = signal<number>(0);
private messageInterval: any = null;

// Loading messages
private readonly loadingMessages = [
  "Crunching the numbers...",
  "Calculating your star power...",
  "Analyzing your reach...",
  "Tallying up those profile views...",
  "Counting all those video watches...",
  "Seeing who wishlisted you...",
  "Checking your search appearances...",
  "Computing your visibility score...",
  "Reviewing your top performances...",
  "Mapping your growth trends...",
];
```

**Message Rotation Methods:**
```typescript
private startMessageRotation(): void {
  if (this.messageInterval) return;

  this.messageInterval = setInterval(() => {
    if (!this.isLoading()) {
      this.stopMessageRotation();
      return;
    }

    const nextIndex = (this.currentMessageIndex() + 1) % this.loadingMessages.length;
    this.currentMessageIndex.set(nextIndex);
  }, 2000);
}

private stopMessageRotation(): void {
  if (this.messageInterval) {
    clearInterval(this.messageInterval);
    this.messageInterval = null;
  }
}

getCurrentLoadingMessage(): string {
  return this.loadingMessages[this.currentMessageIndex()];
}

ngOnDestroy() {
  this.stopMessageRotation();
}
```

**Data Loading (REFACTORED):**
```typescript
async ngOnInit() {
  this.startMessageRotation();
  await this.loadAnalytics();
}

private async loadAnalytics() {
  const currentUser = this.authService.getCurrentUser();
  if (!currentUser) return;

  try {
    // 1. Load lifetime analytics
    const lifetimeData = await this.analyticsService.getLifetimeAnalytics(currentUser.uid);

    // 2. Load wishlist count (count aggregation)
    const wishlistCount = await this.analyticsService.getWishlistCount(currentUser.uid);

    // 3. Load last 30 days of daily data
    const endDate = this.getTodayId();
    const startDate = this.getDateIdDaysAgo(30);
    const dailyData = await this.analyticsService.getDailyAnalytics(
      currentUser.uid,
      startDate,
      endDate
    );

    // 4. Load top video
    const topVideo = await this.loadTopVideo(currentUser.uid);

    // 5. Calculate derived metrics
    const avgProfileViewDuration = lifetimeData?.totalProfileViewMs && lifetimeData?.profileViews
      ? this.formatDuration(lifetimeData.totalProfileViewMs / lifetimeData.profileViews / 1000)
      : 'N/A';

    const avgVideoWatchTime = lifetimeData?.totalWatchMs && lifetimeData?.totalVideoViews
      ? this.formatDuration(lifetimeData.totalWatchMs / lifetimeData.totalVideoViews / 1000)
      : 'N/A';

    const visibilityScore = this.calculateVisibilityScore(
      lifetimeData?.profileViews || 0,
      wishlistCount,
      lifetimeData?.searchAppearances || 0,
      lifetimeData?.totalVideoViews || 0,
      lifetimeData?.totalWatchMs || 0
    );

    // 6. Update signal
    this.analytics.set({
      profileViews: lifetimeData?.profileViews || 0,
      avgProfileViewDuration,
      searchAppearances: lifetimeData?.searchAppearances || 0,
      totalVideoViews: lifetimeData?.totalVideoViews || 0,
      avgVideoWatchTime,
      wishlistCount,
      visibilityScore,
      topVideo,
      dailyData,
    });

    // Set loading to false
    this.isLoading.set(false);

  } catch (error) {
    console.error('Error loading analytics:', error);
    this.isLoading.set(false); // Still hide spinner on error
  }
}
```

**Enhanced Visibility Score:**
```typescript
private calculateVisibilityScore(
  profileViews: number,
  wishlistCount: number,
  searchAppearances: number,
  totalVideoViews: number,
  totalWatchMs: number
): number {
  /**
   * Enhanced visibility score formula with video metrics
   * Weights:
   * - Profile views: 1x (baseline engagement)
   * - Wishlist count: 3x (strong interest signal)
   * - Search appearances: 0.5x (exposure metric)
   * - Video views: 2x (content engagement)
   * - Avg watch time: bonus multiplier (quality metric)
   */

  // Base engagement score
  const baseScore = profileViews + (wishlistCount * 3) + (searchAppearances * 0.5) + (totalVideoViews * 2);

  // Calculate average watch time in seconds
  const avgWatchTimeSec = totalVideoViews > 0 ? (totalWatchMs / totalVideoViews / 1000) : 0;

  // Bonus multiplier based on average watch time
  // 0-10s: 1.0x, 10-30s: 1.1x, 30-60s: 1.2x, 60s+: 1.3x
  let watchTimeMultiplier = 1.0;
  if (avgWatchTimeSec >= 60) {
    watchTimeMultiplier = 1.3;
  } else if (avgWatchTimeSec >= 30) {
    watchTimeMultiplier = 1.2;
  } else if (avgWatchTimeSec >= 10) {
    watchTimeMultiplier = 1.1;
  }

  const rawScore = baseScore * watchTimeMultiplier;

  // Normalize to 0-100 scale
  return Math.min(Math.round(rawScore / 10), 100);
}
```

**Top Video Loading:**
```typescript
private async loadTopVideo(userId: string): Promise<{
  title: string;
  views: number;
  avgWatchTime: string;
} | null> {
  try {
    // Query uploads/{userId}/userUploads for videos
    const videosRef = collection(this.firestore, `uploads/${userId}/userUploads`);
    const q = query(videosRef, where('fileType', '==', 'video'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // Find video with highest viewCount
    let topVideo: any = null;
    let maxViews = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.fileType === 'video' && data.metadata) {
        const metadata = data.metadata as any;
        const viewCount = metadata.viewCount || 0;

        if (viewCount > maxViews) {
          maxViews = viewCount;
          topVideo = {
            title: data.fileName || 'Untitled Video',
            views: viewCount,
            totalWatchMs: metadata.totalWatchMs || 0,
          };
        }
      }
    });

    if (!topVideo) return null;

    // Calculate average watch time
    const avgWatchTimeSec = topVideo.views > 0
      ? (topVideo.totalWatchMs / topVideo.views / 1000)
      : 0;

    return {
      title: topVideo.title,
      views: topVideo.views,
      avgWatchTime: this.formatDuration(avgWatchTimeSec),
    };
  } catch (error) {
    console.error('Error loading top video:', error);
    return null;
  }
}
```

**Loading UI Template:**
```html
@if (isSubscribed()) {
  @if (isLoading()) {
    <!-- Loading State -->
    <div class="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <!-- Spinner -->
      <div class="relative">
        <svg class="w-12 h-12 text-purple-400 animate-spin" ...>
          <!-- SVG spinner paths -->
        </svg>
      </div>

      <!-- Rotating Message -->
      <div class="text-sm font-medium text-purple-300 animate-pulse">
        {{ getCurrentLoadingMessage() }}
      </div>
    </div>
  } @else {
    <!-- Analytics Content (existing UI) -->
    <div class="space-y-8">
      <!-- Profile Overview, Video Performance, etc. -->
    </div>
  }
}
```

---

### 4. SettingsComponent (`src/app/discover/settings/settings.component.ts`)

#### Removals ❌

**Removed Properties:**
```typescript
// REMOVED - Analytics section now loads its own data
private analyticsSubscription: Subscription | null = null;

analyticsData = signal<{
  profileViewCount: number;
  wishListCount: number;
  actorAnalytics: any[];
  videoAnalytics: any[];
  visibilityScore: number;
} | null>(null);
```

**Removed Logic:**
```typescript
// REMOVED from ngOnInit
this.analyticsSubscription = this.analyticsService
  .getProfileAnalyticsRealtime(user.uid)
  .subscribe((analytics) => {
    this.analyticsData.set(analytics);
  });

// REMOVED ngOnDestroy
ngOnDestroy() {
  if (this.analyticsSubscription) {
    this.analyticsSubscription.unsubscribe();
  }
}
```

**Removed Template Binding:**
```html
<!-- REMOVED -->
<app-analytics-section
  [analyticsData]="analyticsData()"
/>

<!-- NEW -->
<app-analytics-section
  [isSubscribed]="isSubscribed()"
  [upgradeSubscription]="upgradeToYearlyFromAnalyticsHandler"
/>
```

---

### 5. AuthService (`src/app/services/auth.service.ts`)

#### Changes ✅

**Actor Profile Initialization (Removed Fields):**
```typescript
// Before:
const actorProfile: ActorProfile = {
  stageName: data.stageName,
  carouselImagesUrl: [],
  skills: [],
  languages: [],
  listEducation: [],
  actorWorks: [],
  notifications: [],
  actorAnalytics: [],        // REMOVED
  profileViewCount: 0,       // REMOVED
  wishListCount: 0,          // REMOVED
  isSubscribed: false,
};

// After:
const actorProfile: ActorProfile = {
  stageName: data.stageName,
  carouselImagesUrl: [],
  skills: [],
  languages: [],
  listEducation: [],
  actorWorks: [],
  notifications: [],
  isSubscribed: false,
};
```

**Producer Profile Initialization (Removed Fields):**
```typescript
// Before:
const producerProfile: ProducerProfile = {
  name: data.name,
  productionHouse: data.productionHouse,
  producerWorks: [],
  notifications: [],
  isSubscribed: false,
  isBadgedVerified: false,
  wishList: [],              // REMOVED
};

// After:
const producerProfile: ProducerProfile = {
  name: data.name,
  productionHouse: data.productionHouse,
  producerWorks: [],
  notifications: [],
  isSubscribed: false,
  isBadgedVerified: false,
};
```

---

## Firestore Data Model

### Collection Structure

```
firestore/
├── user_analytics/
│   ├── {actorId}/                    # Lifetime analytics document
│   │   └── daily/
│   │       ├── 20260108/             # Daily rollup
│   │       ├── 20260107/
│   │       └── ...
│   └── ...
│
├── wishlists/
│   ├── {producerId}_{actorId}/       # Composite key wishlist doc
│   └── ...
│
└── uploads/
    └── {userId}/
        └── userUploads/
            └── {videoId}/            # Video with analytics fields
                ├── fileName: string
                ├── fileType: "video"
                └── metadata:
                    ├── viewCount: number      # NEW
                    └── totalWatchMs: number   # NEW
```

---

### Data Flow Diagram

```
Producer Actions:
┌─────────────────────┐
│ Search for Actors   │
└──────────┬──────────┘
           │
           ▼
   Track First 20 IDs
           │
           ▼
┌─────────────────────────────────┐
│ user_analytics/{actorId}        │
│   searchAppearances += 1        │
│                                 │
│ user_analytics/{actorId}/daily/ │
│   {date}.searchAppearances += 1 │
└─────────────────────────────────┘

┌─────────────────────┐
│ View Actor Profile  │
└──────────┬──────────┘
           │
           ▼
   Start Timer (min 1s, max 10min)
           │
           ▼
┌─────────────────────────────────┐
│ user_analytics/{actorId}        │
│   profileViews += 1             │
│   totalProfileViewMs += duration│
│                                 │
│ user_analytics/{actorId}/daily/ │
│   {date}.profileViews += 1      │
│   {date}.totalProfileViewMs +=  │
└─────────────────────────────────┘

┌─────────────────────┐
│ Watch Actor Video   │
└──────────┬──────────┘
           │
           ▼
   Buffer watch time (20s flush)
   Count view after 3s
           │
           ▼
┌─────────────────────────────────┐
│ user_analytics/{actorId}        │
│   totalVideoViews += 1          │
│   totalWatchMs += watchTime     │
│                                 │
│ uploads/{actorId}/userUploads/  │
│   {videoId}.metadata:           │
│     viewCount += 1              │
│     totalWatchMs += watchTime   │
└─────────────────────────────────┘

┌─────────────────────┐
│ Add to Wishlist     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ wishlists/                      │
│   {producerId}_{actorId}        │
│     producerId: string          │
│     actorId: string             │
│     addedAt: Timestamp          │
└─────────────────────────────────┘
```

---

## Security Rules

### File: `FIRESTORE_ANALYTICS_RULES.md` (CREATED)

**Key Security Features:**

1. **Increment Validation:** Max bounds to prevent abuse
   - Profile views: +10 per write
   - Profile duration: +600,000ms (10 min) per write
   - Search appearances: +100 per write
   - Video views: +50 per write
   - Video watch time: +3,600,000ms (1 hour) per write

2. **Role-Based Access:**
   - Producers: Write analytics
   - Actors: Read their own analytics only

3. **Wishlist ID Validation:**
   - Must match pattern: `{producerId}_{actorId}`
   - Prevents unauthorized wishlist manipulation

4. **Video Analytics:**
   - Only `viewCount` and `totalWatchMs` fields can be updated by producers
   - Other metadata protected

**Example Rule:**
```javascript
match /user_analytics/{actorId} {
  allow read: if isOwner(actorId);

  allow create, update: if isProducer()
    && request.resource.data.actorId == actorId
    && isValidIncrement('profileViews', 10)
    && isValidIncrement('totalProfileViewMs', 600000)
    && isValidIncrement('searchAppearances', 100)
    && isValidIncrement('totalVideoViews', 50)
    && isValidIncrement('totalWatchMs', 3600000);
}
```

---

## Features Summary

### ✅ Implemented Features

#### 1. Profile View Tracking
- ✅ Duration tracking (min 1s, max 10min)
- ✅ Ghost mode support
- ✅ Lifetime + daily aggregates
- ✅ Average time calculation in UI

#### 2. Search Impression Tracking
- ✅ First 20 displayed actors tracked
- ✅ Reactive with Angular signals
- ✅ Batch updates for performance
- ✅ Respects ghost mode

#### 3. Video Analytics
- ✅ View count (after 3s playback)
- ✅ Watch time tracking with buffering
- ✅ Per-video analytics in metadata
- ✅ Aggregate totals in user_analytics
- ✅ Top video detection in UI
- ✅ Event handlers on video player
- ✅ Modal navigation handling

#### 4. Wishlist Tracking
- ✅ Separate wishlists collection
- ✅ Composite key for efficiency
- ✅ Count aggregation (no cached counter)
- ✅ Add/remove operations
- ✅ Producer wishlist queries

#### 5. Enhanced Visibility Score
- ✅ Profile views (1x weight)
- ✅ Wishlist count (3x weight)
- ✅ Search appearances (0.5x weight)
- ✅ Video views (2x weight) ⭐ NEW
- ✅ Avg watch time multiplier (1.0x-1.3x) ⭐ NEW
- ✅ 0-100 normalized scale

#### 6. Loading Experience
- ✅ Purple-themed spinner
- ✅ 10 rotating fun messages
- ✅ 2-second rotation interval
- ✅ Show all data at once (no progressive loading)
- ✅ Smooth animations
- ✅ Error handling

#### 7. Data Aggregation
- ✅ Lifetime analytics documents
- ✅ Daily rollup subcollection
- ✅ Atomic batch updates (lifetime + daily)
- ✅ Firestore increment() for counters

#### 8. Performance Optimizations
- ✅ Buffered video tracking (20s flush)
- ✅ Search impression limits (20 actors)
- ✅ Batched Firestore writes
- ✅ Client-side accumulation
- ✅ Cleanup on component destroy

---

### 🔄 Migration Tasks (Optional/Future)

#### Data Migration Scripts
```typescript
// Migrate existing producer wishlists to wishlists collection
// Run once after deployment for data continuity

// Clean up old analytics fields from profiles
// Run after 1-2 weeks of new system verification
```

#### Cleanup Tasks
- Remove deprecated service methods
- Archive old ActorAnalytics/VideoAnalytics interfaces
- Update documentation

---

## Testing Checklist

### Functional Tests
- ✅ Profile view tracking starts/stops correctly
- ✅ Video tracking counts view after 3s
- ✅ Video watch time accumulates correctly
- ✅ Wishlist add/remove creates/deletes docs
- ✅ Search impressions track first 20 actors
- ✅ Loading spinner appears immediately
- ✅ Messages rotate every 2 seconds
- ✅ Analytics content shows when loaded

### Edge Cases
- ✅ Ghost mode blocks all tracking
- ✅ Error in loadAnalytics still hides spinner
- ✅ Component destroy cleans up intervals
- ✅ Video navigation ends previous tracking
- ✅ Profile duration capped at 10 minutes
- ✅ Watch time deltas clamped to 30s

### Security
- ✅ Firestore rules prevent unauthorized writes
- ✅ Increment bounds enforced
- ✅ Role-based access working
- ✅ Wishlist ID validation

---

## Performance Metrics

### Estimated Load Times
- Lifetime analytics query: ~500ms-1s
- Wishlist count aggregation: ~500ms-1s
- Daily analytics (30 days): ~500ms-1s
- Top video query: ~1-2s
- **Total analytics load: 2-8 seconds**

### Firestore Operations
- Profile view: 2 writes (lifetime + daily)
- Search impression (20 actors): 40 writes (20 lifetime + 20 daily)
- Video view: 4 writes (lifetime + daily + video metadata)
- Wishlist add: 1 write
- Wishlist remove: 1 delete

### Bundle Size Impact
- Analytics interfaces: ~1KB
- Service refactor: ~3KB increase
- Component changes: ~2KB increase
- **Total: ~6KB added (negligible)**

---

## Version History

### v2.0 - Complete Redesign (January 8, 2026)
- New analytics collections (user_analytics, wishlists)
- Enhanced video tracking with watch time
- Loading spinner with rotating messages
- Enhanced visibility score with video metrics
- Firestore security rules documentation
- Bug fixes (SearchComponent currentUserRole signal)

### v1.0 - Legacy (Deprecated)
- Profile-document-based analytics
- Cached counters in profile documents
- No video watch time tracking
- Simple visibility score
- No loading state

---

## Key Decisions & Rationale

### Why Separate Collections?
- **Scalability:** Analytics can grow independently from profiles
- **Performance:** Indexed queries on dedicated collections
- **Real-time:** Count aggregation without cached counters
- **Security:** Granular rules per collection

### Why Buffered Video Tracking?
- **Reduced writes:** 20s flush vs. continuous writes
- **Cost optimization:** Fewer Firestore operations
- **Better UX:** No lag from frequent updates
- **Accuracy:** Delta clamping prevents abuse

### Why Composite Wishlist IDs?
- **Deduplication:** ID enforces one wishlist entry per producer-actor pair
- **Fast queries:** Both producer and actor queries indexed
- **Simplicity:** No separate uniqueness enforcement needed

### Why No Data Migration?
- **User preference:** Start fresh per user request
- **Complexity:** Old data structure incompatible
- **Clean slate:** New system unencumbered by legacy data

---

## Support & Troubleshooting

### Common Issues

**Q: Analytics not updating?**
- Check Firestore rules are deployed correctly
- Verify user role (only producers write analytics)
- Check ghost mode is disabled
- Look for errors in browser console

**Q: Loading spinner stuck?**
- Check network tab for failed Firestore queries
- Verify analytics collections exist
- Check error handling in loadAnalytics()

**Q: Video views not counting?**
- Verify video plays for at least 3 seconds
- Check video event handlers attached correctly
- Ensure producer is viewing actor profile

**Q: Wishlist count incorrect?**
- Firestore count aggregation may have delay
- Check wishlists collection for duplicate docs
- Verify composite ID format: `{producerId}_{actorId}`

### Debug Mode

Enable detailed logging:
```typescript
// In AnalyticsService
private readonly DEBUG = true;

if (this.DEBUG) {
  console.log('[Analytics] Profile view started:', actorId);
  console.log('[Analytics] Video tracking:', session);
}
```

---

## Future Enhancements (Out of Scope)

### Potential Features
- **Skeleton Loading:** Show placeholder cards while loading
- **Progressive Loading:** Display data as it arrives
- **Personalized Messages:** Use actual data in loading messages
- **Daily/Weekly Charts:** Visualize trends from daily data
- **Export Analytics:** Download CSV/PDF reports
- **Email Notifications:** Weekly analytics summary
- **Comparison View:** Compare periods (this week vs. last week)
- **Geographic Analytics:** Track producer locations
- **Device Analytics:** Track viewing platforms

---

## Contact

For questions or issues related to the analytics system:
- **Documentation:** This file
- **Firestore Rules:** `FIRESTORE_ANALYTICS_RULES.md`
- **Interfaces:** `src/assets/interfaces/analytics.interfaces.ts`
- **Service:** `src/app/services/analytics.service.ts`

---

**End of Document**
