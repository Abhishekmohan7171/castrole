# Cloud Functions Removal Guide

## Overview
This guide outlines the steps to remove Cloud Functions related to analytics aggregation from your Castrole project.

## What's Being Removed

### 1. Cloud Functions
- **File**: `functions/src/analyticsAggregation.ts`
- **Function**: `aggregateAnalytics` (scheduled daily at 3 AM UTC)
- **Purpose**: Was aggregating analytics events into user_analytics, video_analytics, and tag_analytics collections

### 2. Firestore Collections (Deprecated)
These collections are no longer written to but may contain historical data:
- `analytics_events` - Raw event logs
- `user_analytics` - Aggregated user-level analytics
- `video_analytics` - Aggregated video-level analytics
- `tag_analytics` - Aggregated tag-level analytics

### 3. Interfaces (Deprecated)
- **File**: `src/assets/interfaces/interfaces.ts`
- **Interfaces**: `AnalyticsEvent`, `UserAnalytics`, `SearchImpressionMetadata`

## Removal Steps

### Step 1: Stop Cloud Function Execution

**Option A: Disable the function**
```bash
# In functions/src/index.ts, comment out the export
// export { aggregateAnalytics } from './analyticsAggregation';
```

**Option B: Delete and redeploy**
```bash
# Delete the function file
rm functions/src/analyticsAggregation.ts

# Update functions/src/index.ts to remove the export
# Then redeploy
cd functions
npm run deploy
```

### Step 2: Delete from Firebase Console (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Functions**
3. Find `aggregateAnalytics`
4. Click **Delete**

### Step 3: Clean Up Firestore Collections (Optional)

**⚠️ WARNING**: These collections may contain historical data. Export before deleting!

**Export data first:**
```bash
# Export collections before deleting
gcloud firestore export gs://your-bucket/analytics-backup \\
  --collection-ids=analytics_events,user_analytics,video_analytics,tag_analytics
```

**Delete collections:**
- You can leave them as-is (no cost if not read/written)
- Or delete via Firebase Console → Firestore Database → Select collection → Delete

**Recommended**: Keep for 30-90 days in case you need historical data, then delete.

### Step 4: Remove Deprecated Code References

#### A. Remove Interface Imports
Search for and remove imports of deprecated interfaces:

```typescript
// REMOVE these imports
import { AnalyticsEvent, UserAnalytics, SearchImpressionMetadata } from '...';
```

Files that may have these imports (already updated in this implementation):
- ✅ `src/app/services/analytics.service.ts` - Already removed
- ✅ `src/app/discover/settings/settings.component.ts` - Already removed
- ✅ `src/app/discover/settings/sections/analytics-section.component.ts` - Already removed

#### B. Remove Search Impression Tracking Calls
Search for and remove any remaining calls to `trackSearchImpression()`:

```bash
# Search for remaining references
grep -r "trackSearchImpression" src/
```

Files that called it (already updated):
- ✅ `src/app/discover/search.component.ts` - Already removed

### Step 5: Update Documentation

**Update these files:**
1. ✅ `CLOUD_FUNCTIONS_GUIDE.md` - Remove analytics aggregation section (if exists)
2. ✅ `README.md` - Update analytics documentation
3. ✅ Architecture diagrams - Update to reflect real-time approach

### Step 6: Clean Up Cloud Functions Dependencies

If `analyticsAggregation.ts` was the only function:

```bash
cd functions
# Check package.json for unused dependencies
npm prune
```

If there are other Cloud Functions, leave the functions directory as-is.

## Migration of Historical Data (Optional)

If you want to migrate existing aggregated analytics to profile documents:

```typescript
// One-time migration script
import { getFirestore } from 'firebase-admin/firestore';

async function migrateAnalytics() {
  const db = getFirestore();

  const userAnalyticsSnapshot = await db.collection('user_analytics').get();

  for (const doc of userAnalyticsSnapshot.docs) {
    const analytics = doc.data();
    const actorId = analytics.actorId;

    const profileRef = db.collection('profiles').doc(actorId);

    await profileRef.update({
      profileViewCount: analytics.profileViews?.total || 0,
      wishListCount: analytics.wishlistCount || 0,
      // Note: actorAnalytics cannot be migrated as it requires producer-level data
    });

    console.log(`Migrated analytics for actor ${actorId}`);
  }
}

// Run once
migrateAnalytics().then(() => console.log('Migration complete'));
```

**⚠️ Warning**: This will overwrite current analytics counts with historical data.

## Verification

### 1. Verify Cloud Function is Removed
```bash
firebase functions:list
# Should not show aggregateAnalytics
```

### 2. Verify New Analytics are Working
Test the following workflows:
- ✅ Producer views actor profile → `profileViewCount` increments
- ✅ Producer adds to wishlist → `wishListCount` increments
- ✅ Producer removes from wishlist → `wishListCount` decrements
- ✅ Producer plays video → `videoAnalytics` array updates
- ✅ Actor views their analytics → Data displays correctly
- ✅ Ghost mode enabled → No analytics tracked

### 3. Monitor Firestore Usage
Check Firebase Console → Usage tab:
- Document reads should decrease (no aggregation queries)
- Document writes should stay similar or decrease slightly
- No Cloud Function invocations for `aggregateAnalytics`

## Cost Impact

**Before (with Cloud Functions):**
- Cloud Function execution: ~$0.40/million invocations
- Scheduled daily: 30 invocations/month (minimal cost)
- Document writes: 2 writes per event (analytics_events + user_analytics)

**After (real-time):**
- Cloud Function execution: $0 (eliminated)
- Document writes: 1 write per event (profiles only)
- **Savings**: ~50% write reduction + eliminated function costs

## Rollback Plan

If you need to rollback to Cloud Functions:

1. Restore `functions/src/analyticsAggregation.ts` from git history
2. Restore exports in `functions/src/index.ts`
3. Redeploy functions: `cd functions && npm run deploy`
4. Restore previous `analytics.service.ts` from git history
5. Update components to use old interfaces

**Git commands:**
```bash
# View file history
git log -- functions/src/analyticsAggregation.ts

# Restore from specific commit
git checkout <commit-hash> -- functions/src/analyticsAggregation.ts
```

## Next Steps

After removing Cloud Functions:

1. ✅ Implement Firestore security rules (see `FIRESTORE_SECURITY_RULES.md`)
2. ✅ Test analytics in development environment
3. ✅ Monitor analytics in production for 1-2 weeks
4. ✅ Delete deprecated collections after 30-90 days
5. ✅ Update team documentation and training materials

## Support

If you encounter issues:
- Check browser console for Firestore permission errors
- Review Firestore rules in Firebase Console
- Check that producer role is correctly set in `users` collection
- Verify ghost mode is not enabled when testing

## Summary

**What Changed:**
- ❌ Removed: Cloud Functions, scheduled aggregation, separate analytics collections
- ✅ Added: Real-time analytics updates to profile documents
- ✅ Added: Visibility score calculation in analytics service
- ✅ Kept: Ghost mode privacy feature

**Benefits:**
- 💰 Lower costs (no Cloud Functions, fewer writes)
- ⚡ Real-time updates (no 24-hour delay)
- 🏗️ Simpler architecture (fewer moving parts)
- 📊 Direct data access (no aggregation layer)

**Trade-offs:**
- ❌ No time-windowed metrics (last 7/30 days)
- ❌ No detailed event history
- ❌ No tag analytics
- ❌ Array size limits (100 recent viewers)
