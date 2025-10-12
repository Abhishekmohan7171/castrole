import { Injectable, inject } from '@angular/core';
import { BrowserDetectionService } from '../utils/browser-detection';
import { PresenceService } from './presence.service';
import {
  Auth,
  User,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  linkWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, updateDoc, serverTimestamp, getDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../assets/interfaces/interfaces';
export type UserRole = 'actor' | 'producer';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private browserDetection = inject(BrowserDetectionService);
  private presence = inject(PresenceService);

  constructor() {
    // Auto-track presence based on auth state
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.presence.startTracking(user.uid);
      } else {
        this.presence.stopTracking();
      }
    });
  }

  // =========================
  // Email/Password, Google, Apple Auth
  // =========================

  // =========================
  // Utilities
  // =========================

  /** Writes/overwrites the user's profile document. */
  async saveUserProfile(uid: string, data: Partial<UserDoc>): Promise<void> {
    await setDoc(doc(this.db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true } as any);
  }

  // =========================
  // D. Google & Apple Auth
  // =========================

  /** Upserts a basic user profile from provider data. */
  private async upsertFromProvider(user: User): Promise<void> {
    const ref = doc(this.db, 'users', user.uid);
    const base = {
      name: user.displayName || '',
      email: user.email || '',
      phone: user.phoneNumber || '',
      isPhoneVerified: !!user.phoneNumber,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, { ...base }, { merge: true } as any);
  }

  // --- Google ---

  /** Sign in with Google using a popup. Only login; do not create profile. */
  async signInWithGoogle(): Promise<{ user: User; exists: boolean }> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    const ref = doc(this.db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    
    // Update login timestamp and device information if user exists
    if (snap.exists()) {
      await this.updateLoginTimestamp(cred.user.uid);
    }
    
    return { user: cred.user, exists: snap.exists() };
  }

  /** Link Google to the currently signed-in user via popup. */
  async linkGoogle(): Promise<User> {
    if (!this.auth.currentUser) throw new Error('No authenticated user to link Google for');
    const provider = new GoogleAuthProvider();
    const cred = await linkWithPopup(this.auth.currentUser, provider);
    await this.upsertFromProvider(cred.user);
    return cred.user;
  }

  // --- Apple ---

  /** Sign in with Apple using a popup. Only login; do not create profile. */
  async signInWithApple(): Promise<{ user: User; exists: boolean }> {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    const cred = await signInWithPopup(this.auth, provider);
    const ref = doc(this.db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    
    // Update login timestamp and device information if user exists
    if (snap.exists()) {
      await this.updateLoginTimestamp(cred.user.uid);
    }
    
    return { user: cred.user, exists: snap.exists() };
  }

  /** Link Apple to the currently signed-in user via popup. */
  async linkApple(): Promise<User> {
    if (!this.auth.currentUser) throw new Error('No authenticated user to link Apple for');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    const cred = await linkWithPopup(this.auth.currentUser, provider);
    await this.upsertFromProvider(cred.user);
    return cred.user;
  }

  // --- Email/Password ---

  /** Register a user with email/password and create a user profile document. */
  async registerWithEmail(params: {
    name: string;
    email: string;
    password: string;
    phone: string; // store in display format e.g. +91-9xxxxxxxxx
    location: string;
    role: string; // e.g., 'actor', 'producer', 'user'
  }): Promise<User> {
    const { name, email, password, phone, location, role } = params;
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    // set displayName for convenience
    try { await updateProfile(cred.user, { displayName: name }); } catch {}
    // upsert user profile with requested schema
    const ref = doc(this.db, 'users', cred.user.uid);
    const currentDevice = this.browserDetection.detectBrowser();
    
    const userDoc: UserDoc = {
      uid: cred.user.uid,
      name: name || '',
      email: email || '',
      phone: phone || '',
      // location: location || '',
      currentRole: role || 'user',
      roles: [role || 'user'], // Push the role to roles array during signup
      isLoggedIn: true,
      device: [currentDevice],
      loggedInTime: serverTimestamp(),
      isPhoneVerified: false,
      blocked: [],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      // ghost and deleteAccount will be set during those specific operations
    };
    
    await setDoc(ref, userDoc, { merge: true } as any);
    return cred.user;
  }

  /** Login with email/password and bump updatedAt. */
  async loginWithEmail(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    await this.updateLoginTimestamp(cred.user.uid);
    // Start presence tracking
    this.presence.startTracking(cred.user.uid);
    return cred.user;
  }

  /** Update login timestamp for any authentication method */
  async updateLoginTimestamp(uid: string): Promise<void> {
    const ref = doc(this.db, 'users', uid);
    const userDoc = await getDoc(ref);
    
    // Get current device info
    const currentDevice = this.browserDetection.detectBrowser();
    
    // Check if user document exists
    if (userDoc.exists()) {
      const userData = userDoc.data() as Record<string, any>;
      let devices = Array.isArray(userData['device']) ? [...userData['device']] : [];
      
      // Check if this device already exists in the array
      const deviceExists = devices.some((device: any) => 
        device.platform === currentDevice.platform && 
        device.version === currentDevice.version
      );
      
      // Only add the device if it doesn't already exist
      if (!deviceExists) {
        devices.push(currentDevice);
      }
      
      // Update login information with the updated device array
      await setDoc(ref, { 
        updatedAt: serverTimestamp(),
        isLoggedIn: true,
        loggedInTime: serverTimestamp(),
        device: devices
      }, { merge: true } as any);
    } else {
      // If user doc doesn't exist, create it with the current device
      await setDoc(ref, { 
        updatedAt: serverTimestamp(),
        isLoggedIn: true,
        loggedInTime: serverTimestamp(),
        device: [currentDevice]
      }, { merge: true } as any);
    }
  }

  /** Returns the currently authenticated user (or null). */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
  
  /** Sends a password reset email to the specified email address */
  async sendPasswordResetEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }
  
  /** Verifies a password reset code from the reset URL */
  async verifyPasswordResetCode(code: string): Promise<string> {
    return verifyPasswordResetCode(this.auth, code);
  }
  
  /** Confirms a password reset with the given code and new password */
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    return confirmPasswordReset(this.auth, code, newPassword);
  }
  
  /** Logs out the current user and updates their status in Firestore */
  async logout(): Promise<void> {
    const user = this.auth.currentUser;
    // Stop presence tracking before logout
    this.presence.stopTracking();
    
    if (user) {
      // Get the current browser info
      const currentDevice = this.browserDetection.detectBrowser();
      
      // Get the user document to update the device array
      const ref = doc(this.db, 'users', user.uid);
      const userDoc = await getDoc(ref);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as Record<string, any>;
        // Filter out the current device from the device array
        const updatedDevices = Array.isArray(userData['device']) ? 
          userData['device'].filter((device: any) => 
            !(device.platform === currentDevice.platform && 
              device.version === currentDevice.version)) : 
          [];
        
        // Update user status in Firestore
        await updateDoc(ref, { 
          isLoggedIn: false,
          device: updatedDevices,
          updatedAt: serverTimestamp() 
        });
      } else {
        // If user doc doesn't exist, just update logout status
        await updateDoc(ref, { 
          isLoggedIn: false,
          updatedAt: serverTimestamp() 
        });
      }
    }
    // Sign out from Firebase Auth
    return signOut(this.auth);
  }

  /**
   * Onboard a user who signed in with a provider (Google/Apple) by:
   * - Optionally linking an email+password credential (so they can login via email too)
   * - Upserting the profile document to Firestore
   */
  async onboardProviderUser(params: {
    name: string;
    email: string;
    password?: string;
    phone: string;
    location: string;
    role: string;
  }): Promise<User> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user found for onboarding');

    // If password is provided, link email/password to this provider account
    // This avoids creating a separate account and fixes auth/email-already-in-use
    if (params.password && params.email) {
      try {
        const cred = EmailAuthProvider.credential(params.email, params.password);
        await linkWithCredential(user, cred);
      } catch (err: any) {
        // If it's already linked or email already in use by this user, ignore
        if (err?.code !== 'auth/provider-already-linked' && err?.code !== 'auth/credential-already-in-use' && err?.code !== 'auth/email-already-in-use') {
          throw err;
        }
      }
    }

    // Upsert profile document
    const ref = doc(this.db, 'users', user.uid);
    const currentDevice = this.browserDetection.detectBrowser();
    
    const userDoc: UserDoc = {
      uid: user.uid,
      name: params.name || user.displayName || '',
      email: params.email || user.email || '',
      phone: params.phone || user.phoneNumber || '',
      // location: params.location || '',
      currentRole: params.role,
      roles: [params.role || 'user'], // Push the role to roles array during signup
      isLoggedIn: true,
      device: [currentDevice],
      loggedInTime: serverTimestamp(),
      isPhoneVerified: !!user.phoneNumber,
      blocked: [],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      // ghost and deleteAccount will be set during those specific operations
    };
    
    await setDoc(ref, userDoc, { merge: true } as any);

    return user;
  }
}
