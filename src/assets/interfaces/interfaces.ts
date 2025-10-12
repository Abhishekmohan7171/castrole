import { Timestamp } from "firebase/firestore";

//USER INTERFACES
export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  phone: string;           // e.g., +91-9xxxxxxxxx
  // location: string;
  currentRole: string;            // e.g., 'user' | 'actor' | 'producer' | 'admin'
  createdAt: any;          // Firestore serverTimestamp
  updatedAt: any;          // Firestore serverTimestamp
  isLoggedIn: boolean;
  device: devices[];          // e.g., 'web', 'ios', 'android'
  loggedInTime: any;       // Firestore serverTimestamp
  isPhoneVerified: boolean;
  roles: string[];
	//settings related
	ghost?: boolean;
	blocked?: blockedDetails[];
  deleteAccount?: boolean;
	deleteAccountDate?: any;
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
  canInitiateChat: boolean;    // Only producers
  canSeeChat: boolean;         // Actors after receiving message
  canSendMessage: boolean;     // Both after chat is initiated
}


export type Message = { id: string; from: 'me' | 'them'; text: string; time: string };
export type Conversation = {
  id: string;
  name: string;
  last: string;
  messages?: Message[];
  unreadCount?: Record<string, number>;
  actorAccepted?: boolean;
  actorRejected?: boolean;
};


export type UserRole = 'actor' | 'producer' | 'user';

export interface ChatRoom {
  id?: string;
  participants: string[];             // [actorId, producerId]
  actorId: string;
  producerId: string;
  createdBy: string;                  // producerId
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastMessage?: ChatMessage;
  actorCanSee: boolean;               // only true after producer sends first message
  actorAccepted?: boolean;            // true when actor accepts the chat request
  actorRejected?: boolean;            // true when actor rejects the chat request

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
  mediaType: string;
  description: string;
  thumbnailUrl?: string;
}

export interface ImageMetadata {
  caption?: string;
  tags?: string[];
}

