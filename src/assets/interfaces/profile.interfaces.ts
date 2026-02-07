import { SubscriptionMetadata } from '../../app/interfaces/payment.interfaces';

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
  subscriptionMetadata?: SubscriptionMetadata; // Subscription details (optional)
  isBadgedVerified?: boolean; // 1- isPaidMember, 2- KYC (complete questionnaire + work entries)

  // NOTE: Wishlist is now stored in wishlists collection, not in producer profile
}

export interface ActorProfile {
  // Basic info
  stageName: string;
  height?: string;
  bodyType?: string;
  actorProfileImageUrl?: string;
  carouselImagesUrl?: string[]; // Carousel images of each actor
  voiceIntro?: string;
  skills?: Skill[];
  languages?: Language[];
  characterTypes?: string[]; // Character type tags from uploads (for search optimization)
  listEducation?: Education[];
  actorWorks?: Work[]; // Get the last from the list for recent work
  notifications?: Notification[];

  // Payment related
  isSubscribed?: boolean; // Default false
  subscriptionMetadata?: SubscriptionMetadata; // Subscription details (optional)
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

// DEPRECATED: Analytics are now stored in separate user_analytics collection
// These interfaces are kept temporarily for backward compatibility but should not be used
// export interface ActorAnalytics {
//   producerId: string;
//   lastViewedAt: any;
//   totalViews: number;
//   isWishlist: boolean;
//   videosWatched?: string[];
//   firstViewedAt?: any;
//   watchTime?: number;
//   keywordsMatched?: string[];
// }

// DEPRECATED: Video analytics are now stored in uploads/{userId}/userUploads/{videoId}.metadata
// export interface VideoAnalytics {
//   videoId: string;
//   videoTitle: string;
//   viewCount: number;
//   lastViewedAt?: any;
//   lastViewedBy?: string;
// }
