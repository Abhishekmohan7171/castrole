import { Timestamp } from '@angular/fire/firestore';

/**
 * Lifetime analytics aggregates for an actor
 * Stored in: user_analytics/{actorId}
 */
export interface UserAnalyticsDoc {
  actorId: string;
  profileViews: number;
  totalProfileViewMs: number;
  searchAppearances: number;
  totalVideoViews: number;
  totalWatchMs: number;
  updatedAt: Timestamp;
}

/**
 * Daily analytics rollup for time-series data
 * Stored in: user_analytics/{actorId}/daily/{yyyyMMdd}
 */
export interface DailyAnalyticsDoc {
  date: string; // Format: yyyyMMdd
  profileViews: number;
  totalProfileViewMs: number;
  searchAppearances: number;
  totalVideoViews: number;
  totalWatchMs: number;
  updatedAt: Timestamp;
}

/**
 * Wishlist document linking producer to actor
 * Stored in: wishlists/{producerId}_{actorId}
 */
export interface WishlistDoc {
  producerId: string;
  actorId: string;
  addedAt: Timestamp;
}

/**
 * Video metadata extended with analytics fields
 * Used in uploads/{userId}/userUploads/{videoId}.metadata
 */
export interface VideoMetadataWithAnalytics {
  // Existing VideoMetadata fields
  tags: string[];
  mediaType?: string;
  description: string;
  thumbnailUrl?: string;
  duration?: number;
  resolution?: string;
  fps?: number;
  bitrate?: number;
  needsProcessing?: boolean;
  processed?: boolean;
  processedUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  compressed?: boolean;
  processedSize?: number;

  // NEW analytics fields
  viewCount?: number;
  totalWatchMs?: number;
}

/**
 * Analytics increment payload for batched updates
 */
export interface AnalyticsIncrement {
  profileViews?: number;
  totalProfileViewMs?: number;
  searchAppearances?: number;
  totalVideoViews?: number;
  totalWatchMs?: number;
}

/**
 * Video tracking session (internal to AnalyticsService)
 */
export interface VideoTrackingSession {
  actorId: string;
  videoId: string;
  videoPath: string; // Full path: uploads/{userId}/userUploads/{videoId}
  lastPosition: number; // Last known position in seconds
  accumulatedWatchMs: number; // Buffered watch time
  lastUpdateTime: number; // Timestamp of last update
  viewCountIncremented: boolean; // Whether we've counted the view (after 3s)
}
