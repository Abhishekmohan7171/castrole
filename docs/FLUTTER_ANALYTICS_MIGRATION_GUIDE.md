# Flutter Analytics Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Firestore Structure](#firestore-structure)
5. [Analytics Service Implementation](#analytics-service-implementation)
6. [Metrics & Calculations](#metrics--calculations)
7. [UI Integration](#ui-integration)
8. [Firestore Security Rules](#firestore-security-rules)
9. [Dependencies](#dependencies)
10. [Testing Checklist](#testing-checklist)

---

## Overview

The Castrole analytics system provides comprehensive tracking for actors on the platform. It tracks profile engagement, search visibility, video performance, and wishlist metrics. The system is designed to be:

- **Real-time**: Analytics update immediately as events occur
- **Scalable**: Uses atomic operations and batch updates
- **Privacy-aware**: Respects ghost mode settings
- **Premium-gated**: Advanced analytics only visible to subscribed users
- **Cost-optimized**: Uses buffering and batching to minimize Firestore writes

### Key Features
- Profile view tracking with duration (1s - 10min capped)
- Search impression tracking (first 20 displayed actors)
- Video view tracking (3s threshold) with watch time
- Wishlist management with notifications
- Percentile-based visibility scoring
- Daily analytics rollups for time-series data

---

## Architecture

### High-Level Flow

```
User Action → Analytics Service → Firestore Updates → Real-time UI Updates
                                ↓
                          Notifications (for premium users)
```

### Key Design Decisions

1. **Separate Collections**: `user_analytics` isolated from `profiles` for scalability
2. **Composite Wishlist IDs**: Format `{producerId}_{actorId}` prevents duplicates
3. **Daily Subcollections**: Enables time-series analysis without complex aggregations
4. **Buffered Video Tracking**: Reduces costs and network overhead (20s flush interval)
5. **Atomic Batch Updates**: Both lifetime and daily docs updated atomically
6. **Ghost Mode at Service Layer**: Checked before tracking, simpler than Firestore rules

---

## Data Models

### 1. UserAnalyticsDoc
**Purpose**: Lifetime analytics aggregates for an actor
**Firestore Path**: `user_analytics/{actorId}`

```dart
class UserAnalyticsDoc {
  final String actorId;
  final int profileViews;           // Total profile views by producers
  final int totalProfileViewMs;     // Total time spent on profile (milliseconds)
  final int searchAppearances;      // Times appeared in search results
  final int totalVideoViews;        // Total video views across all videos
  final int totalWatchMs;           // Total watch time across all videos (milliseconds)
  final Timestamp updatedAt;        // Last update timestamp

  UserAnalyticsDoc({
    required this.actorId,
    required this.profileViews,
    required this.totalProfileViewMs,
    required this.searchAppearances,
    required this.totalVideoViews,
    required this.totalWatchMs,
    required this.updatedAt,
  });

  factory UserAnalyticsDoc.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserAnalyticsDoc(
      actorId: data['actorId'] ?? '',
      profileViews: data['profileViews'] ?? 0,
      totalProfileViewMs: data['totalProfileViewMs'] ?? 0,
      searchAppearances: data['searchAppearances'] ?? 0,
      totalVideoViews: data['totalVideoViews'] ?? 0,
      totalWatchMs: data['totalWatchMs'] ?? 0,
      updatedAt: data['updatedAt'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'actorId': actorId,
      'profileViews': profileViews,
      'totalProfileViewMs': totalProfileViewMs,
      'searchAppearances': searchAppearances,
      'totalVideoViews': totalVideoViews,
      'totalWatchMs': totalWatchMs,
      'updatedAt': updatedAt,
    };
  }
}
```

### 2. DailyAnalyticsDoc
**Purpose**: Daily rollup for time-series data
**Firestore Path**: `user_analytics/{actorId}/daily/{yyyyMMdd}`

```dart
class DailyAnalyticsDoc {
  final String date;                // Format: yyyyMMdd (e.g., "20260114")
  final int profileViews;
  final int totalProfileViewMs;
  final int searchAppearances;
  final int totalVideoViews;
  final int totalWatchMs;
  final Timestamp updatedAt;

  DailyAnalyticsDoc({
    required this.date,
    required this.profileViews,
    required this.totalProfileViewMs,
    required this.searchAppearances,
    required this.totalVideoViews,
    required this.totalWatchMs,
    required this.updatedAt,
  });

  factory DailyAnalyticsDoc.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return DailyAnalyticsDoc(
      date: data['date'] ?? '',
      profileViews: data['profileViews'] ?? 0,
      totalProfileViewMs: data['totalProfileViewMs'] ?? 0,
      searchAppearances: data['searchAppearances'] ?? 0,
      totalVideoViews: data['totalVideoViews'] ?? 0,
      totalWatchMs: data['totalWatchMs'] ?? 0,
      updatedAt: data['updatedAt'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'date': date,
      'profileViews': profileViews,
      'totalProfileViewMs': totalProfileViewMs,
      'searchAppearances': searchAppearances,
      'totalVideoViews': totalVideoViews,
      'totalWatchMs': totalWatchMs,
      'updatedAt': updatedAt,
    };
  }
}
```

### 3. WishlistDoc
**Purpose**: Links producer to actor in wishlist
**Firestore Path**: `wishlists/{producerId}_{actorId}`

```dart
class WishlistDoc {
  final String producerId;
  final String actorId;
  final Timestamp addedAt;

  WishlistDoc({
    required this.producerId,
    required this.actorId,
    required this.addedAt,
  });

  // Document ID must follow composite key pattern
  String get documentId => '${producerId}_$actorId';

  factory WishlistDoc.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return WishlistDoc(
      producerId: data['producerId'] ?? '',
      actorId: data['actorId'] ?? '',
      addedAt: data['addedAt'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'producerId': producerId,
      'actorId': actorId,
      'addedAt': addedAt,
    };
  }
}
```

### 4. VideoMetadataWithAnalytics
**Purpose**: Video metadata extended with analytics fields
**Firestore Path**: `uploads/{userId}/userUploads/{videoId}` (in `metadata` field)

```dart
class VideoMetadataWithAnalytics {
  // Existing video metadata
  final List<String> tags;
  final String? mediaType;
  final String description;
  final String? thumbnailUrl;
  final int? duration;
  final String? resolution;
  final int? fps;
  final int? bitrate;
  final bool? needsProcessing;
  final bool? processed;
  final String? processedUrl;
  final int? originalSize;
  final int? compressedSize;
  final bool? compressed;
  final int? processedSize;

  // Analytics fields (NEW)
  final int? viewCount;         // Total number of views (3s+ threshold)
  final int? totalWatchMs;      // Total watch time in milliseconds

  VideoMetadataWithAnalytics({
    required this.tags,
    this.mediaType,
    required this.description,
    this.thumbnailUrl,
    this.duration,
    this.resolution,
    this.fps,
    this.bitrate,
    this.needsProcessing,
    this.processed,
    this.processedUrl,
    this.originalSize,
    this.compressedSize,
    this.compressed,
    this.processedSize,
    this.viewCount,
    this.totalWatchMs,
  });

  factory VideoMetadataWithAnalytics.fromFirestore(Map<String, dynamic> data) {
    return VideoMetadataWithAnalytics(
      tags: List<String>.from(data['tags'] ?? []),
      mediaType: data['mediaType'],
      description: data['description'] ?? '',
      thumbnailUrl: data['thumbnailUrl'],
      duration: data['duration'],
      resolution: data['resolution'],
      fps: data['fps'],
      bitrate: data['bitrate'],
      needsProcessing: data['needsProcessing'],
      processed: data['processed'],
      processedUrl: data['processedUrl'],
      originalSize: data['originalSize'],
      compressedSize: data['compressedSize'],
      compressed: data['compressed'],
      processedSize: data['processedSize'],
      viewCount: data['viewCount'],
      totalWatchMs: data['totalWatchMs'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'tags': tags,
      if (mediaType != null) 'mediaType': mediaType,
      'description': description,
      if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
      if (duration != null) 'duration': duration,
      if (resolution != null) 'resolution': resolution,
      if (fps != null) 'fps': fps,
      if (bitrate != null) 'bitrate': bitrate,
      if (needsProcessing != null) 'needsProcessing': needsProcessing,
      if (processed != null) 'processed': processed,
      if (processedUrl != null) 'processedUrl': processedUrl,
      if (originalSize != null) 'originalSize': originalSize,
      if (compressedSize != null) 'compressedSize': compressedSize,
      if (compressed != null) 'compressed': compressed,
      if (processedSize != null) 'processedSize': processedSize,
      if (viewCount != null) 'viewCount': viewCount,
      if (totalWatchMs != null) 'totalWatchMs': totalWatchMs,
    };
  }
}
```

### 5. VideoTrackingSession
**Purpose**: Internal tracking state (client-side only, not stored in Firestore)
**Used for**: Buffering video analytics before flushing to Firestore

```dart
class VideoTrackingSession {
  final String actorId;
  final String videoId;
  final String videoPath;              // uploads/{userId}/userUploads/{videoId}
  double lastPosition;                 // Last known position in seconds
  int accumulatedWatchMs;              // Buffered watch time
  int lastUpdateTime;                  // Timestamp of last update (milliseconds since epoch)
  bool viewCountIncremented;           // Whether we've counted the view (after 3s)

  VideoTrackingSession({
    required this.actorId,
    required this.videoId,
    required this.videoPath,
    this.lastPosition = 0,
    this.accumulatedWatchMs = 0,
    required this.lastUpdateTime,
    this.viewCountIncremented = false,
  });
}
```

### 6. AnalyticsIncrement
**Purpose**: Helper for batched analytics updates

```dart
class AnalyticsIncrement {
  final int? profileViews;
  final int? totalProfileViewMs;
  final int? searchAppearances;
  final int? totalVideoViews;
  final int? totalWatchMs;

  AnalyticsIncrement({
    this.profileViews,
    this.totalProfileViewMs,
    this.searchAppearances,
    this.totalVideoViews,
    this.totalWatchMs,
  });

  Map<String, dynamic> toIncrementMap() {
    final map = <String, dynamic>{'updatedAt': FieldValue.serverTimestamp()};

    if (profileViews != null) {
      map['profileViews'] = FieldValue.increment(profileViews!);
    }
    if (totalProfileViewMs != null) {
      map['totalProfileViewMs'] = FieldValue.increment(totalProfileViewMs!);
    }
    if (searchAppearances != null) {
      map['searchAppearances'] = FieldValue.increment(searchAppearances!);
    }
    if (totalVideoViews != null) {
      map['totalVideoViews'] = FieldValue.increment(totalVideoViews!);
    }
    if (totalWatchMs != null) {
      map['totalWatchMs'] = FieldValue.increment(totalWatchMs!);
    }

    return map;
  }

  Map<String, dynamic> toAbsoluteMap() {
    return {
      'profileViews': profileViews ?? 0,
      'totalProfileViewMs': totalProfileViewMs ?? 0,
      'searchAppearances': searchAppearances ?? 0,
      'totalVideoViews': totalVideoViews ?? 0,
      'totalWatchMs': totalWatchMs ?? 0,
      'updatedAt': FieldValue.serverTimestamp(),
    };
  }
}
```

---

## Firestore Structure

```
firestore (database)
│
├── user_analytics/                     # Analytics aggregates
│   ├── {actorId}/                     # Lifetime analytics document
│   │   ├── actorId: string
│   │   ├── profileViews: number
│   │   ├── totalProfileViewMs: number
│   │   ├── searchAppearances: number
│   │   ├── totalVideoViews: number
│   │   ├── totalWatchMs: number
│   │   ├── updatedAt: Timestamp
│   │   │
│   │   └── daily/                     # Daily rollup subcollection
│   │       ├── 20260114/              # Daily document (yyyyMMdd format)
│   │       │   ├── date: "20260114"
│   │       │   ├── profileViews: number
│   │       │   ├── totalProfileViewMs: number
│   │       │   ├── searchAppearances: number
│   │       │   ├── totalVideoViews: number
│   │       │   ├── totalWatchMs: number
│   │       │   └── updatedAt: Timestamp
│   │       ├── 20260113/
│   │       └── ...
│   │
│   └── {anotherActorId}/
│       └── ...
│
├── wishlists/                          # Wishlist tracking
│   ├── {producerId}_{actorId}/        # Composite key document
│   │   ├── producerId: string
│   │   ├── actorId: string
│   │   └── addedAt: Timestamp
│   └── ...
│
├── uploads/                            # User content
│   └── {userId}/
│       └── userUploads/
│           └── {videoId}/              # Video document
│               ├── fileType: "video"
│               ├── uploadedAt: Timestamp
│               ├── metadata:
│               │   ├── tags: string[]
│               │   ├── description: string
│               │   ├── duration: number
│               │   ├── viewCount: number      # Analytics field
│               │   └── totalWatchMs: number   # Analytics field
│               └── ...
│
└── users/                              # User profiles
    └── {userId}/
        ├── ghost: boolean              # Ghost mode flag
        └── ...
```

---

## Analytics Service Implementation

### Core Service Class

```dart
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

class AnalyticsService {
  final FirebaseFirestore _firestore;
  final NotificationService _notificationService;

  // Profile view tracking
  int? _profileViewStartTime;
  String? _currentProfileActorId;
  String? _currentProducerId;
  String? _currentProducerName;
  String? _currentProducerPhotoUrl;

  // Video tracking sessions (keyed by videoPath)
  final Map<String, VideoTrackingSession> _videoSessions = {};
  Timer? _videoFlushTimer;

  // Constants
  static const int minProfileViewMs = 1000;        // 1 second minimum
  static const int maxProfileViewMs = 600000;      // 10 minutes maximum
  static const int videoViewThresholdMs = 3000;    // Count view after 3 seconds
  static const int videoFlushIntervalMs = 20000;   // Flush every 20 seconds
  static const int maxWatchDeltaMs = 30000;        // Max 30s delta between updates

  AnalyticsService({
    FirebaseFirestore? firestore,
    required NotificationService notificationService,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _notificationService = notificationService {
    _startVideoFlushTimer();
  }

  void dispose() {
    _flushAllVideoSessions();
    _videoFlushTimer?.cancel();
  }

  // ==================== HELPER METHODS ====================

  /// Get today's date ID in yyyyMMdd format (local timezone)
  String _getTodayId() {
    final now = DateTime.now();
    return '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
  }

  /// Check if actor has ghost mode enabled
  Future<bool> _checkGhostMode(String actorId) async {
    try {
      final userDoc = await _firestore.collection('users').doc(actorId).get();
      if (!userDoc.exists) return false;
      return userDoc.data()?['ghost'] == true;
    } catch (error) {
      debugPrint('Error checking ghost mode: $error');
      return false;
    }
  }

  /// Update both lifetime and daily analytics atomically using batch
  Future<void> _updateActorAnalytics(
    String actorId,
    AnalyticsIncrement increments,
  ) async {
    try {
      final batch = _firestore.batch();
      final todayId = _getTodayId();

      // Lifetime document reference
      final lifetimeRef = _firestore.collection('user_analytics').doc(actorId);

      // Daily document reference
      final dailyRef = lifetimeRef.collection('daily').doc(todayId);

      // Build increment data
      final incrementData = increments.toIncrementMap();
      final absoluteData = increments.toAbsoluteMap();

      // Check if documents exist
      final lifetimeSnap = await lifetimeRef.get();
      final dailySnap = await dailyRef.get();

      if (!lifetimeSnap.exists) {
        // Initialize lifetime document
        absoluteData['actorId'] = actorId;
        batch.set(lifetimeRef, absoluteData);
      } else {
        batch.update(lifetimeRef, incrementData);
      }

      if (!dailySnap.exists) {
        // Initialize daily document
        absoluteData['date'] = todayId;
        batch.set(dailyRef, absoluteData);
      } else {
        batch.update(dailyRef, incrementData);
      }

      await batch.commit();
      debugPrint('✓ Analytics updated: $actorId, $increments');
    } catch (error) {
      debugPrint('Error updating analytics: $error');
      // Non-fatal - don't throw
    }
  }

  // ==================== PROFILE VIEW TRACKING ====================

  /// Start tracking profile view duration
  /// Call when user lands on profile page
  Future<void> startProfileView(
    String actorId, {
    String? producerId,
    String? producerName,
    String? producerPhotoUrl,
  }) async {
    // Check ghost mode
    final isGhost = await _checkGhostMode(actorId);
    if (isGhost) {
      debugPrint('Ghost mode enabled - skipping profile view tracking');
      return;
    }

    _currentProfileActorId = actorId;
    _currentProducerId = producerId;
    _currentProducerName = producerName;
    _currentProducerPhotoUrl = producerPhotoUrl;
    _profileViewStartTime = DateTime.now().millisecondsSinceEpoch;

    debugPrint('Started profile view tracking: $actorId');
  }

  /// End tracking profile view duration and record analytics
  /// Call when user leaves profile page
  Future<void> endProfileView() async {
    if (_currentProfileActorId == null || _profileViewStartTime == null) {
      return;
    }

    final durationMs = DateTime.now().millisecondsSinceEpoch - _profileViewStartTime!;

    // Only count views >= 1 second, cap at 10 minutes
    if (durationMs < minProfileViewMs) {
      debugPrint('Profile view too short, not tracked');
      _resetProfileView();
      return;
    }

    final cappedDurationMs = durationMs > maxProfileViewMs
        ? maxProfileViewMs
        : durationMs;

    // Update analytics
    await _updateActorAnalytics(
      _currentProfileActorId!,
      AnalyticsIncrement(
        profileViews: 1,
        totalProfileViewMs: cappedDurationMs,
      ),
    );

    // Create profile view notification for actor
    if (_currentProducerId != null && _currentProducerName != null) {
      try {
        // Check if actor has premium subscription
        final actorDoc = await _firestore
            .collection('profiles')
            .doc(_currentProfileActorId)
            .get();
        final isPremium = actorDoc.exists
            ? actorDoc.data()?['actorProfile']?['isSubscribed'] == true
            : false;

        await _notificationService.createProfileViewNotification(
          actorId: _currentProfileActorId!,
          producerId: _currentProducerId!,
          producerName: _currentProducerName!,
          isPremium: isPremium,
          producerPhotoUrl: _currentProducerPhotoUrl,
        );
      } catch (error) {
        debugPrint('Failed to create profile view notification: $error');
      }
    }

    debugPrint('Profile view tracked: ${cappedDurationMs}ms');
    _resetProfileView();
  }

  void _resetProfileView() {
    _currentProfileActorId = null;
    _currentProducerId = null;
    _currentProducerName = null;
    _currentProducerPhotoUrl = null;
    _profileViewStartTime = null;
  }

  // ==================== SEARCH IMPRESSION TRACKING ====================

  /// Track search impressions for actors appearing in search results
  /// Call when search results are displayed (first 20 actors only)
  Future<void> trackSearchImpressions(List<String> actorIds) async {
    if (actorIds.isEmpty) return;

    // Limit to first 20 displayed
    final displayedActors = actorIds.take(20).toList();

    try {
      // Process in parallel (each actor gets its own update)
      // Firestore batch has limit of 500 operations
      // Each actor requires 2 operations (lifetime + daily), so 200 actors = 400 ops
      const chunkSize = 200;

      for (var i = 0; i < displayedActors.length; i += chunkSize) {
        final chunk = displayedActors.skip(i).take(chunkSize).toList();

        // Process chunk in parallel
        await Future.wait(
          chunk.map((actorId) => _updateActorAnalytics(
                actorId,
                AnalyticsIncrement(searchAppearances: 1),
              )),
        );
      }

      debugPrint('✓ Search impressions tracked for ${displayedActors.length} actors');
    } catch (error) {
      debugPrint('Error tracking search impressions: $error');
    }
  }

  // ==================== VIDEO VIEW TRACKING ====================

  void _startVideoFlushTimer() {
    _videoFlushTimer = Timer.periodic(
      const Duration(milliseconds: videoFlushIntervalMs),
      (_) => _flushAllVideoSessions(),
    );
  }

  /// Start tracking video view
  /// Call when video starts playing
  Future<void> startVideoTracking({
    required String actorId,
    required String videoId,
    required String userId,
  }) async {
    debugPrint('[AnalyticsService] startVideoTracking called: '
        'actorId=$actorId, videoId=$videoId, userId=$userId');

    // Check ghost mode
    final isGhost = await _checkGhostMode(actorId);
    if (isGhost) {
      debugPrint('[AnalyticsService] Ghost mode enabled - skipping video tracking');
      return;
    }

    final videoPath = 'uploads/$userId/userUploads/$videoId';
    debugPrint('[AnalyticsService] Video path constructed: $videoPath');

    if (_videoSessions.containsKey(videoPath)) {
      debugPrint('[AnalyticsService] Video session already active: $videoPath');
      return;
    }

    final session = VideoTrackingSession(
      actorId: actorId,
      videoId: videoId,
      videoPath: videoPath,
      lastUpdateTime: DateTime.now().millisecondsSinceEpoch,
    );

    _videoSessions[videoPath] = session;
    debugPrint('[AnalyticsService] ✓ Started video tracking session: $videoPath');
  }

  /// Update video tracking on timeupdate event
  /// Call periodically (every few seconds) from video player
  void updateVideoProgress({
    required String videoId,
    required String userId,
    required double currentTime,
  }) {
    final videoPath = 'uploads/$userId/userUploads/$videoId';
    final session = _videoSessions[videoPath];

    if (session == null) {
      debugPrint('[AnalyticsService] No active video session for: $videoPath');
      return;
    }

    final now = DateTime.now().millisecondsSinceEpoch;

    // Calculate watch time delta (clamp to max 30s to ignore seeks)
    final positionDelta = (currentTime - session.lastPosition).abs();
    final watchDelta = (positionDelta * 1000).toInt();
    final clampedWatchDelta = watchDelta > maxWatchDeltaMs
        ? maxWatchDeltaMs
        : watchDelta;

    session.accumulatedWatchMs += clampedWatchDelta;
    session.lastPosition = currentTime;
    session.lastUpdateTime = now;

    // Check if we should count this as a view (after 3 seconds)
    if (!session.viewCountIncremented &&
        session.accumulatedWatchMs >= videoViewThresholdMs) {
      session.viewCountIncremented = true;
      debugPrint('[AnalyticsService] ✓ View threshold reached for: $videoPath '
          '(accumulatedWatchMs: ${session.accumulatedWatchMs})');
    }
  }

  /// End video tracking
  /// Call when video ends, pauses, or user navigates away
  Future<void> endVideoTracking({
    required String videoId,
    required String userId,
  }) async {
    final videoPath = 'uploads/$userId/userUploads/$videoId';
    debugPrint('[AnalyticsService] endVideoTracking called for: $videoPath');
    await _flushVideoSession(videoPath);
  }

  /// Flush a single video session to Firestore
  Future<void> _flushVideoSession(String videoPath) async {
    debugPrint('[AnalyticsService] flushVideoSession called for: $videoPath');
    final session = _videoSessions[videoPath];
    if (session == null) {
      debugPrint('[AnalyticsService] No session found for: $videoPath');
      return;
    }

    debugPrint('[AnalyticsService] Session data: '
        'accumulatedWatchMs=${session.accumulatedWatchMs}, '
        'viewCountIncremented=${session.viewCountIncremented}');

    // Only flush if there's accumulated data
    if (session.accumulatedWatchMs == 0 && !session.viewCountIncremented) {
      debugPrint('[AnalyticsService] No data to flush, deleting session');
      _videoSessions.remove(videoPath);
      return;
    }

    try {
      final batch = _firestore.batch();

      // 1. Update video document in uploads collection
      final videoRef = _firestore.doc(session.videoPath);
      debugPrint('[AnalyticsService] Video doc path: ${session.videoPath}');

      final videoUpdates = <String, dynamic>{};
      if (session.viewCountIncremented) {
        videoUpdates['metadata.viewCount'] = FieldValue.increment(1);
      }
      if (session.accumulatedWatchMs > 0) {
        videoUpdates['metadata.totalWatchMs'] =
            FieldValue.increment(session.accumulatedWatchMs);
      }

      debugPrint('[AnalyticsService] Video updates to apply: $videoUpdates');

      if (videoUpdates.isNotEmpty) {
        batch.update(videoRef, videoUpdates);
      }

      // Commit batch
      debugPrint('[AnalyticsService] Committing batch to Firestore...');
      await batch.commit();
      debugPrint('[AnalyticsService] ✓ Batch committed successfully');

      // 2. Update actor analytics (separate operation after batch)
      final increments = AnalyticsIncrement(
        totalVideoViews: session.viewCountIncremented ? 1 : null,
        totalWatchMs: session.accumulatedWatchMs > 0
            ? session.accumulatedWatchMs
            : null,
      );

      if (increments.totalVideoViews != null || increments.totalWatchMs != null) {
        debugPrint('[AnalyticsService] Updating actor analytics: $increments');
        await _updateActorAnalytics(session.actorId, increments);
      }

      debugPrint('[AnalyticsService] ✓ Video session flushed: ${session.videoPath} '
          '(viewCounted: ${session.viewCountIncremented}, '
          'watchMs: ${session.accumulatedWatchMs})');
    } catch (error) {
      debugPrint('[AnalyticsService] ❌ Error flushing video session: $error');
    } finally {
      _videoSessions.remove(videoPath);
    }
  }

  /// Flush all active video sessions
  Future<void> _flushAllVideoSessions() async {
    final sessions = _videoSessions.keys.toList();

    for (final videoPath in sessions) {
      await _flushVideoSession(videoPath);
    }
  }

  // ==================== WISHLIST TRACKING ====================

  /// Add actor to producer's wishlist
  Future<void> addToWishlist({
    required String actorId,
    required String producerId,
  }) async {
    try {
      final wishlistId = '${producerId}_$actorId';
      final wishlistRef = _firestore.collection('wishlists').doc(wishlistId);

      final wishlistDoc = WishlistDoc(
        producerId: producerId,
        actorId: actorId,
        addedAt: Timestamp.now(),
      );

      await wishlistRef.set(wishlistDoc.toFirestore());
      debugPrint('✓ Added to wishlist: $wishlistId');

      // Create wishlist notification for actor
      try {
        // Check if actor has premium subscription
        final actorProfileDoc = await _firestore
            .collection('profiles')
            .doc(actorId)
            .get();
        final isPremium = actorProfileDoc.exists
            ? actorProfileDoc.data()?['actorProfile']?['isSubscribed'] == true
            : false;

        // Get producer info for notification
        final producerDoc = await _firestore
            .collection('users')
            .doc(producerId)
            .get();
        final producerData = producerDoc.data();
        final producerName = producerData?['name'] ?? 'A producer';

        // Get producer photo from profile
        final producerProfileDoc = await _firestore
            .collection('profiles')
            .doc(producerId)
            .get();
        final producerPhotoUrl = producerProfileDoc.exists
            ? producerProfileDoc.data()?['producerProfile']?['producerProfileImageUrl']
            : null;

        await _notificationService.createWishlistAddNotification(
          actorId: actorId,
          producerId: producerId,
          producerName: producerName,
          producerPhotoUrl: producerPhotoUrl,
          isPremium: isPremium,
        );
      } catch (error) {
        debugPrint('Failed to create wishlist notification: $error');
        // Non-fatal - don't throw
      }
    } catch (error) {
      debugPrint('Error adding to wishlist: $error');
      rethrow;
    }
  }

  /// Remove actor from producer's wishlist
  Future<void> removeFromWishlist({
    required String actorId,
    required String producerId,
  }) async {
    try {
      final wishlistId = '${producerId}_$actorId';
      final wishlistRef = _firestore.collection('wishlists').doc(wishlistId);

      await wishlistRef.delete();
      debugPrint('✓ Removed from wishlist: $wishlistId');
    } catch (error) {
      debugPrint('Error removing from wishlist: $error');
      rethrow;
    }
  }

  /// Get wishlist count for an actor
  Future<int> getWishlistCount(String actorId) async {
    try {
      final query = _firestore
          .collection('wishlists')
          .where('actorId', isEqualTo: actorId);

      final snapshot = await query.count().get();
      return snapshot.count;
    } catch (error) {
      debugPrint('Error getting wishlist count: $error');
      return 0;
    }
  }

  /// Check if producer has wishlisted an actor
  Future<bool> isInWishlist({
    required String actorId,
    required String producerId,
  }) async {
    try {
      final wishlistId = '${producerId}_$actorId';
      final wishlistRef = _firestore.collection('wishlists').doc(wishlistId);
      final snapshot = await wishlistRef.get();
      return snapshot.exists;
    } catch (error) {
      debugPrint('Error checking wishlist: $error');
      return false;
    }
  }

  /// Get all actors in producer's wishlist
  Future<List<String>> getProducerWishlist(String producerId) async {
    try {
      final query = _firestore
          .collection('wishlists')
          .where('producerId', isEqualTo: producerId);

      final snapshot = await query.get();
      return snapshot.docs
          .map((doc) => doc.data()['actorId'] as String)
          .toList();
    } catch (error) {
      debugPrint('Error getting producer wishlist: $error');
      return [];
    }
  }

  // ==================== ANALYTICS RETRIEVAL ====================

  /// Get lifetime analytics for an actor
  Future<UserAnalyticsDoc?> getLifetimeAnalytics(String actorId) async {
    try {
      final docRef = _firestore.collection('user_analytics').doc(actorId);
      final snapshot = await docRef.get();

      if (!snapshot.exists) {
        return null;
      }

      return UserAnalyticsDoc.fromFirestore(snapshot);
    } catch (error) {
      debugPrint('Error fetching lifetime analytics: $error');
      return null;
    }
  }

  /// Get daily analytics for a specific date range
  Future<List<DailyAnalyticsDoc>> getDailyAnalytics({
    required String actorId,
    required String startDate,
    required String endDate,
  }) async {
    try {
      final dailyCollectionRef = _firestore
          .collection('user_analytics')
          .doc(actorId)
          .collection('daily');

      final results = <DailyAnalyticsDoc>[];

      // Generate date range
      final dates = _generateDateRange(startDate, endDate);

      for (final date in dates) {
        final docRef = dailyCollectionRef.doc(date);
        final snapshot = await docRef.get();

        if (snapshot.exists) {
          results.add(DailyAnalyticsDoc.fromFirestore(snapshot));
        }
      }

      return results;
    } catch (error) {
      debugPrint('Error fetching daily analytics: $error');
      return [];
    }
  }

  /// Generate array of date strings between start and end (inclusive)
  List<String> _generateDateRange(String startDate, String endDate) {
    final dates = <String>[];

    final start = DateTime(
      int.parse(startDate.substring(0, 4)),
      int.parse(startDate.substring(4, 6)),
      int.parse(startDate.substring(6, 8)),
    );

    final end = DateTime(
      int.parse(endDate.substring(0, 4)),
      int.parse(endDate.substring(4, 6)),
      int.parse(endDate.substring(6, 8)),
    );

    var current = start;

    while (current.isBefore(end) || current.isAtSameMomentAs(end)) {
      final dateStr = '${current.year}'
          '${current.month.toString().padLeft(2, '0')}'
          '${current.day.toString().padLeft(2, '0')}';
      dates.add(dateStr);

      current = current.add(const Duration(days: 1));
    }

    return dates;
  }
}
```

---

## Metrics & Calculations

### 1. Profile Views

**What it tracks**: Number of times a producer views an actor's profile

**Calculation**:
- Starts counting when producer navigates to actor profile
- Stops counting when:
  - Producer navigates away
  - Component is destroyed (app closed, etc.)
- **Minimum Duration**: 1 second (views less than 1s are not counted)
- **Maximum Duration**: 10 minutes (capped to prevent inflated metrics)

**Formula**:
```dart
// On profile view start
_profileViewStartTime = DateTime.now().millisecondsSinceEpoch;

// On profile view end
final durationMs = DateTime.now().millisecondsSinceEpoch - _profileViewStartTime!;

// Apply constraints
if (durationMs < 1000) {
  // Discard - too short
  return;
}

final cappedDurationMs = durationMs > 600000 ? 600000 : durationMs;

// Update analytics
_updateActorAnalytics(
  actorId,
  AnalyticsIncrement(
    profileViews: 1,                      // Increment count by 1
    totalProfileViewMs: cappedDurationMs, // Add duration
  ),
);
```

**Firestore Updates**:
- `user_analytics/{actorId}.profileViews` → +1
- `user_analytics/{actorId}.totalProfileViewMs` → +cappedDurationMs
- `user_analytics/{actorId}/daily/{yyyyMMdd}.profileViews` → +1
- `user_analytics/{actorId}/daily/{yyyyMMdd}.totalProfileViewMs` → +cappedDurationMs

**Display Calculation** (Average Time on Profile):
```dart
final avgDuration = totalProfileViewMs / profileViews / 1000; // Convert to seconds

// Format for display
String formatDuration(double seconds) {
  if (seconds < 60) {
    return '${seconds.round()}s';
  } else if (seconds < 3600) {
    final minutes = (seconds / 60).floor();
    final secs = (seconds % 60).round();
    return '${minutes}m ${secs}s';
  } else {
    final hours = (seconds / 3600).floor();
    final minutes = ((seconds % 3600) / 60).floor();
    return '${hours}h ${minutes}m';
  }
}
```

### 2. Search Appearances

**What it tracks**: Number of times an actor appears in producer search results

**Calculation**:
- Tracks first 20 actors displayed in search results
- Increments each time actor appears in search (not unique per session)
- Uses batch updates for performance

**Formula**:
```dart
// When search results are displayed
final displayedActors = actorIds.take(20).toList();

// Update each actor (fire and forget, async)
for (final actorId in displayedActors) {
  _updateActorAnalytics(
    actorId,
    AnalyticsIncrement(searchAppearances: 1),
  );
}
```

**Firestore Updates**:
- `user_analytics/{actorId}.searchAppearances` → +1
- `user_analytics/{actorId}/daily/{yyyyMMdd}.searchAppearances` → +1

**Why first 20 only?**
- Performance: Reduces number of Firestore writes
- Relevance: Only actors that are actually visible to user
- Cost: Prevents bulk updates for large result sets

### 3. Video Views

**What it tracks**: Number of times a video is viewed (must watch at least 3 seconds)

**Calculation**:
- Starts counting when video starts playing
- **Threshold**: View only counted after 3 seconds of continuous playback
- Uses client-side buffering (updates every 20 seconds)
- Delta capped at 30 seconds to ignore seeks

**Formula**:
```dart
// On video time update
final positionDelta = (currentTime - session.lastPosition).abs();
final watchDelta = (positionDelta * 1000).toInt();
final clampedWatchDelta = watchDelta > 30000 ? 30000 : watchDelta;

session.accumulatedWatchMs += clampedWatchDelta;
session.lastPosition = currentTime;

// Check if 3 second threshold reached
if (!session.viewCountIncremented && session.accumulatedWatchMs >= 3000) {
  session.viewCountIncremented = true; // Will be flushed to Firestore
}
```

**Firestore Updates** (on flush):
- `uploads/{userId}/userUploads/{videoId}.metadata.viewCount` → +1
- `user_analytics/{actorId}.totalVideoViews` → +1
- `user_analytics/{actorId}/daily/{yyyyMMdd}.totalVideoViews` → +1

**Why 3 second threshold?**
- Prevents accidental clicks from counting
- Industry standard (YouTube uses 30s, but 3s is reasonable for short videos)
- Ensures genuine engagement

### 4. Video Watch Time

**What it tracks**: Total time spent watching videos (in milliseconds)

**Calculation**:
- Accumulates watch time as video plays
- **Delta Capping**: Maximum 30 seconds between updates (ignores seeks)
- Buffered client-side, flushed every 20 seconds
- All watch time counted (even if below 3s view threshold)

**Formula**:
```dart
// Accumulate watch time
session.accumulatedWatchMs += clampedWatchDelta;

// On flush (every 20s or on video end)
if (session.accumulatedWatchMs > 0) {
  // Update video metadata
  videoUpdates['metadata.totalWatchMs'] =
      FieldValue.increment(session.accumulatedWatchMs);

  // Update actor analytics
  await _updateActorAnalytics(
    session.actorId,
    AnalyticsIncrement(totalWatchMs: session.accumulatedWatchMs),
  );
}
```

**Firestore Updates**:
- `uploads/{userId}/userUploads/{videoId}.metadata.totalWatchMs` → +accumulatedWatchMs
- `user_analytics/{actorId}.totalWatchMs` → +accumulatedWatchMs
- `user_analytics/{actorId}/daily/{yyyyMMdd}.totalWatchMs` → +accumulatedWatchMs

**Display Calculation** (Average Watch Time):
```dart
final avgWatchTime = totalWatchMs / totalVideoViews / 1000; // Convert to seconds

// Use same formatDuration() function as profile views
```

### 5. Wishlist Count

**What it tracks**: Number of producers who added actor to wishlist

**Calculation**:
- Uses separate `wishlists` collection
- Document ID format: `{producerId}_{actorId}`
- Count aggregation query

**Formula**:
```dart
// Add to wishlist
final wishlistId = '${producerId}_$actorId';
await _firestore.collection('wishlists').doc(wishlistId).set({
  'producerId': producerId,
  'actorId': actorId,
  'addedAt': Timestamp.now(),
});

// Get wishlist count
final query = _firestore
    .collection('wishlists')
    .where('actorId', isEqualTo: actorId);

final count = await query.count().get();
return count.count;
```

**Firestore Structure**:
- `wishlists/{producerId}_{actorId}`
  - `producerId`: string
  - `actorId`: string
  - `addedAt`: Timestamp

**Why composite key?**
- Prevents duplicates (one producer can't wishlist same actor multiple times)
- Efficient queries (can query by producerId or actorId)
- No need for transaction logic

### 6. Visibility Score

**What it tracks**: Percentile-based ranking (0-10 scale) comparing actor to all other actors

**Calculation Method 1** (Percentile-based, preferred):
```dart
// Calculate percentile for each metric
final profilePercentile = await _estimatePercentile('profileViews', profileViews);
final searchPercentile = await _estimatePercentile('searchAppearances', searchAppearances);
final videoPercentile = await _estimatePercentile('totalVideoViews', totalVideoViews);
final wishlistPercentile = min(wishlistCount / 10, 1.0);

// Weighted composite (0-1 scale)
final composite =
    profilePercentile * 0.25 +
    wishlistPercentile * 0.35 +   // Strongest signal
    searchPercentile * 0.15 +
    videoPercentile * 0.25;

final score = (composite * 10).round();
```

**Percentile Estimation**:
```dart
Future<double> _estimatePercentile(String field, int value) async {
  final analyticsRef = _firestore.collection('user_analytics');

  // Count users below this value
  final belowQuery = analyticsRef.where(field, isLessThan: value);
  final belowCount = await belowQuery.count().get();

  // Count total users
  final totalCount = await analyticsRef.count().get();

  final total = totalCount.count;
  if (total == 0) return 0;

  return belowCount.count / total;
}
```

**Calculation Method 2** (Benchmark-based fallback):
```dart
// Define "good" benchmarks
final benchmarks = {
  'profileViews': 50,
  'wishlistCount': 10,
  'searchAppearances': 100,
  'videoViews': 100,
};

// Each contributes 0-2.5 points (total = 10 points)
final scores = {
  'profile': min((profileViews / 50) * 2.5, 2.5),
  'wishlist': min((wishlistCount / 10) * 2.5, 2.5),
  'search': min((searchAppearances / 100) * 2.5, 2.5),
  'video': min((totalVideoViews / 100) * 2.5, 2.5),
};

final score = (scores.values.reduce((a, b) => a + b)).round();
```

**Weight Rationale**:
- **Wishlist (35%)**: Strongest signal of interest (producer took action)
- **Profile Views (25%)**: Important engagement metric
- **Video Views (25%)**: Content quality signal
- **Search Appearances (15%)**: Discoverability metric (less actionable)

---

## UI Integration

### 1. Profile Page Integration

**Lifecycle Hooks**:

```dart
class ProfilePage extends StatefulWidget {
  // ...
}

class _ProfilePageState extends State<ProfilePage> {
  final AnalyticsService _analyticsService = AnalyticsService(
    notificationService: NotificationService(),
  );

  @override
  void initState() {
    super.initState();
    _startProfileViewTracking();
  }

  Future<void> _startProfileViewTracking() async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    // Get producer info for notification
    final producerDoc = await FirebaseFirestore.instance
        .collection('users')
        .doc(currentUser.uid)
        .get();

    final producerName = producerDoc.data()?['name'];

    final producerProfileDoc = await FirebaseFirestore.instance
        .collection('profiles')
        .doc(currentUser.uid)
        .get();

    final producerPhotoUrl = producerProfileDoc.data()?['producerProfile']
        ?['producerProfileImageUrl'];

    await _analyticsService.startProfileView(
      widget.actorId,
      producerId: currentUser.uid,
      producerName: producerName,
      producerPhotoUrl: producerPhotoUrl,
    );
  }

  @override
  void dispose() {
    // End profile view tracking when leaving the page
    _analyticsService.endProfileView();
    super.dispose();
  }

  // ...
}
```

### 2. Video Player Integration

**Video Tracking**:

```dart
class VideoPlayerWidget extends StatefulWidget {
  final String actorId;
  final String videoId;
  final String userId;

  // ...
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  VideoPlayerController? _controller;
  final AnalyticsService _analyticsService = AnalyticsService(
    notificationService: NotificationService(),
  );

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    // Initialize video player
    _controller = VideoPlayerController.network(videoUrl);
    await _controller!.initialize();

    // Set up listeners
    _controller!.addListener(_onVideoUpdate);

    // Start analytics tracking
    await _analyticsService.startVideoTracking(
      actorId: widget.actorId,
      videoId: widget.videoId,
      userId: widget.userId,
    );

    setState(() {});
  }

  void _onVideoUpdate() {
    if (_controller == null || !_controller!.value.isPlaying) return;

    // Update progress every frame (analytics service will handle buffering)
    _analyticsService.updateVideoProgress(
      videoId: widget.videoId,
      userId: widget.userId,
      currentTime: _controller!.value.position.inMilliseconds / 1000,
    );
  }

  @override
  void dispose() {
    // End video tracking
    _analyticsService.endVideoTracking(
      videoId: widget.videoId,
      userId: widget.userId,
    );

    _controller?.removeListener(_onVideoUpdate);
    _controller?.dispose();

    super.dispose();
  }

  // ...
}
```

**Alternative: Using video_player callbacks**:

```dart
void _setupVideoPlayer() {
  _controller!.addListener(() {
    // On video ended
    if (_controller!.value.position >= _controller!.value.duration) {
      _onVideoEnded();
    }
  });

  // Start tracking when play is pressed
  _controller!.play().then((_) {
    _analyticsService.startVideoTracking(
      actorId: widget.actorId,
      videoId: widget.videoId,
      userId: widget.userId,
    );
  });
}

void _onVideoPaused() {
  _analyticsService.endVideoTracking(
    videoId: widget.videoId,
    userId: widget.userId,
  );
}

void _onVideoEnded() {
  _analyticsService.endVideoTracking(
    videoId: widget.videoId,
    userId: widget.userId,
  );
}
```

### 3. Search Page Integration

**Search Impressions Tracking**:

```dart
class SearchPage extends StatefulWidget {
  // ...
}

class _SearchPageState extends State<SearchPage> {
  final AnalyticsService _analyticsService = AnalyticsService(
    notificationService: NotificationService(),
  );

  List<ActorProfile> _displayedActors = [];
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _loadCurrentUserRole();
  }

  Future<void> _loadCurrentUserRole() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final userDoc = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .get();

    setState(() {
      _currentUserRole = userDoc.data()?['userType'];
    });
  }

  void _onSearchResultsDisplayed(List<ActorProfile> actors) {
    setState(() {
      _displayedActors = actors;
    });

    // Track search impressions if user is a producer
    if (_currentUserRole == 'producer' && actors.isNotEmpty) {
      // Extract actor IDs and track impressions (first 20 only)
      final actorIds = actors.take(20).map((actor) => actor.uid).toList();

      // Track asynchronously (fire and forget)
      _analyticsService.trackSearchImpressions(actorIds).catchError((err) {
        debugPrint('Error tracking search impressions: $err');
      });
    }
  }

  // ...
}
```

### 4. Wishlist Button Integration

**Toggle Wishlist**:

```dart
class WishlistButton extends StatefulWidget {
  final String actorId;

  // ...
}

class _WishlistButtonState extends State<WishlistButton> {
  final AnalyticsService _analyticsService = AnalyticsService(
    notificationService: NotificationService(),
  );

  bool _isInWishlist = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkWishlistStatus();
  }

  Future<void> _checkWishlistStatus() async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    final isWishlisted = await _analyticsService.isInWishlist(
      actorId: widget.actorId,
      producerId: currentUser.uid,
    );

    setState(() {
      _isInWishlist = isWishlisted;
      _isLoading = false;
    });
  }

  Future<void> _toggleWishlist() async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    setState(() => _isLoading = true);

    try {
      if (_isInWishlist) {
        await _analyticsService.removeFromWishlist(
          actorId: widget.actorId,
          producerId: currentUser.uid,
        );
      } else {
        await _analyticsService.addToWishlist(
          actorId: widget.actorId,
          producerId: currentUser.uid,
        );
      }

      setState(() {
        _isInWishlist = !_isInWishlist;
        _isLoading = false;
      });
    } catch (error) {
      debugPrint('Error toggling wishlist: $error');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const CircularProgressIndicator();
    }

    return IconButton(
      icon: Icon(_isInWishlist ? Icons.favorite : Icons.favorite_border),
      color: _isInWishlist ? Colors.red : Colors.grey,
      onPressed: _toggleWishlist,
    );
  }
}
```

### 5. Analytics Dashboard Page

**Full Implementation**:

```dart
class AnalyticsDashboard extends StatefulWidget {
  // ...
}

class _AnalyticsDashboardState extends State<AnalyticsDashboard> {
  final AnalyticsService _analyticsService = AnalyticsService(
    notificationService: NotificationService(),
  );

  bool _isLoading = true;
  bool _isSubscribed = false;

  // Analytics data
  int _profileViews = 0;
  String _avgProfileViewDuration = 'N/A';
  int _searchAppearances = 0;
  int _totalVideoViews = 0;
  String _avgVideoWatchTime = 'N/A';
  int _wishlistCount = 0;
  int _visibilityScore = 0;
  Map<String, dynamic>? _topVideo;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    try {
      // 1. Check subscription status
      final profileDoc = await FirebaseFirestore.instance
          .collection('profiles')
          .doc(currentUser.uid)
          .get();

      _isSubscribed = profileDoc.data()?['actorProfile']?['isSubscribed'] == true;

      if (!_isSubscribed) {
        setState(() => _isLoading = false);
        return;
      }

      // 2. Load lifetime analytics
      final lifetimeData = await _analyticsService.getLifetimeAnalytics(
        currentUser.uid,
      );

      // 3. Load wishlist count
      final wishlistCount = await _analyticsService.getWishlistCount(
        currentUser.uid,
      );

      // 4. Load last 30 days of daily data (for trends)
      final endDate = _getTodayId();
      final startDate = _getDateIdDaysAgo(30);
      final dailyData = await _analyticsService.getDailyAnalytics(
        actorId: currentUser.uid,
        startDate: startDate,
        endDate: endDate,
      );

      // 5. Load video analytics (top video)
      final topVideo = await _loadTopVideo(currentUser.uid);

      // 6. Calculate derived metrics
      final avgProfileViewDuration = lifetimeData != null &&
              lifetimeData.totalProfileViewMs > 0 &&
              lifetimeData.profileViews > 0
          ? _formatDuration(
              lifetimeData.totalProfileViewMs / lifetimeData.profileViews / 1000)
          : 'N/A';

      final avgVideoWatchTime = lifetimeData != null &&
              lifetimeData.totalWatchMs > 0 &&
              lifetimeData.totalVideoViews > 0
          ? _formatDuration(
              lifetimeData.totalWatchMs / lifetimeData.totalVideoViews / 1000)
          : 'N/A';

      final visibilityScore = await _calculateVisibilityScore(
        lifetimeData?.profileViews ?? 0,
        wishlistCount,
        lifetimeData?.searchAppearances ?? 0,
        lifetimeData?.totalVideoViews ?? 0,
        lifetimeData?.totalWatchMs ?? 0,
      );

      // 7. Update state
      setState(() {
        _profileViews = lifetimeData?.profileViews ?? 0;
        _avgProfileViewDuration = avgProfileViewDuration;
        _searchAppearances = lifetimeData?.searchAppearances ?? 0;
        _totalVideoViews = lifetimeData?.totalVideoViews ?? 0;
        _avgVideoWatchTime = avgVideoWatchTime;
        _wishlistCount = wishlistCount;
        _visibilityScore = visibilityScore;
        _topVideo = topVideo;
        _isLoading = false;
      });
    } catch (error) {
      debugPrint('Error loading analytics: $error');
      setState(() => _isLoading = false);
    }
  }

  Future<Map<String, dynamic>?> _loadTopVideo(String userId) async {
    try {
      final videosRef = FirebaseFirestore.instance
          .collection('uploads')
          .doc(userId)
          .collection('userUploads');

      final query = videosRef.where('fileType', isEqualTo: 'video');
      final snapshot = await query.get();

      if (snapshot.docs.isEmpty) return null;

      // Find video with most views
      Map<String, dynamic>? topVideo;
      int maxViews = 0;

      for (final doc in snapshot.docs) {
        final data = doc.data();
        final metadata = data['metadata'] as Map<String, dynamic>?;
        final viewCount = metadata?['viewCount'] ?? 0;

        if (viewCount > maxViews) {
          maxViews = viewCount;
          topVideo = {
            'title': metadata?['description'] ?? 'Untitled',
            'views': viewCount,
            'totalWatchMs': metadata?['totalWatchMs'] ?? 0,
          };
        }
      }

      if (topVideo == null) return null;

      final avgWatchTime = topVideo['views'] > 0
          ? _formatDuration(topVideo['totalWatchMs'] / topVideo['views'] / 1000)
          : 'N/A';

      return {
        'title': topVideo['title'],
        'views': topVideo['views'],
        'avgWatchTime': avgWatchTime,
      };
    } catch (error) {
      debugPrint('Error loading top video: $error');
      return null;
    }
  }

  Future<int> _calculateVisibilityScore(
    int profileViews,
    int wishlistCount,
    int searchAppearances,
    int totalVideoViews,
    int totalWatchMs,
  ) async {
    // Try percentile-based scoring first
    try {
      final profilePercentile = await _estimatePercentile(
        'profileViews',
        profileViews,
      );
      final searchPercentile = await _estimatePercentile(
        'searchAppearances',
        searchAppearances,
      );
      final videoPercentile = await _estimatePercentile(
        'totalVideoViews',
        totalVideoViews,
      );

      // Wishlist uses benchmark since it's in separate collection
      final wishlistPercentile = (wishlistCount / 10).clamp(0.0, 1.0);

      // Weighted composite (0-1 scale)
      final composite = profilePercentile * 0.25 +
          wishlistPercentile * 0.35 +
          searchPercentile * 0.15 +
          videoPercentile * 0.25;

      return (composite * 10).round();
    } catch (error) {
      // Fallback to benchmark-based scoring
      return _fallbackBenchmarkScore(
        profileViews,
        wishlistCount,
        searchAppearances,
        totalVideoViews,
      );
    }
  }

  Future<double> _estimatePercentile(String field, int value) async {
    try {
      final analyticsRef = FirebaseFirestore.instance.collection('user_analytics');

      // Count users below this value
      final belowQuery = analyticsRef.where(field, isLessThan: value);
      final belowCount = await belowQuery.count().get();

      // Count total users
      final totalCount = await analyticsRef.count().get();

      final total = totalCount.count;
      if (total == 0) return 0;

      return belowCount.count / total;
    } catch (error) {
      return 0.5; // Middle percentile as fallback
    }
  }

  int _fallbackBenchmarkScore(
    int profileViews,
    int wishlistCount,
    int searchAppearances,
    int totalVideoViews,
  ) {
    // Define "good" benchmarks
    const benchmarks = {
      'profileViews': 50,
      'wishlistCount': 10,
      'searchAppearances': 100,
      'videoViews': 100,
    };

    final scores = {
      'profile': (profileViews / benchmarks['profileViews']! * 2.5).clamp(0.0, 2.5),
      'wishlist': (wishlistCount / benchmarks['wishlistCount']! * 2.5).clamp(0.0, 2.5),
      'search': (searchAppearances / benchmarks['searchAppearances']! * 2.5).clamp(0.0, 2.5),
      'video': (totalVideoViews / benchmarks['videoViews']! * 2.5).clamp(0.0, 2.5),
    };

    return scores.values.reduce((a, b) => a + b).round();
  }

  String _formatDuration(double seconds) {
    if (seconds == 0) return 'N/A';

    if (seconds < 60) {
      return '${seconds.round()}s';
    } else if (seconds < 3600) {
      final minutes = (seconds / 60).floor();
      final secs = (seconds % 60).round();
      return '${minutes}m ${secs}s';
    } else {
      final hours = (seconds / 3600).floor();
      final minutes = ((seconds % 3600) / 60).floor();
      return '${hours}h ${minutes}m';
    }
  }

  String _getTodayId() {
    final now = DateTime.now();
    return '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
  }

  String _getDateIdDaysAgo(int days) {
    final date = DateTime.now().subtract(Duration(days: days));
    return '${date.year}${date.month.toString().padLeft(2, '0')}${date.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!_isSubscribed) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.analytics, size: 80, color: Colors.grey),
            const SizedBox(height: 20),
            const Text(
              'Upgrade to premium for detailed analytics',
              style: TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                // Navigate to subscription page
              },
              child: const Text('Go Premium'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile Overview
          const Text('Profile Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            children: [
              _buildStatCard('Profile Views\nby Producers', _profileViews.toString()),
              _buildStatCard('Avg. Time\non Profile', _avgProfileViewDuration),
              _buildStatCard('Wishlist Count', _wishlistCount.toString()),
              _buildVisibilityScoreCard(),
            ],
          ),

          const SizedBox(height: 32),

          // Search Appearances
          const Text('Search Appearances', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildStatCard(
            'Times your profile appeared in producer searches',
            _searchAppearances.toString(),
          ),

          const SizedBox(height: 32),

          // Video Analytics
          const Text('Video Performance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildStatCard('Total Video Views', _totalVideoViews.toString())),
              const SizedBox(width: 16),
              Expanded(child: _buildStatCard('Avg. Watch Time', _avgVideoWatchTime)),
            ],
          ),

          if (_topVideo != null) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Top Performing Video', style: TextStyle(fontSize: 14, color: Colors.grey)),
                    const SizedBox(height: 8),
                    Text(_topVideo!['title'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('${_topVideo!['views']} views • ${_topVideo!['avgWatchTime']}'),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildVisibilityScoreCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 60,
                  height: 60,
                  child: CircularProgressIndicator(
                    value: _visibilityScore / 10,
                    strokeWidth: 8,
                    backgroundColor: Colors.grey[300],
                  ),
                ),
                Text(
                  _visibilityScore.toString(),
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text('Visibility Score', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
```

---

## Firestore Security Rules

### Current Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User analytics
    match /user_analytics/{userId} {
      // Anyone can read analytics (for public profiles)
      allow read: if isAuthenticated();

      // Only owner can write their own analytics
      allow write: if isOwner(userId);

      // Daily subcollection
      match /daily/{dateId} {
        allow read: if isAuthenticated();
        allow write: if isOwner(userId);
      }
    }

    // Wishlists
    match /wishlists/{wishlistId} {
      // Anyone authenticated can read
      allow read: if isAuthenticated();

      // Anyone authenticated can create
      allow create: if isAuthenticated();

      // Anyone authenticated can update/delete
      // (In production, you might want to restrict delete to the producer who created it)
      allow update, delete: if isAuthenticated();
    }

    // Uploads (video analytics stored here)
    match /uploads/{userId}/userUploads/{uploadId} {
      // Anyone can read
      allow read: if isAuthenticated();

      // Only owner can write
      allow write: if isOwner(userId);
    }
  }
}
```

### Enhanced Security Rules (Recommended)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isProducer() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'producer';
    }

    // User analytics - strict increment validation
    match /user_analytics/{userId} {
      allow read: if isAuthenticated();

      // Only producers can write analytics (for tracking)
      // Only allow field increments (prevent setting absolute values)
      allow update: if isProducer() &&
                       request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['profileViews', 'totalProfileViewMs', 'searchAppearances',
                                   'totalVideoViews', 'totalWatchMs', 'updatedAt']) &&
                       // Validate increment limits
                       request.resource.data.profileViews <= resource.data.profileViews + 10 &&
                       request.resource.data.totalProfileViewMs <= resource.data.totalProfileViewMs + 600000 &&
                       request.resource.data.searchAppearances <= resource.data.searchAppearances + 100 &&
                       request.resource.data.totalVideoViews <= resource.data.totalVideoViews + 50 &&
                       request.resource.data.totalWatchMs <= resource.data.totalWatchMs + 3600000;

      // Allow initial document creation with default values
      allow create: if isProducer() &&
                       request.resource.data.actorId == userId &&
                       request.resource.data.profileViews >= 0 &&
                       request.resource.data.totalProfileViewMs >= 0 &&
                       request.resource.data.searchAppearances >= 0 &&
                       request.resource.data.totalVideoViews >= 0 &&
                       request.resource.data.totalWatchMs >= 0;

      match /daily/{dateId} {
        allow read: if isAuthenticated();

        // Same validation as lifetime doc
        allow update: if isProducer() &&
                         request.resource.data.diff(resource.data).affectedKeys()
                           .hasOnly(['profileViews', 'totalProfileViewMs', 'searchAppearances',
                                     'totalVideoViews', 'totalWatchMs', 'updatedAt']) &&
                         request.resource.data.profileViews <= resource.data.profileViews + 10 &&
                         request.resource.data.totalProfileViewMs <= resource.data.totalProfileViewMs + 600000 &&
                         request.resource.data.searchAppearances <= resource.data.searchAppearances + 100 &&
                         request.resource.data.totalVideoViews <= resource.data.totalVideoViews + 50 &&
                         request.resource.data.totalWatchMs <= resource.data.totalWatchMs + 3600000;

        allow create: if isProducer() &&
                         request.resource.data.date == dateId &&
                         request.resource.data.profileViews >= 0 &&
                         request.resource.data.totalProfileViewMs >= 0 &&
                         request.resource.data.searchAppearances >= 0 &&
                         request.resource.data.totalVideoViews >= 0 &&
                         request.resource.data.totalWatchMs >= 0;
      }
    }

    // Wishlists
    match /wishlists/{wishlistId} {
      allow read: if isAuthenticated();

      // Only producers can create wishlist entries
      // Document ID must match pattern: {producerId}_{actorId}
      allow create: if isProducer() &&
                       wishlistId == request.auth.uid + '_' + request.resource.data.actorId &&
                       request.resource.data.producerId == request.auth.uid;

      // Only the producer who created it can delete
      allow delete: if isProducer() &&
                       resource.data.producerId == request.auth.uid;

      // No updates allowed (delete and recreate instead)
      allow update: if false;
    }

    // Uploads (video analytics)
    match /uploads/{userId}/userUploads/{uploadId} {
      allow read: if isAuthenticated();

      // Owner can write anything
      allow write: if isOwner(userId);

      // Producers can only update analytics fields (for video tracking)
      allow update: if isProducer() &&
                       request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['metadata']) &&
                       request.resource.data.metadata.diff(resource.data.metadata).affectedKeys()
                         .hasOnly(['viewCount', 'totalWatchMs']) &&
                       // Validate increments (not decrements)
                       request.resource.data.metadata.viewCount >= resource.data.metadata.get('viewCount', 0) &&
                       request.resource.data.metadata.totalWatchMs >= resource.data.metadata.get('totalWatchMs', 0);
    }
  }
}
```

### Increment Limits Rationale

| Field | Max Increment | Rationale |
|-------|--------------|-----------|
| `profileViews` | +10 | Batch tracking limit (unlikely to view 10+ profiles simultaneously) |
| `totalProfileViewMs` | +600,000ms (10 min) | Cap profile view duration (matches service constant) |
| `searchAppearances` | +100 | Allow batch search tracking (first 20 displayed, but allow buffer) |
| `totalVideoViews` | +50 | Handle multiple video views in batch |
| `totalWatchMs` | +3,600,000ms (1 hour) | Cap watch time per write (reasonable for buffered updates) |

---

## Dependencies

### Required Flutter Packages

Add to `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Firebase
  firebase_core: ^2.24.2
  cloud_firestore: ^4.13.6
  firebase_auth: ^4.15.3

  # Video player (for video tracking)
  video_player: ^2.8.1

  # State management (optional, for reactive UI)
  provider: ^6.1.1
  # OR
  riverpod: ^2.4.9

  # Utilities
  intl: ^0.18.1  # For date formatting

dev_dependencies:
  flutter_test:
    sdk: flutter
  mockito: ^5.4.4  # For testing
```

### Installation Commands

```bash
# Add Firebase packages
flutter pub add firebase_core
flutter pub add cloud_firestore
flutter pub add firebase_auth

# Add video player
flutter pub add video_player

# Add state management (choose one)
flutter pub add provider
# OR
flutter pub add riverpod

# Get dependencies
flutter pub get
```

### Firebase Setup

1. **Create Firebase Project** (if not exists):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project or select existing
   - Enable Firestore Database
   - Enable Authentication

2. **Add Flutter App to Firebase**:
   ```bash
   # Install FlutterFire CLI
   dart pub global activate flutterfire_cli

   # Configure Firebase for your Flutter app
   flutterfire configure
   ```

3. **Initialize Firebase in `main.dart`**:
   ```dart
   import 'package:flutter/material.dart';
   import 'package:firebase_core/firebase_core.dart';
   import 'firebase_options.dart';

   void main() async {
     WidgetsFlutterBinding.ensureInitialized();
     await Firebase.initializeApp(
       options: DefaultFirebaseOptions.currentPlatform,
     );
     runApp(MyApp());
   }
   ```

4. **Deploy Firestore Security Rules**:
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools

   # Login to Firebase
   firebase login

   # Initialize Firebase project (if not done)
   firebase init firestore

   # Deploy security rules
   firebase deploy --only firestore:rules
   ```

### Service Dependencies

The `AnalyticsService` depends on:

1. **NotificationService**: For creating notifications when analytics events occur
   - Must implement:
     - `createProfileViewNotification()`
     - `createWishlistAddNotification()`

2. **AuthService**: For getting current user information
   - Used to get current user ID and role

**Notification Service Interface** (required):

```dart
class NotificationService {
  Future<void> createProfileViewNotification({
    required String actorId,
    required String producerId,
    required String producerName,
    required bool isPremium,
    String? producerPhotoUrl,
  }) async {
    // Implementation: Create notification document in Firestore
  }

  Future<void> createWishlistAddNotification({
    required String actorId,
    required String producerId,
    required String producerName,
    String? producerPhotoUrl,
    required bool isPremium,
  }) async {
    // Implementation: Create notification document in Firestore
  }
}
```

---

## Testing Checklist

### Unit Tests

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

void main() {
  group('AnalyticsService', () {
    late AnalyticsService analyticsService;
    late MockFirebaseFirestore mockFirestore;
    late MockNotificationService mockNotificationService;

    setUp(() {
      mockFirestore = MockFirebaseFirestore();
      mockNotificationService = MockNotificationService();
      analyticsService = AnalyticsService(
        firestore: mockFirestore,
        notificationService: mockNotificationService,
      );
    });

    tearDown(() {
      analyticsService.dispose();
    });

    test('startProfileView should initialize tracking state', () async {
      await analyticsService.startProfileView(
        'actor123',
        producerId: 'producer456',
        producerName: 'John Doe',
      );

      expect(analyticsService._currentProfileActorId, equals('actor123'));
      expect(analyticsService._currentProducerId, equals('producer456'));
      expect(analyticsService._profileViewStartTime, isNotNull);
    });

    test('endProfileView should update analytics after 1 second', () async {
      // Start tracking
      await analyticsService.startProfileView('actor123');

      // Wait 1.5 seconds
      await Future.delayed(const Duration(milliseconds: 1500));

      // End tracking
      await analyticsService.endProfileView();

      // Verify analytics were updated
      verify(mockFirestore.batch()).called(1);
    });

    test('endProfileView should not track views less than 1 second', () async {
      await analyticsService.startProfileView('actor123');

      // Wait only 500ms
      await Future.delayed(const Duration(milliseconds: 500));

      await analyticsService.endProfileView();

      // Should not update analytics
      verifyNever(mockFirestore.batch());
    });

    test('trackSearchImpressions should limit to 20 actors', () async {
      final actorIds = List.generate(50, (i) => 'actor$i');

      await analyticsService.trackSearchImpressions(actorIds);

      // Should only track first 20
      verify(mockFirestore.collection('user_analytics')).called(20);
    });

    test('video view should count after 3 seconds', () async {
      await analyticsService.startVideoTracking(
        actorId: 'actor123',
        videoId: 'video456',
        userId: 'actor123',
      );

      // Simulate video progress
      analyticsService.updateVideoProgress(
        videoId: 'video456',
        userId: 'actor123',
        currentTime: 1.0,
      );

      expect(analyticsService._videoSessions.values.first.viewCountIncremented, isFalse);

      analyticsService.updateVideoProgress(
        videoId: 'video456',
        userId: 'actor123',
        currentTime: 3.5,
      );

      expect(analyticsService._videoSessions.values.first.viewCountIncremented, isTrue);
    });

    test('wishlist composite key should match pattern', () async {
      final wishlistDoc = WishlistDoc(
        producerId: 'producer123',
        actorId: 'actor456',
        addedAt: Timestamp.now(),
      );

      expect(wishlistDoc.documentId, equals('producer123_actor456'));
    });

    test('_getTodayId should return yyyyMMdd format', () {
      final todayId = analyticsService._getTodayId();

      // Should match pattern
      expect(RegExp(r'^\d{8}$').hasMatch(todayId), isTrue);

      // Should match today's date
      final now = DateTime.now();
      final expected = '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
      expect(todayId, equals(expected));
    });

    test('_generateDateRange should return all dates in range', () {
      final dates = analyticsService._generateDateRange('20260101', '20260105');

      expect(dates.length, equals(5));
      expect(dates, equals(['20260101', '20260102', '20260103', '20260104', '20260105']));
    });

    test('formatDuration should format seconds correctly', () {
      expect(_formatDuration(30), equals('30s'));
      expect(_formatDuration(90), equals('1m 30s'));
      expect(_formatDuration(3660), equals('1h 1m'));
    });
  });
}
```

### Integration Tests

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Analytics Integration Tests', () {
    testWidgets('Profile view tracking end-to-end', (tester) async {
      // Navigate to profile page
      await tester.pumpWidget(MyApp());
      await tester.pumpAndSettle();

      // Tap on actor profile
      await tester.tap(find.text('Actor Name'));
      await tester.pumpAndSettle();

      // Wait for 2 seconds
      await Future.delayed(const Duration(seconds: 2));

      // Navigate back (triggers endProfileView)
      await tester.pageBack();
      await tester.pumpAndSettle();

      // Verify analytics were recorded (check Firestore)
      // This requires a test Firestore instance
    });

    testWidgets('Video tracking end-to-end', (tester) async {
      // Navigate to video player
      // Play video
      // Wait for 3+ seconds
      // Pause video
      // Verify analytics were recorded
    });

    testWidgets('Wishlist toggle end-to-end', (tester) async {
      // Navigate to actor profile
      // Tap wishlist button
      // Verify button state changes
      // Verify Firestore document created
      // Tap again to remove
      // Verify document deleted
    });
  });
}
```

### Manual Testing Checklist

**Profile View Tracking**:
- [ ] Navigate to actor profile as producer
- [ ] Stay for 1+ seconds
- [ ] Navigate away
- [ ] Check Firestore: `user_analytics/{actorId}` should show +1 profileViews
- [ ] Check daily doc: `user_analytics/{actorId}/daily/{today}` should exist
- [ ] Check notification created for premium actor

**Search Impressions**:
- [ ] Perform search as producer
- [ ] View results
- [ ] Check Firestore: first 20 actors should have +1 searchAppearances

**Video Tracking**:
- [ ] Play video on actor profile
- [ ] Watch for 3+ seconds
- [ ] Pause or close
- [ ] Check Firestore:
  - [ ] `uploads/{userId}/userUploads/{videoId}.metadata.viewCount` → +1
  - [ ] `uploads/{userId}/userUploads/{videoId}.metadata.totalWatchMs` → updated
  - [ ] `user_analytics/{actorId}.totalVideoViews` → +1
  - [ ] `user_analytics/{actorId}.totalWatchMs` → updated

**Wishlist**:
- [ ] Add actor to wishlist
- [ ] Check Firestore: `wishlists/{producerId}_{actorId}` created
- [ ] Check wishlist count query returns correct count
- [ ] Remove from wishlist
- [ ] Check document deleted

**Ghost Mode**:
- [ ] Enable ghost mode for actor
- [ ] View profile as producer
- [ ] Verify NO analytics recorded
- [ ] Disable ghost mode
- [ ] Verify analytics resume

**Analytics Dashboard**:
- [ ] View as free user → should show upgrade prompt
- [ ] View as premium user → should show all metrics
- [ ] Verify all calculations match Firestore data
- [ ] Verify visibility score is between 0-10

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)
1. Set up Firebase project and Flutter configuration
2. Create data models (all 6 interfaces)
3. Deploy Firestore security rules
4. Create `AnalyticsService` class skeleton

### Phase 2: Profile & Search Tracking (Week 2)
1. Implement profile view tracking
2. Implement search impression tracking
3. Add ghost mode checking
4. Test with real data

### Phase 3: Video Tracking (Week 3)
1. Implement video tracking session management
2. Add buffering and flush logic
3. Integrate with video player
4. Test video analytics accuracy

### Phase 4: Wishlist & Notifications (Week 4)
1. Implement wishlist CRUD operations
2. Integrate with notification service
3. Test composite key patterns
4. Verify security rules

### Phase 5: Analytics Dashboard (Week 5)
1. Create analytics dashboard UI
2. Implement metrics calculations
3. Add visibility score algorithm
4. Test percentile calculations

### Phase 6: Testing & Optimization (Week 6)
1. Write unit tests
2. Write integration tests
3. Performance testing (Firestore reads/writes)
4. Optimize batch operations
5. Final QA and deployment

---

## Common Issues & Solutions

### Issue 1: Analytics Not Updating

**Symptoms**: Analytics counts stay at 0 after events

**Possible Causes**:
- Ghost mode enabled for actor
- Security rules blocking writes
- Service not initialized properly
- Batch commit failing silently

**Solutions**:
```dart
// Add debug logging
debugPrint('[Analytics] Starting profile view: $actorId');

// Check ghost mode explicitly
final isGhost = await _checkGhostMode(actorId);
debugPrint('[Analytics] Ghost mode: $isGhost');

// Verify batch commits
try {
  await batch.commit();
  debugPrint('[Analytics] ✓ Batch committed successfully');
} catch (error) {
  debugPrint('[Analytics] ❌ Batch commit failed: $error');
  rethrow; // Don't swallow errors during debugging
}
```

### Issue 2: Video Views Not Counting

**Symptoms**: Videos show 0 views even after watching

**Possible Causes**:
- Video tracking not started
- 3 second threshold not reached
- Flush not called before disposing
- Video path mismatch

**Solutions**:
```dart
// Verify video path construction
final videoPath = 'uploads/$userId/userUploads/$videoId';
debugPrint('[Analytics] Expected video path: $videoPath');

// Check session exists
final session = _videoSessions[videoPath];
debugPrint('[Analytics] Session found: ${session != null}');
debugPrint('[Analytics] Accumulated watch time: ${session?.accumulatedWatchMs}ms');
debugPrint('[Analytics] View counted: ${session?.viewCountIncremented}');

// Force flush before dispose
@override
void dispose() {
  _analyticsService.endVideoTracking(
    videoId: widget.videoId,
    userId: widget.userId,
  ).then((_) {
    debugPrint('[Analytics] Video tracking ended successfully');
  });
  super.dispose();
}
```

### Issue 3: Wishlist Count Incorrect

**Symptoms**: Wishlist count doesn't match actual wishlists

**Possible Causes**:
- Composite key format incorrect
- Duplicate documents created
- Count query not using index

**Solutions**:
```dart
// Verify document ID format
final wishlistId = '${producerId}_$actorId';
debugPrint('[Analytics] Wishlist ID: $wishlistId');

// Check for duplicates
final snapshot = await _firestore
    .collection('wishlists')
    .where('actorId', isEqualTo: actorId)
    .get();

debugPrint('[Analytics] Wishlist documents: ${snapshot.docs.length}');
for (final doc in snapshot.docs) {
  debugPrint('  - ${doc.id}: ${doc.data()}');
}

// Use count aggregation (more efficient)
final count = await _firestore
    .collection('wishlists')
    .where('actorId', isEqualTo: actorId)
    .count()
    .get();

debugPrint('[Analytics] Count from aggregation: ${count.count}');
```

### Issue 4: Percentile Calculation Slow

**Symptoms**: Visibility score takes long to calculate

**Possible Causes**:
- Count queries on large collections
- No Firestore indexes
- Too many parallel queries

**Solutions**:
```dart
// Add timeouts to percentile queries
Future<double> _estimatePercentile(String field, int value) async {
  try {
    return await _estimatePercentileImpl(field, value)
        .timeout(const Duration(seconds: 5));
  } on TimeoutException {
    debugPrint('[Analytics] Percentile calculation timeout, using fallback');
    return 0.5; // Default to median
  }
}

// Use fallback scoring
final score = await _calculateVisibilityScore(...).catchError((error) {
  debugPrint('[Analytics] Visibility score error, using fallback: $error');
  return _fallbackBenchmarkScore(...);
});

// Create Firestore indexes (in Firebase Console)
// Collection: user_analytics
// Fields: profileViews (Ascending), searchAppearances (Ascending), totalVideoViews (Ascending)
```

### Issue 5: Memory Leaks from Video Sessions

**Symptoms**: App memory grows over time, sessions not cleaned up

**Possible Causes**:
- Sessions not removed from Map after flush
- Timer not cancelled on dispose
- Multiple instances of AnalyticsService

**Solutions**:
```dart
// Ensure service is singleton
class AnalyticsService {
  static AnalyticsService? _instance;

  factory AnalyticsService({
    FirebaseFirestore? firestore,
    required NotificationService notificationService,
  }) {
    _instance ??= AnalyticsService._internal(
      firestore: firestore,
      notificationService: notificationService,
    );
    return _instance!;
  }

  AnalyticsService._internal({
    FirebaseFirestore? firestore,
    required NotificationService notificationService,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _notificationService = notificationService {
    _startVideoFlushTimer();
  }

  // ... rest of implementation
}

// Always remove sessions after flush
finally {
  _videoSessions.remove(videoPath);
  debugPrint('[Analytics] Session removed: $videoPath');
  debugPrint('[Analytics] Active sessions: ${_videoSessions.length}');
}

// Cancel timer on dispose
@override
void dispose() {
  _videoFlushTimer?.cancel();
  _flushAllVideoSessions();
  debugPrint('[Analytics] Service disposed, ${_videoSessions.length} sessions flushed');
}
```

---

## Performance Optimization Tips

1. **Batch Operations**: Always use `writeBatch()` for multiple writes
2. **Index Creation**: Create composite indexes for common queries
3. **Client-Side Aggregation**: Calculate averages on client, not Firestore
4. **Lazy Loading**: Only load analytics when dashboard is visible
5. **Caching**: Cache lifetime analytics for 5 minutes
6. **Pagination**: Use pagination for daily analytics (load 30 days at a time)
7. **Offline Support**: Handle offline mode gracefully with retry logic

---

## Cost Considerations

**Firestore Pricing** (as of 2026):
- Reads: $0.06 per 100,000 documents
- Writes: $0.18 per 100,000 documents
- Deletes: $0.02 per 100,000 documents

**Estimated Costs** (per 1000 active users per day):
- Profile views: ~1000 writes × 2 (lifetime + daily) = 2000 writes = $0.0036
- Search impressions: ~5000 writes × 2 = 10,000 writes = $0.018
- Video tracking: ~500 flushes × 2 (video + analytics) = 1000 writes = $0.0018
- Wishlist operations: ~100 writes = $0.00018

**Total estimated cost**: ~$0.024/day for 1000 active users = **$0.72/month**

**Optimization strategies**:
- Increase video flush interval (20s → 30s) to reduce writes
- Batch search impressions (track every 5th appearance instead of every)
- Use Cloud Functions for daily rollups instead of client-side

---

## Conclusion

This guide provides a complete implementation of the analytics system from the Angular/TypeScript codebase in Flutter/Dart. The architecture maintains the same patterns, calculations, and data structures while adapting to Flutter best practices.

**Key Takeaways**:
- Use atomic batch updates for consistency
- Implement client-side buffering for cost optimization
- Respect user privacy (ghost mode)
- Gate premium features appropriately
- Monitor Firestore costs and optimize as needed

For questions or issues, refer to the [Testing Checklist](#testing-checklist) and [Common Issues](#common-issues--solutions) sections.
