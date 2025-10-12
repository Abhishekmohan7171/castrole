export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  phone: string;           // e.g., +91-9xxxxxxxxx
  location: string;
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

interface ChatPermissions {
  canInitiateChat: boolean;    // Only producers
  canSeeChat: boolean;         // Actors after receiving message
  canSendMessage: boolean;     // Both after chat is initiated
}

//firestore collection
// /users/{userId}
//   - role: 'actor' | 'producer'
//   - name: string
//   - email: string
//   - profileData: object

// /chatRooms/{chatRoomId}
//   - participants: [actorId, producerId]
//   - createdBy: producerId (always producer)
//   - createdAt: timestamp
//   - lastMessage: object
//   - actorCanSee: boolean (initially false)

// /messages/{messageId}
//   - chatRoomId: string
//   - senderId: string
//   - receiverId: string
//   - text: string
//   - timestamp: timestamp
//   - read: boolean
//   - messageType: 'text' | 'image' | 'file'
