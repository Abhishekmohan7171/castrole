# Real-time Analytics Implementation Plan

## Overview
Replace Cloud Functions-based analytics aggregation with real-time updates directly to profile documents. All analytics will be stored and updated in the `profiles` collection.

---

## Requirements
- **Complete replacement** of Cloud Functions
- **Real-time metrics:** Profile views, wishlist counts, recent viewers, video view counts
- **No time-windowed metrics** (only all-time totals)
- Immediate feedback to actors on their analytics

---

## Current vs. Proposed Architecture

### Current Architecture
```
User Action (Producer views profile)
    ↓
Analytics Service
    ↓
Write to analytics_events collection (raw event)
    ↓
Write to user_analytics (aggregated data)
    ↓
[Daily Cloud Function at 3 AM UTC]
    ↓
Aggregate analytics_events → Update user_analytics, video_analytics, tag_analytics
    ↓
Frontend reads from user_analytics
```

### Proposed Architecture
```
User Action (Producer views profile)
    ↓
Analytics Service
    ↓
Direct update to profiles/{actorId} document (atomic increment + array update)
    ↓
Frontend reads from profiles/{actorId} (real-time listener)
    ↓
Immediate display to actor
```

---

## Data Structure Changes

### Enhanced `ActorProfile` Interface

```typescript
export interface ActorProfile {
  // Existing fields...
  stageName: string;
  actorProfileImageUrl?: string;
  carouselImagesUrl?: string[];

  // ENHANCED ANALYTICS FIELDS
  profileViewCount: number;              // All-time total views
  wishListCount: number;                 // All-time wishlist additions
  actorAnalytics: ActorAnalytics[];      // Recent viewers (max 100 entries)
  videoAnalytics?: VideoAnalytics[];     // Per-video view counts

  // Ghost mode (privacy)
  ghostModeEnabled?: boolean;
}
```

### Enhanced `ActorAnalytics` Interface

```typescript
export interface ActorAnalytics {
  producerId: string;                    // Producer who viewed
  lastViewedAt: Timestamp;               // Most recent view timestamp
  totalViews: number;                    // Total views from this producer
  isWishlist: boolean;                   // Currently in wishlist
  videosWatched?: string[];              // Video filenames watched (max 10)
  firstViewedAt?: Timestamp;             // First view timestamp (optional)
}
```

### New `VideoAnalytics` Interface

```typescript
export interface VideoAnalytics {
  videoId: string;                       // Filename or unique ID
  videoTitle: string;                    // Video title/description
  viewCount: number;                     // Total views
  lastViewedAt?: Timestamp;              // Last view timestamp
  lastViewedBy?: string;                 // Last viewer producer ID
}
```

---

## Implementation Steps

### 1. Update TypeScript Interfaces

**File:** `src/assets/interfaces/profile.interfaces.ts`

- Enhance `ActorAnalytics` interface with new fields
- Add `VideoAnalytics` interface
- Update `ActorProfile` to use enhanced types

### 2. Refactor Analytics Service

**File:** `src/app/services/analytics.service.ts`

**Changes:**

#### A. Track Profile View (Real-time)
```typescript
async trackProfileView(
  actorId: string,
  producerId: string,
  duration?: number
): Promise<void> {
  // Check ghost mode
  const actorDoc = await getDoc(doc(this.firestore, 'profiles', actorId));
  if (!actorDoc.exists()) return;

  const actorData = actorDoc.data();
  if (actorData['ghostModeEnabled']) return;

  const profileRef = doc(this.firestore, 'profiles', actorId);

  // Get current actorAnalytics array
  const currentAnalytics: ActorAnalytics[] = actorData['actorAnalytics'] || [];
  const existingIndex = currentAnalytics.findIndex(a => a.producerId === producerId);

  if (existingIndex >= 0) {
    // Update existing entry
    currentAnalytics[existingIndex] = {
      ...currentAnalytics[existingIndex],
      lastViewedAt: Timestamp.now(),
      totalViews: (currentAnalytics[existingIndex].totalViews || 0) + 1,
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

  // Keep only last 100 entries (most recent)
  const sortedAnalytics = currentAnalytics
    .sort((a, b) => b.lastViewedAt.toMillis() - a.lastViewedAt.toMillis())
    .slice(0, 100);

  // Update Firestore
  await updateDoc(profileRef, {
    profileViewCount: increment(1),
    actorAnalytics: sortedAnalytics,
  });
}
```

#### B. Track Wishlist Add/Remove (Real-time)
```typescript
async trackWishlistAdd(actorId: string, producerId: string): Promise<void> {
  // Check ghost mode
  const actorDoc = await getDoc(doc(this.firestore, 'profiles', actorId));
  if (!actorDoc.exists()) return;

  const actorData = actorDoc.data();
  if (actorData['ghostModeEnabled']) return;

  const profileRef = doc(this.firestore, 'profiles', actorId);
  const currentAnalytics: ActorAnalytics[] = actorData['actorAnalytics'] || [];

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
    });
  }

  // Update Firestore
  await updateDoc(profileRef, {
    wishListCount: increment(1),
    actorAnalytics: currentAnalytics,
  });
}

async trackWishlistRemove(actorId: string, producerId: string): Promise<void> {
  const profileRef = doc(this.firestore, 'profiles', actorId);
  const actorDoc = await getDoc(profileRef);

  if (!actorDoc.exists()) return;

  const actorData = actorDoc.data();
  const currentAnalytics: ActorAnalytics[] = actorData['actorAnalytics'] || [];

  // Find and update producer entry
  const existingIndex = currentAnalytics.findIndex(a => a.producerId === producerId);

  if (existingIndex >= 0) {
    currentAnalytics[existingIndex].isWishlist = false;

    await updateDoc(profileRef, {
      wishListCount: increment(-1),
      actorAnalytics: currentAnalytics,
    });
  }
}
```

#### C. Track Video View (Real-time)
```typescript
async trackVideoView(
  actorId: string,
  producerId: string,
  videoId: string,
  videoTitle: string,
  videoTags: string[],
  watchDuration?: number
): Promise<void> {
  // Check ghost mode
  const actorDoc = await getDoc(doc(this.firestore, 'profiles', actorId));
  if (!actorDoc.exists()) return;

  const actorData = actorDoc.data();
  if (actorData['ghostModeEnabled']) return;

  const profileRef = doc(this.firestore, 'profiles', actorId);

  // Update actorAnalytics (add video to videosWatched)
  const currentAnalytics: ActorAnalytics[] = actorData['actorAnalytics'] || [];
  const existingIndex = currentAnalytics.findIndex(a => a.producerId === producerId);

  if (existingIndex >= 0) {
    const videosWatched = currentAnalytics[existingIndex].videosWatched || [];
    if (!videosWatched.includes(videoId)) {
      videosWatched.push(videoId);
      currentAnalytics[existingIndex].videosWatched = videosWatched.slice(-10); // Keep last 10
    }
  }

  // Update videoAnalytics
  const currentVideoAnalytics: VideoAnalytics[] = actorData['videoAnalytics'] || [];
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
}
```

#### D. Remove Search Impression Tracking
- Delete `trackSearchImpression()` method (no longer needed)
- Remove all references to `analytics_events` collection

### 3. Update Frontend Components

#### A. Profile Component

**File:** `src/app/discover/profile.component.ts`

**Changes:**
- Keep `trackProfileView()` call (service now updates profile directly)
- Update `trackVideoView()` to pass video metadata correctly

#### B. Search Component

**File:** `src/app/discover/search.component.ts`

**Changes:**
- Update `toggleWishlist()` to call both `trackWishlistAdd()` and `trackWishlistRemove()`
- Remove `trackSearchImpressions()` method and all calls to it
- Remove `lastTrackedResults` property

```typescript
async toggleWishlist(actor: ActorSearchResult): Promise<void> {
  const currentWishlist = this.wishlist();
  const index = currentWishlist.findIndex(a => a.uid === actor.uid);

  if (index > -1) {
    // Remove from wishlist
    this.wishlist.set(currentWishlist.filter(a => a.uid !== actor.uid));

    // Track removal
    if (this.currentUserId) {
      await this.analyticsService.trackWishlistRemove(actor.uid, this.currentUserId);
    }
  } else {
    // Add to wishlist
    this.wishlist.set([...currentWishlist, actor]);

    // Track addition
    if (this.currentUserId) {
      await this.analyticsService.trackWishlistAdd(actor.uid, this.currentUserId);
    }
  }

  await this.saveWishlist();
}
```

#### C. Analytics Section Component

**File:** `src/app/discover/settings/sections/analytics-section.component.ts`

**Changes:**
- Read analytics directly from profile document instead of `user_analytics` collection
- Update template to display new fields
- Calculate "top video" from `videoAnalytics` array
- Show recent viewers from `actorAnalytics` array

```typescript
async loadAnalytics() {
  const user = this.auth.getCurrentUser();
  if (!user) return;

  // Read directly from profile
  const profileRef = doc(this.firestore, 'profiles', user.uid);
  const profileDoc = await getDoc(profileRef);

  if (!profileDoc.exists()) return;

  const profile = profileDoc.data() as ActorProfile;

  this.analytics = {
    profileViews: {
      total: profile.profileViewCount || 0,
      last30Days: 0, // Not tracked anymore
      avgDuration: 0, // Not tracked anymore
    },
    wishlistCount: profile.wishListCount || 0,
    visibilityScore: this.calculateVisibilityScore(profile),
    actorAnalytics: profile.actorAnalytics || [],
    videoAnalytics: profile.videoAnalytics || [],
  };

  // Find top video
  if (profile.videoAnalytics && profile.videoAnalytics.length > 0) {
    const topVideo = profile.videoAnalytics.reduce((max, video) =>
      video.viewCount > max.viewCount ? video : max
    );

    this.topVideo = {
      videoId: topVideo.videoId,
      videoTitle: topVideo.videoTitle,
      totalViews: topVideo.viewCount,
      avgWatchTime: 0, // Not tracked anymore
    };
  }
}

private calculateVisibilityScore(profile: ActorProfile): number {
  // Simple formula: views + (wishlist * 2)
  const views = profile.profileViewCount || 0;
  const wishlists = profile.wishListCount || 0;

  const rawScore = views + (wishlists * 2);

  // Normalize to 0-100 scale (adjust multiplier based on your needs)
  return Math.min(Math.round(rawScore / 10), 100);
}
```

### 4. Update Firestore Security Rules

**File:** `firestore.rules`

```javascript
match /profiles/{profileId} {
  // Allow actors to read their own profile (including analytics)
  allow read: if request.auth != null && request.auth.uid == profileId;

  // Allow public read for basic profile info (but not analytics)
  allow read: if request.auth != null;

  // Allow producers to increment view counts and update analytics
  allow update: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.currentRole == 'producer'
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
      'profileViewCount',
      'wishListCount',
      'actorAnalytics',
      'videoAnalytics'
    ])
    && request.resource.data.profileViewCount >= resource.data.profileViewCount
    && request.resource.data.wishListCount >= resource.data.wishListCount;

  // Allow actors to update their own profile
  allow update: if request.auth != null && request.auth.uid == profileId;
}
```

### 5. Remove Cloud Functions

**Files to modify/remove:**
- `functions/src/analyticsAggregation.ts` - DELETE
- `functions/src/index.ts` - Remove `aggregateAnalytics` export
- `CLOUD_FUNCTIONS_GUIDE.md` - Update to remove analytics aggregation section

### 6. Remove Unused Collections

**Collections to deprecate:**
- `analytics_events` - No longer written to
- `user_analytics` - Replaced by profile fields
- `video_analytics` - Replaced by profile.videoAnalytics array
- `tag_analytics` - No longer tracked (could be computed on-demand if needed)

**Note:** Don't delete these collections immediately. Keep them for historical data if needed, but stop writing to them.

---

## Migration Considerations

### Existing Data
If you have existing analytics in `user_analytics`, you may want to migrate it to profile documents:

```typescript
// One-time migration script
async function migrateAnalytics() {
  const userAnalyticsSnapshot = await getDocs(collection(firestore, 'user_analytics'));

  for (const doc of userAnalyticsSnapshot.docs) {
    const analytics = doc.data() as UserAnalytics;
    const actorId = analytics.actorId;

    const profileRef = doc(firestore, 'profiles', actorId);

    await updateDoc(profileRef, {
      profileViewCount: analytics.profileViews.total,
      wishListCount: analytics.wishlistCount,
      // Cannot migrate actorAnalytics (no producer-level data in current system)
    });
  }
}
```

---

## Performance Considerations

### Document Size Limits
- Firestore documents have a 1MB size limit
- `actorAnalytics` array capped at 100 entries (~20KB with all fields)
- `videoAnalytics` array size depends on number of videos (estimate ~1KB per 10 videos)
- Should be safe for most profiles

### Write Costs
- **Before:** 2 writes per profile view (analytics_events + user_analytics)
- **After:** 1 write per profile view (profiles document)
- **Savings:** 50% reduction in writes
- **Cloud Function costs:** Eliminated entirely

### Read Costs
- **Before:** Read from user_analytics, video_analytics, tag_analytics (3 reads)
- **After:** Read from profiles (1 read)
- **Savings:** 66% reduction in reads

### Concurrent Writes
- Using Firestore `increment()` handles concurrent writes atomically
- Array updates may have race conditions if multiple producers view simultaneously
- Consider using Firestore transactions if race conditions become an issue

---

## Testing Checklist

- [ ] Profile view increments `profileViewCount`
- [ ] Wishlist add increments `wishListCount`
- [ ] Wishlist remove decrements `wishListCount`
- [ ] `actorAnalytics` array updates with recent viewers
- [ ] `actorAnalytics` array caps at 100 entries
- [ ] Video view updates `videoAnalytics` array
- [ ] Ghost mode blocks all analytics tracking
- [ ] Analytics section displays correct data
- [ ] Real-time updates appear immediately
- [ ] Firestore security rules prevent unauthorized writes

---

## Future Enhancements (Optional)

1. **Time-windowed metrics:** Store timestamps in arrays and compute on-demand
2. **Tag analytics:** Compute from `videoAnalytics` array on-demand
3. **Trending score:** Compute based on recent activity
4. **Export analytics:** Allow actors to download CSV of their analytics
5. **Producer insights:** Show which producers viewed which videos

---

## Summary

This approach:
- ✅ Eliminates Cloud Functions (cost savings)
- ✅ Provides real-time analytics updates
- ✅ Simplifies architecture
- ✅ Reduces Firestore reads/writes
- ✅ Maintains core analytics features
- ✅ Respects ghost mode privacy
- ❌ Loses time-windowed metrics (by design)
- ❌ Loses detailed event history
- ⚠️ Requires careful handling of array size limits
