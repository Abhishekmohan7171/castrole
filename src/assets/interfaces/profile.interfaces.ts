export interface Profile {
  // Common fields
  uid: string; // Identifying the user
  slug?: string; // Stored slug-uid (e.g., "rajkumar-rao-xK9mP2nQ7R") - set once, never changes
  gender?: string;
  location?: string;
  age?: string; // Optional, not related to profile completion progress bar for producer
  social?: Social;

  // Role specific
  actorProfile?: ActorProfile;
  producerProfile?: ProducerProfile;
}

export interface ProducerProfile {
  // Basic info
  name: string; // The name first when producer register
  designation?: string;
  productionHouse?: string;
  industryType?: string; // Dropdown
  producerProfileImageUrl?: string;
  listEducation?: Education[]; // Education entries for producers
  producerWorks?: Work[]; // Get the last from the list for recent work
  notifications?: Notification[];

  // Payment related
  isSubscribed?: boolean; // Default false
  isBadgedVerified?: boolean; // 1- isPaidMember, 2- KYC (complete questionnaire + work entries)

  // Wishlist
  wishList?: string[]; // List of actor UIDs
}

export interface ActorProfile {
  // Basic info
  stageName: string;
  height?: string;
  weight?: string;
  actorProfileImageUrl?: string;
  carouselImagesUrl?: string[]; // Carousel images of each actor
  voiceIntro?: string;
  skills?: Skill[];
  languages?: Language[];
  listEducation?: Education[];
  actorWorks?: Work[]; // Get the last from the list for recent work
  notifications?: Notification[];

  // Related to analytics
  actorAnalytics?: ActorAnalytics[]; // Recent viewers (max 100 entries)
  profileViewCount?: number; // All-time total profile views
  wishListCount?: number; // All-time wishlist additions
  videoAnalytics?: VideoAnalytics[]; // Per-video view counts

  // Payment related
  isSubscribed?: boolean; // Default false
}

export interface Language {
  language: string;
  rating: number;
}

export interface Skill {
  skill: string;
  rating: number; //1-5
}

export interface Notification {
  uid: string;
  title: string;
  message: string;
  type: string;
  isViewed?: boolean;
  chatRoomID?: string; // If needed to redirect to selected notified chat
}

export interface Education {
  yearCompleted: string; // Sort the list with year
  schoolName: string;
  courseName: string;
  certificateUrl?: string; // Optional
}

export interface Work {
  year: string;
  projectName: string;
  role?: string;
  genre?: string;
  projectLink?: string;
}

export interface Social {
  instaIdUrl?: string;
  youtubeIdUrl?: string;
  externalLinkUrl?: string;
  addLinkUrl?: string;
}

export interface ActorAnalytics {
  producerId: string; // Producer who viewed/interacted
  lastViewedAt: any; // Timestamp - Most recent view
  totalViews: number; // Total views from this producer
  isWishlist: boolean; // Currently in wishlist
  videosWatched?: string[]; // Video filenames watched (max 10 recent)
  firstViewedAt?: any; // Timestamp - First view (optional)
  watchTime?: number; // Deprecated - kept for backwards compatibility
  keywordsMatched?: string[]; // Deprecated - kept for backwards compatibility
}

export interface VideoAnalytics {
  videoId: string; // Filename or unique identifier
  videoTitle: string; // Video title/description
  viewCount: number; // Total views
  lastViewedAt?: any; // Timestamp - Last view
  lastViewedBy?: string; // Last viewer producer ID
}
