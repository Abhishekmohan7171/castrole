# Visibility Score Calculation Implementation Guide

This guide provides a complete overview of the visibility score calculation logic implemented in the Angular web app, designed to help Flutter developers implement an equivalent scoring system for mobile analytics.

## Overview

The **Visibility Score** is a 0-10 scale metric that quantifies an actor's discoverability and engagement performance across multiple analytics dimensions. It helps actors understand their relative standing compared to other users in the platform.

## Core Concept

The score represents how well an actor is performing relative to the broader user base, using percentile ranking for most metrics to ensure fair comparison regardless of platform growth or usage patterns.

## Input Metrics

The visibility score calculation requires these five metrics:

1. **`profileViews`** - Total number of times producers viewed the actor's profile
2. **`wishlistCount`** - Number of times producers added the actor to their wishlist
3. **`searchAppearances`** - Number of times the actor appeared in producer search results
4. **`totalVideoViews`** - Total views across all of the actor's videos
5. **`totalWatchMs`** - Total watch time in milliseconds across all video views (used for quality assessment)

## Primary Algorithm: Percentile-Based Scoring

When possible, the system calculates percentiles by comparing the user's metrics against the entire user base using Firestore count queries.

### Step 1: Percentile Estimation

For each metric except wishlist count, estimate the user's percentile rank:

```typescript
private async estimatePercentile(field: string, value: number): Promise<number> {
  // Query users with values LESS than this user's value
  const belowQuery = query(analyticsRef, where(field, '<', value));
  const belowCount = await getCountFromServer(belowQuery);

  // Get total user count
  const totalQuery = query(analyticsRef);
  const totalCount = await getCountFromServer(totalQuery);

  const total = totalCount.data().count;
  if (total === 0) return 0;

  // Percentile = (users below me) / (total users)
  const percentile = belowCount.data().count / total;

  return percentile;
}
```

**Note:** Percentile calculation requires Firestore queries with count aggregation, which may fail due to permissions or performance limits in mobile environments.

### Step 2: Wishlist Percentile (Benchmark-Based)

Since wishlist data is in a separate collection, use a simple benchmark approach:

```typescript
// Assume "good" performance is 10 wishlist adds
const wishlistPercentile = Math.min(wishlistCount / 10.0, 1.0);
```

### Step 3: Weighted Composite Score

```typescript
const [profilePercentile, searchPercentile, videoPercentile] = await Promise.all([estimatePercentile("profileViews", profileViews), estimatePercentile("searchAppearances", searchAppearances), estimatePercentile("totalVideoViews", totalVideoViews)]);

const wishlistPercentile = Math.min(wishlistCount / 10.0, 1.0);

// Weighted combination (0-1 scale)
const composite =
  profilePercentile * 0.25 + // 25% weight
  wishlistPercentile * 0.35 + // 35% weight (strongest signal)
  searchPercentile * 0.15 + // 15% weight
  videoPercentile * 0.25; // 25% weight

// Convert to 0-10 scale and round
const score = Math.round(composite * 10);
```

**Weights Rationale:**

- **Profile Views (25%)**: Baseline engagement metric
- **Wishlist Count (35%)**: Strongest signal of genuine interest
- **Search Appearances (15%)**: Exposure/awareness metric
- **Video Views (25%)**: Content engagement indicator

## Fallback Algorithm: Benchmark-Based Scoring

If percentile queries fail (common in mobile due to network/permission constraints), fall back to absolute benchmark thresholds:

```typescript
private fallbackBenchmarkScore(
  profileViews: number,
  wishlistCount: number,
  searchAppearances: number,
  totalVideoViews: number
): number {
  // Define "excellent" performance benchmarks
  const benchmarks = {
    profileViews: 50,      // 50 profile views = excellent
    wishlistCount: 10,     // 10 wishlist adds = excellent
    searchAppearances: 100, // 100 search appearances = excellent
    videoViews: 100,       // 100 video views = excellent
  };

  // Each benchmark contributes up to 2.5 points (total 10.0 max)
  const scores = {
    profile: Math.min((profileViews / benchmarks.profileViews) * 2.5, 2.5),
    wishlist: Math.min((wishlistCount / benchmarks.wishlistCount) * 2.5, 2.5),
    search: Math.min((searchAppearances / benchmarks.searchAppearances) * 2.5, 2.5),
    video: Math.min((totalVideoViews / benchmarks.videoViews) * 2.5, 2.5),
  };

  return Math.round(scores.profile + scores.wishlist + scores.search + scores.video);
}
```

## Error Handling

```typescript
try {
  // Try percentile-based calculation
  return await calculatePercentileBasedScore(metrics);
} catch (error) {
  // Fall back to benchmark-based scoring
  return calculateBenchmarkBasedScore(metrics);
}
```

## Flutter Implementation Considerations

### 1. Data Storage Strategy

- **Web**: Firestore collections (`user_analytics`, `wishlists`)
- **Mobile**: Consider SQLite for local caching, sync with backend API

### 2. Percentile Calculation Alternative

Since Firestore count queries may not be available in mobile SDKs, consider:

- Pre-computed percentiles from backend API
- Local approximation using cached user data
- Statistical estimation from sample data

### 3. Real-time Updates

- **Web**: Real-time Firestore listeners
- **Mobile**: Background sync with periodic API calls

### 4. Benchmark Tuning

Adjust benchmark values based on your platform's actual usage patterns:

```dart
// Example Flutter implementation
class VisibilityScoreCalculator {
  static const Map<String, double> benchmarks = {
    'profileViews': 25.0,      // Adjust based on your data
    'wishlistCount': 5.0,      // Adjust based on your data
    'searchAppearances': 50.0, // Adjust based on your data
    'videoViews': 50.0,        // Adjust based on your data
  };

  static int calculateBenchmarkScore(Map<String, int> metrics) {
    const double maxPerMetric = 2.5; // 2.5 points each, total 10.0

    double score = 0.0;
    metrics.forEach((key, value) {
      if (benchmarks.containsKey(key)) {
        double benchmarkScore = (value / benchmarks[key]!) * maxPerMetric;
        score += min(benchmarkScore, maxPerMetric);
      }
    });

    return score.round();
  }
}
```

### 5. UI Display

- Display as circular progress indicator (0-10 scale)
- Color code: Red (0-3), Yellow (4-6), Green (7-10)
- Show tooltip with breakdown of contributing metrics

### 6. Performance Optimization

- Cache scores locally to avoid recalculation
- Update scores periodically (daily) rather than real-time
- Consider background calculation for heavy percentile computations

## Key Takeaways for Mobile Implementation

1. **Prioritize benchmark-based scoring** initially (easier to implement without complex backend queries)

2. **Weight wishlist count heavily** (35%) as it represents genuine interest

3. **Include video engagement** as a significant factor (25%) for content quality

4. **Normalize to 0-10 scale** for intuitive user understanding

5. **Handle errors gracefully** with fallback calculations

6. **Update benchmarks periodically** based on platform growth and usage patterns

The scoring system should evolve with your platform - monitor which metrics correlate most strongly with actual casting opportunities and adjust weights accordingly.
