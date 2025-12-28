import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Scheduled Analytics Aggregation
 * Runs daily at 3 AM UTC to process raw analytics events
 * Aggregates data into user_analytics, video_analytics, and tag_analytics
 */
export const aggregateAnalytics = functions.pubsub
  .schedule('0 3 * * *') // Runs daily at 3 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting analytics aggregation process...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Get all unique actor IDs from recent events
      const actorIds = await getUniqueActorIds(thirtyDaysAgo);

      console.log(`Processing analytics for ${actorIds.size} actors`);

      // Process each actor's analytics
      const processingPromises = Array.from(actorIds).map(async (actorId) => {
        try {
          await Promise.all([
            aggregateSearchImpressions(actorId, thirtyDaysAgo, sevenDaysAgo),
            aggregateVideoAnalytics(actorId, thirtyDaysAgo, sevenDaysAgo),
            aggregateTagAnalytics(actorId),
            updateTopPerformingVideo(actorId),
          ]);

          console.log(`✓ Completed aggregation for actor: ${actorId}`);
        } catch (error) {
          console.error(`Error processing actor ${actorId}:`, error);
        }
      });

      await Promise.allSettled(processingPromises);

      console.log('Analytics aggregation completed successfully');
      return null;
    } catch (error) {
      console.error('Error in analytics aggregation:', error);
      throw error;
    }
  });

/**
 * Get unique actor IDs from recent events
 */
async function getUniqueActorIds(since: Date): Promise<Set<string>> {
  const actorIds = new Set<string>();

  const eventsSnapshot = await admin
    .firestore()
    .collection('analytics_events')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(since))
    .get();

  eventsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.actorId) {
      actorIds.add(data.actorId);
    }
  });

  return actorIds;
}

/**
 * Aggregate search impression data for an actor
 */
async function aggregateSearchImpressions(
  actorId: string,
  thirtyDaysAgo: Date,
  sevenDaysAgo: Date
): Promise<void> {
  const db = admin.firestore();

  // Query all search_impression events for this actor
  const impressionsSnapshot = await db
    .collection('analytics_events')
    .where('eventType', '==', 'search_impression')
    .where('actorId', '==', actorId)
    .get();

  const total = impressionsSnapshot.size;

  // Count last 30 days
  const last30Days = impressionsSnapshot.docs.filter((doc) => {
    const timestamp = doc.data().timestamp?.toDate();
    return timestamp >= thirtyDaysAgo;
  }).length;

  // Count last 7 days
  const last7Days = impressionsSnapshot.docs.filter((doc) => {
    const timestamp = doc.data().timestamp?.toDate();
    return timestamp >= sevenDaysAgo;
  }).length;

  // Track which videos were visible during impressions
  const visibleVideosFrequency: Record<string, number> = {};
  impressionsSnapshot.forEach((doc) => {
    const visibleVideos = doc.data().metadata?.visibleVideos || [];
    visibleVideos.forEach((videoFileName: string) => {
      visibleVideosFrequency[videoFileName] =
        (visibleVideosFrequency[videoFileName] || 0) + 1;
    });
  });

  // Update user_analytics document
  const analyticsRef = db.collection('user_analytics').doc(actorId);
  await analyticsRef.set(
    {
      searchImpressions: {
        total,
        last30Days,
        last7Days,
        visibleVideosFrequency,
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Aggregate video analytics for an actor
 */
async function aggregateVideoAnalytics(
  actorId: string,
  thirtyDaysAgo: Date,
  sevenDaysAgo: Date
): Promise<void> {
  const db = admin.firestore();

  // Query all video_view events for this actor
  const videoViewsSnapshot = await db
    .collection('analytics_events')
    .where('eventType', '==', 'video_view')
    .where('actorId', '==', actorId)
    .get();

  // Group by video ID
  const videoMap = new Map<string, any>();

  videoViewsSnapshot.forEach((doc) => {
    const data = doc.data();
    const videoId = data.metadata?.videoId || data.metadata?.videoFileName;

    if (!videoId) return;

    if (!videoMap.has(videoId)) {
      videoMap.set(videoId, {
        actorId,
        videoId,
        videoTitle: data.metadata?.videoTitle || 'Untitled',
        videoTags: data.metadata?.videoTags || [],
        videoUrl: '', // Will be populated from uploads collection if needed
        totalViews: 0,
        totalWatchTime: 0,
        viewsLast30Days: 0,
        viewsLast7Days: 0,
        firstViewedAt: data.timestamp,
        lastViewedAt: data.timestamp,
        viewTimestamps: [],
      });
    }

    const video = videoMap.get(videoId)!;
    video.totalViews++;
    video.totalWatchTime += data.metadata?.watchDuration || 0;
    video.viewTimestamps.push(data.timestamp?.toDate());

    // Update first/last viewed timestamps
    if (data.timestamp?.toDate() < video.firstViewedAt?.toDate()) {
      video.firstViewedAt = data.timestamp;
    }
    if (data.timestamp?.toDate() > video.lastViewedAt?.toDate()) {
      video.lastViewedAt = data.timestamp;
    }
  });

  // Calculate time-based metrics and avg watch duration
  const videoAnalytics: Record<string, any> = {};
  let totalVideoViews = 0;
  let totalVideosWithViews = 0;

  videoMap.forEach((video, videoId) => {
    // Count views in last 30/7 days
    video.viewsLast30Days = video.viewTimestamps.filter(
      (ts: Date) => ts >= thirtyDaysAgo
    ).length;
    video.viewsLast7Days = video.viewTimestamps.filter(
      (ts: Date) => ts >= sevenDaysAgo
    ).length;

    // Calculate average watch duration
    video.avgWatchDuration =
      video.totalViews > 0 ? video.totalWatchTime / video.totalViews : 0;

    // Remove temporary viewTimestamps array
    delete video.viewTimestamps;

    videoAnalytics[videoId] = video;
    totalVideoViews += video.totalViews;
    totalVideosWithViews++;
  });

  // Save video analytics
  if (totalVideosWithViews > 0) {
    const videoAnalyticsRef = db
      .collection('video_analytics')
      .doc(`${actorId}_videos`);
    await videoAnalyticsRef.set(
      {
        videos: videoAnalytics,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Update user_analytics with video metrics summary
    const analyticsRef = db.collection('user_analytics').doc(actorId);
    await analyticsRef.set(
      {
        videoMetrics: {
          totalVideoViews,
          totalVideosWithViews,
          avgViewsPerVideo:
            totalVideosWithViews > 0
              ? totalVideoViews / totalVideosWithViews
              : 0,
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}

/**
 * Aggregate tag analytics for an actor
 */
async function aggregateTagAnalytics(actorId: string): Promise<void> {
  const db = admin.firestore();

  // Get video analytics to calculate tag metrics
  const videoAnalyticsDoc = await db
    .collection('video_analytics')
    .doc(`${actorId}_videos`)
    .get();

  if (!videoAnalyticsDoc.exists) {
    return;
  }

  const videos = videoAnalyticsDoc.data()?.videos || {};
  const tagMap = new Map<string, any>();
  let totalActorVideoViews = 0;

  // Aggregate metrics by tag
  Object.values(videos).forEach((video: any) => {
    const tags = video.videoTags || [];
    const views = video.totalViews || 0;

    totalActorVideoViews += views;

    tags.forEach((tag: string) => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, {
          actorId,
          tag,
          totalVideoViews: 0,
          videosWithTag: 0,
        });
      }

      const tagData = tagMap.get(tag)!;
      tagData.totalVideoViews += views;
      tagData.videosWithTag++;
    });
  });

  // Calculate percentages and averages
  const tagAnalytics: Record<string, any> = {};
  tagMap.forEach((tagData, tag) => {
    tagData.avgViewsPerVideo =
      tagData.videosWithTag > 0
        ? tagData.totalVideoViews / tagData.videosWithTag
        : 0;

    tagData.percentageOfTotalViews =
      totalActorVideoViews > 0
        ? (tagData.totalVideoViews / totalActorVideoViews) * 100
        : 0;

    tagAnalytics[tag] = tagData;
  });

  // Save tag analytics
  if (tagMap.size > 0) {
    const tagAnalyticsRef = db
      .collection('tag_analytics')
      .doc(`${actorId}_tags`);
    await tagAnalyticsRef.set(
      {
        tags: tagAnalytics,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}

/**
 * Update top performing video in user_analytics
 */
async function updateTopPerformingVideo(actorId: string): Promise<void> {
  const db = admin.firestore();

  // Get video analytics
  const videoAnalyticsDoc = await db
    .collection('video_analytics')
    .doc(`${actorId}_videos`)
    .get();

  if (!videoAnalyticsDoc.exists) {
    return;
  }

  const videos = videoAnalyticsDoc.data()?.videos || {};

  // Find video with most views
  let topVideo: any = null;
  let maxViews = 0;

  Object.values(videos).forEach((video: any) => {
    if (video.totalViews > maxViews) {
      maxViews = video.totalViews;
      topVideo = video;
    }
  });

  if (topVideo) {
    // Update user_analytics with top video
    const analyticsRef = db.collection('user_analytics').doc(actorId);
    await analyticsRef.set(
      {
        topVideo: {
          videoId: topVideo.videoId,
          videoTitle: topVideo.videoTitle,
          totalViews: topVideo.totalViews,
          avgWatchTime: topVideo.avgWatchDuration,
          thumbnailUrl: topVideo.thumbnailUrl || undefined,
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}
