export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  phone: string;           // e.g., +91-9xxxxxxxxx
  location: string;
  role: string;            // e.g., 'user' | 'actor' | 'producer' | 'admin'
  createdAt: any;          // Firestore serverTimestamp
  updatedAt: any;          // Firestore serverTimestamp
  isLoggedIn: boolean;
  device: string;          // e.g., 'web', 'ios', 'android'
  LoggedInTime: any;       // Firestore serverTimestamp
  isPhoneVerified: boolean;
}
