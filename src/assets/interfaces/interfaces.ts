import { Timestamp } from 'firebase/firestore';

//USER INTERFACES
export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  phone: string; // e.g., +91-9xxxxxxxxx
  // location: string;
  currentRole: string; // e.g., 'user' | 'actor' | 'producer' | 'admin'
  createdAt: any; // Firestore serverTimestamp
  updatedAt: any; // Firestore serverTimestamp
  isLoggedIn: boolean;
  device: devices[]; // e.g., 'web', 'ios', 'android'
  loggedInTime: any; // Firestore serverTimestamp
  isPhoneVerified: boolean;
  // Presence tracking
  lastSeen?: any; // Firestore serverTimestamp - last activity
  isOnline?: boolean; // Real-time online status
  presenceUpdatedAt?: any; // Last presence update timestamp
  roles: string[];
  //settings related
  ghost?: boolean;
  blocked?: blockedDetails[];
  deleteAccount?: boolean;
  deleteAccountDate?: any;
  // Privacy settings
  readReceipts?: boolean; // Default true - send read receipts
  allowChatRequests?: boolean; // Default true - allow new chat requests
}

export interface devices {
  model?: string;
  platform: string;
  version?: string;
}

export interface blockedDetails {
  blockedBy: string;
  date: any;
  reason?: string;
}

//CHAT INTERFACES
interface ChatPermissions {
  canInitiateChat: boolean; // Only producers
  canSeeChat: boolean; // Actors after receiving message
  canSendMessage: boolean; // Both after chat is initiated
}

export type Message = {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  // Read receipt status
  status?: 'sent' | 'delivered' | 'seen';
};
export type Conversation = {
  id: string;
  name: string;
  last: string;
  messages?: Message[];
  unreadCount?: Record<string, number>;
  actorAccepted?: boolean;
  actorRejected?: boolean;
  profilePhotoUrl?: string;
  slugUid?: string;
};

export type UserRole = 'actor' | 'producer' | 'user';


export interface ChatRoom {
  id?: string;
  participants: string[]; // [actorId, producerId]
  actorId: string;
  producerId: string;
  createdBy: string; // producerId
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastMessage?: ChatMessage;
  actorCanSee: boolean; // only true after producer sends first message
  actorAccepted?: boolean; // true when actor accepts the chat request
  actorRejected?: boolean; // true when actor rejects the chat request

  // Unread counts - per user
  unreadCount?: Record<string, number>; // { userId: count }

  // Typing indicators
  typingUsers?: Record<string, Timestamp | null>; // { userId: timestamp or null }
}

export interface ChatMessage {
  id?: string;
  chatRoomId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
  messageType: 'text' | 'image' | 'file';
  // Read receipts
  deliveredAt?: Timestamp; // When message was delivered to receiver
  readAt?: Timestamp; // When message was read/seen by receiver
}

//UPLOAD INTERFACES
export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

export interface MediaUpload {
  userId?: string; // Optional - included when querying, but not stored in document
  fileName: string;
  fileUrl: string;
  fileType: 'video' | 'image';
  fileSize: number;
  uploadedAt: any;
  metadata?: VideoMetadata | ImageMetadata;
}

export interface VideoMetadata {
  tags: string[];
  mediaType?: string; // Optional - removed from upload UI
  description: string;
  thumbnailUrl?: string;
  duration?: number; // Video duration in seconds
  resolution?: string; // Video resolution (e.g., "1920x1080")
  fps?: number; // Frames per second
  bitrate?: number; // Bitrate in kbps
  needsProcessing?: boolean; // Flag for server-side compression
  processed?: boolean; // Track if video was processed on server
  processedUrl?: string; // URL of processed video (1080p standardized)
  originalSize?: number; // Original file size for analytics
  compressedSize?: number; // Client-compressed file size
  compressed?: boolean; // Track if video was compressed client-side
  processedSize?: number; // Server-processed file size
}

export interface ImageMetadata {
  caption?: string;
  tags?: string[];
  description?: string; // Image description
}

//ANALYTICS INTERFACES
export interface SearchImpressionMetadata {
  characterTypes?: string[];
  gender?: string;
  languages?: string[];
  skills?: string[];
  location?: string;
}

export interface AnalyticsEvent {
  id?: string;
  eventType: 'profile_view' | 'wishlist_add' | 'search_impression' | 'video_view';
  actorId: string;
  producerId: string;
  timestamp: Timestamp;
  metadata?: {
    duration?: number; // View duration in seconds
    // Video view metadata
    videoId?: string;
    videoFileName?: string;
    videoTitle?: string;
    videoTags?: string[];
    watchDuration?: number;
    // Search impression metadata
    searchFilters?: SearchImpressionMetadata;
    visibleVideos?: string[];
  };
}

export interface UserAnalytics {
  actorId: string;
  profileViews: {
    total: number;
    last30Days: number;
    avgDuration: number; // Average view duration in seconds
  };
  wishlistCount: number;
  visibilityScore: number; // 0-100 calculated metric

  // Phase 1: Search Appearances
  searchImpressions?: {
    total: number;
    last30Days: number;
    last7Days: number;
    visibleVideosFrequency: Record<string, number>; // { fileName: count }
  };

  // Phase 1: Top Performing Video
  topVideo?: {
    videoId: string;
    videoTitle: string;
    totalViews: number;
    avgWatchTime: number; // In seconds
    thumbnailUrl?: string;
  };

  // Phase 1: Video Performance Summary
  videoMetrics?: {
    totalVideoViews: number;
    totalVideosWithViews: number;
    avgViewsPerVideo: number;
  };

  lastUpdated: Timestamp;
}

export interface VideoAnalytics {
  actorId: string;
  videoId: string;
  videoTitle: string;
  videoTags: string[];
  totalViews: number;
  totalWatchTime: number;
  avgWatchDuration: number;
  viewsLast30Days: number;
  viewsLast7Days: number;
  firstViewedAt: Timestamp;
  lastViewedAt: Timestamp;
}

export interface TagAnalytics {
  actorId: string;
  tag: string;
  totalVideoViews: number;
  videosWithTag: number;
  avgViewsPerVideo: number;
  percentageOfTotalViews: number;
}
