import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BrowserDetectionService } from '../utils/browser-detection';
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
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  PhoneAuthCredential,
  linkWithPhoneNumber,
  updatePhoneNumber,
  ApplicationVerifier,
  connectAuthEmulator,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, updateDoc, serverTimestamp, getDoc } from '@angular/fire/firestore';

export type UserRole = 'actor' | 'producer';

export interface ProfileBase {
  role: UserRole;
  name: string;       // stage name (actor) or production name (producer)
  location: string;
  email: string;
  mobile: string;     // E.164 format recommended: +15551234567
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private browserDetection = inject(BrowserDetectionService);
  private platformId = inject(PLATFORM_ID);
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;
  private isLocalhost = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // For localhost development, use Firebase Auth emulator if available
      if (this.isLocalhost) {
        try {
          // Uncomment this line if you want to use Firebase Auth emulator
          // connectAuthEmulator(this.auth, 'http://localhost:9099');
        } catch (e) {
          console.log('Auth emulator not available');
        }
      }
    }
  }

  // =========================
  // Email/Password, Google, Apple Auth
  // =========================

  // =========================
  // Utilities
  // =========================

  /** Writes/overwrites the user's profile document. */
  async saveUserProfile(uid: string, data: Partial<ProfileBase> & Record<string, any>): Promise<void> {
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
      mobile: user.phoneNumber || '',
      location: '',
      role: ('' as any) as UserRole, // role can be assigned later in onboarding
      emailVerified: user.emailVerified || false,
      phoneVerified: !!user.phoneNumber,
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
    
    await setDoc(ref, {
      uid: cred.user.uid,
      name: name || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || 'user',
      isLoggedIn: true,
      device: [currentDevice],
      LoggedInTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true } as any);
    return cred.user;
  }

  /** Login with email/password and bump updatedAt. */
  async loginWithEmail(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    await this.updateLoginTimestamp(cred.user.uid);
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
        LoggedInTime: serverTimestamp(),
        device: devices
      }, { merge: true } as any);
    } else {
      // If user doc doesn't exist, create it with the current device
      await setDoc(ref, { 
        updatedAt: serverTimestamp(),
        isLoggedIn: true,
        LoggedInTime: serverTimestamp(),
        device: [currentDevice]
      }, { merge: true } as any);
    }
  }

  /** Returns the currently authenticated user (or null). */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
  
  /** Logs out the current user and updates their status in Firestore */
  async logout(): Promise<void> {
    const user = this.auth.currentUser;
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
          LoggedOutTime: serverTimestamp() 
        });
      } else {
        // If user doc doesn't exist, just update logout time
        await updateDoc(ref, { 
          isLoggedIn: false,
          LoggedOutTime: serverTimestamp() 
        });
      }
    }
    // Sign out from Firebase Auth
    return signOut(this.auth);
  }

  // =========================
  // Phone Authentication
  // =========================

  /** Initialize recaptcha verifier for phone authentication */
  async initRecaptchaVerifier(containerElementId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> {
    // Clean up existing verifier if any
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (e) {
        console.log('Error clearing existing verifier:', e);
      }
      this.recaptchaVerifier = null;
    }
    
    // Wait for the container element to be available
    const container = document.getElementById(containerElementId);
    if (!container) {
      // Create the container if it doesn't exist
      const newContainer = document.createElement('div');
      newContainer.id = containerElementId;
      document.body.appendChild(newContainer);
    }
    
    // Add a small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerElementId, {
        size: 'invisible',
        callback: (response: any) => {
          // reCAPTCHA solved - will proceed with phone auth
          console.log('reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
          // Reset reCAPTCHA
          console.log('reCAPTCHA expired, resetting...');
          this.cleanupPhoneAuth();
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          this.cleanupPhoneAuth();
        }
      });
      
      // Render the reCAPTCHA widget
      const widgetId = await this.recaptchaVerifier.render();
      console.log('reCAPTCHA rendered with widget ID:', widgetId);
      
    } catch (error: any) {
      console.error('Error initializing reCAPTCHA:', error);
      
      // If it's already rendered, clear and retry
      if (error?.message?.includes('already rendered')) {
        console.log('reCAPTCHA already rendered, clearing and retrying...');
        const existingContainer = document.getElementById(containerElementId);
        if (existingContainer) {
          existingContainer.innerHTML = '';
        }
        // Retry initialization
        return this.initRecaptchaVerifier(containerElementId);
      }
      
      throw error;
    }
    
    return this.recaptchaVerifier;
  }

  /** Send OTP to phone number */
  async sendOTP(phoneNumber: string, recaptchaContainerId?: string): Promise<void> {
    // For localhost development, simulate OTP sending
    if (this.isLocalhost) {
      console.log('🚀 Development mode: Simulating OTP send to', phoneNumber);
      
      // Create a mock confirmation result for localhost
      this.confirmationResult = {
        confirm: async (code: string) => {
          if (code === '123456' || code === '000000') {
            // Return a mock user for successful verification
            return {
              user: this.auth.currentUser || {
                uid: 'mock-phone-user-' + Date.now(),
                phoneNumber: phoneNumber,
                displayName: null,
                email: null
              } as any
            };
          } else {
            throw { code: 'auth/invalid-verification-code', message: 'Invalid verification code' };
          }
        },
        verificationId: 'mock-verification-id-' + Date.now()
      } as any;
      
      console.log('✅ Mock OTP sent! Use code: 123456 or 000000');
      return;
    }

    try {
      // Production flow with reCAPTCHA
      if (!this.recaptchaVerifier) {
        await this.initRecaptchaVerifier(recaptchaContainerId || 'recaptcha-container');
      }

      // Validate phone number format
      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1234567890)');
      }

      console.log('Sending OTP to:', phoneNumber);
      
      // Send OTP
      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier as ApplicationVerifier
      );
      
      console.log('OTP sent successfully');
    } catch (error: any) {
      console.error('Error in sendOTP:', error);
      
      // Clean up on error
      this.recaptchaVerifier?.clear();
      this.recaptchaVerifier = null;
      this.confirmationResult = null;
      
      // Provide more specific error messages
      if (error?.code === 'auth/invalid-app-credential') {
        throw new Error('Phone authentication not configured. Please check Firebase settings and add localhost to authorized domains.');
      } else if (error?.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Please include country code.');
      } else if (error?.code === 'auth/missing-phone-number') {
        throw new Error('Phone number is required.');
      } else if (error?.code === 'auth/quota-exceeded') {
        throw new Error('SMS quota exceeded. Please try again later.');
      } else if (error?.code === 'auth/user-disabled') {
        throw new Error('This phone number has been disabled.');
      } else if (error?.code === 'auth/captcha-check-failed') {
        throw new Error('reCAPTCHA verification failed. Please try again.');
      }
      
      throw error;
    }
  }

  /** Verify OTP code */
  async verifyOTP(code: string): Promise<User> {
    if (!this.confirmationResult) {
      throw new Error('No OTP verification in progress');
    }

    try {
      const result = await this.confirmationResult.confirm(code);
      
      // For localhost mock verification
      if (this.isLocalhost) {
        console.log('✅ Mock OTP verification successful!');
      }
      
      // Clean up after successful verification
      this.cleanupPhoneAuth();
      return result.user;
    } catch (error: any) {
      if (error?.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP code');
      }
      throw error;
    }
  }

  /** Link phone number to existing user account */
  async linkPhoneNumber(phoneNumber: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Initialize recaptcha if needed
    if (!this.recaptchaVerifier) {
      await this.initRecaptchaVerifier();
    }

    this.confirmationResult = await linkWithPhoneNumber(
      user,
      phoneNumber,
      this.recaptchaVerifier as ApplicationVerifier
    );
  }

  /** Verify OTP for phone linking */
  async verifyPhoneLinking(code: string): Promise<void> {
    if (!this.confirmationResult) {
      throw new Error('No phone linking in progress');
    }

    try {
      await this.confirmationResult.confirm(code);
      
      // For localhost mock verification
      if (this.isLocalhost) {
        console.log('✅ Mock phone linking successful!');
      }
      
      // Clean up after successful verification
      this.cleanupPhoneAuth();
    } catch (error: any) {
      if (error?.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP code');
      }
      throw error;
    }
  }

  /** Update phone number in user profile */
  async updateUserPhoneVerified(uid: string, phone: string): Promise<void> {
    const ref = doc(this.db, 'users', uid);
    await updateDoc(ref, {
      phone,
      phoneVerified: true,
      updatedAt: serverTimestamp()
    });
  }

  /** Clean up phone auth resources */
  cleanupPhoneAuth(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
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
    
    await setDoc(ref, {
      uid: user.uid,
      name: params.name || user.displayName || '',
      email: params.email || user.email || '',
      phone: params.phone || user.phoneNumber || '',
      location: params.location || '',
      role: params.role || 'user',
      isLoggedIn: true,
      device: [currentDevice],
      LoggedInTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true } as any);

    return user;
  }
}
