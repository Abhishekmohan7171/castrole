import { Injectable, inject } from '@angular/core';
import { UserOnboardingCacheService } from './user-onboarding-cache.service';
import { BrowserDetectionService } from '../utils/browser-detection';
import { PresenceService } from './presence.service';
import { SessionValidationService } from './session-validation.service';
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
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  applyActionCode,
  fetchSignInMethodsForEmail,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  deleteField,
  Timestamp,
} from '@angular/fire/firestore';
import { UserDoc } from '../../assets/interfaces/interfaces';
import {
  ActorProfile,
  ProducerProfile,
  Profile,
} from '../../assets/interfaces/profile.interfaces';
export type UserRole = 'actor' | 'producer';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private browserDetection = inject(BrowserDetectionService);
  private presence = inject(PresenceService);
  private onboardingCache = inject(UserOnboardingCacheService);
  private sessionValidation = inject(SessionValidationService);

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
  // Phone Authentication
  // =========================

  /** Send OTP to phone number for verification */
  async sendOTP(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    try {
      const confirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  /** Verify OTP code */
  async verifyOTP(confirmationResult: ConfirmationResult, code: string): Promise<User> {
    try {
      const credential = await confirmationResult.confirm(code);
      return credential.user;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /** Update user phone verification status */
  async markPhoneAsVerified(uid: string, phoneNumber: string): Promise<void> {
    const ref = doc(this.db, 'users', uid);
    await updateDoc(ref, {
      phone: phoneNumber,
      isPhoneVerified: true,
      updatedAt: serverTimestamp(),
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
    await setDoc(
      doc(this.db, 'users', uid),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true } as any
    );
  }

  /** Creates or updates a profile document in the profiles collection */
  async createProfile(
    uid: string,
    profileData: Partial<Profile>
  ): Promise<void> {
    const profileRef = doc(this.db, 'profiles', uid);
    await setDoc(
      profileRef,
      {
        uid,
        ...profileData,
      },
      { merge: true } as any
    );
  }

  /** Checks if a profile exists for the given user */
  async profileExists(uid: string): Promise<boolean> {
    const profileRef = doc(this.db, 'profiles', uid);
    const profileDoc = await getDoc(profileRef);
    return profileDoc.exists();
  }

  /** Migrates existing user to create a profile document based on their UserDoc data */
  async migrateUserProfile(uid: string): Promise<void> {
    // Check if profile already exists
    if (await this.profileExists(uid)) {
      return; // Profile already exists, no migration needed
    }

    // Get user document from users collection
    const userRef = doc(this.db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn(`User document not found for uid: ${uid}`);
      return;
    }

    const userData = userDoc.data() as any;
    const role = userData.role;
    const name = userData.name || '';
    const location = userData.location || '';

    // Create profile based on role
    if (role === 'actor') {
      await this.createActorProfile(uid, {
        stageName: name,
        location: location,
      });
      console.log(`Migrated actor profile for uid: ${uid}`);
    } else if (role === 'producer') {
      await this.createProducerProfile(uid, {
        name: name,
        location: location,
        productionHouse: name, // Use name as production house for existing users
      });
      console.log(`Migrated producer profile for uid: ${uid}`);
    } else {
      console.warn(
        `Unknown role "${role}" for user ${uid}, skipping profile migration`
      );
    }
  }

  /** Ensures a profile exists for the current user, creating one if necessary */
  async ensureProfileExists(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    if (!(await this.profileExists(user.uid))) {
      await this.migrateUserProfile(user.uid);
    }
  }

  /**
   * Bulk migration method for existing users (can be called from admin panel or service)
   * This method can migrate all users who don't have profiles yet
   */
  async bulkMigrateProfiles(): Promise<{ success: number; failed: string[] }> {
    // Note: This is a basic implementation. In production, you might want to use
    // Firebase Functions or batch operations for better performance
    console.warn(
      'Bulk migration should be run carefully and preferably through Firebase Functions'
    );

    const results = {
      success: 0,
      failed: [] as string[],
    };

    // This method would need to be implemented with proper pagination
    // and error handling in a production environment
    return results;
  }

  /** Creates an actor profile with initial data */
  async createActorProfile(
    uid: string,
    data: {
      stageName: string;
      location: string;
    }
  ): Promise<void> {
    const actorProfile: ActorProfile = {
      stageName: data.stageName,
      carouselImagesUrl: [],
      skills: [],
      languages: [],
      listEducation: [],
      actorWorks: [],
      notifications: [],
      isSubscribed: false,
    };

    const profile: Profile = {
      uid,
      location: data.location,
      actorProfile,
    };

    await this.createProfile(uid, profile);
  }

  /** Creates a producer profile with initial data */
  async createProducerProfile(
    uid: string,
    data: {
      name: string;
      location: string;
      productionHouse?: string;
    }
  ): Promise<void> {
    const producerProfile: ProducerProfile = {
      name: data.name,
      productionHouse: data.productionHouse,
      producerWorks: [],
      notifications: [],
      isSubscribed: false,
      isBadgedVerified: false,
    };

    const profile: Profile = {
      uid,
      location: data.location,
      producerProfile,
    };

    await this.createProfile(uid, profile);
  }

  /** Adds an alternate account type (actor/producer) to an existing user */
  async addAlternateAccount(params: {
    uid: string;
    role: 'actor' | 'producer';
    name?: string;
    productionHouse?: string;
    location: string;
  }): Promise<void> {
    const { uid, role, name, productionHouse, location } = params;

    // First, fetch the existing profile document
    const profileRef = doc(this.db, 'profiles', uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      throw new Error('User profile not found');
    }

    const existingProfile = profileSnap.data() as Profile;

    // Create the new role-specific profile
    if (role === 'actor') {
      if (!name) {
        throw new Error('Stage name is required for actor profile');
      }

      const actorProfile: ActorProfile = {
        stageName: name,
        carouselImagesUrl: [],
        skills: [],
        languages: [],
        listEducation: [],
        actorWorks: [],
        notifications: [],
        isSubscribed: false,
      };

      // Merge with existing profile
      await setDoc(
        profileRef,
        {
          ...existingProfile,
          location: location,
          actorProfile,
        },
        { merge: true } as any
      );
    } else if (role === 'producer') {
      if (!productionHouse) {
        throw new Error('Production house is required for producer profile');
      }

      const producerProfile: ProducerProfile = {
        name: name || '',
        productionHouse: productionHouse,
        producerWorks: [],
        notifications: [],
        isSubscribed: false,
        isBadgedVerified: false,
      };

      // Merge with existing profile
      await setDoc(
        profileRef,
        {
          ...existingProfile,
          location: location,
          producerProfile,
        },
        { merge: true } as any
      );
    }

    // Update user document to add the new role
    const userRef = doc(this.db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User document not found');
    }

    const userData = userSnap.data() as UserDoc;
    const updatedRoles = [...(userData.roles || [])];

    // Add the new role if not already present
    if (!updatedRoles.includes(role)) {
      updatedRoles.push(role);
    }

    // Update user document with new roles and switch to the new role
    await updateDoc(userRef, {
      roles: updatedRoles,
      currentRole: role,
      updatedAt: serverTimestamp(),
    });
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
      // Store session start BEFORE updating server timestamp
      this.sessionValidation.initializeSession(cred.user.uid);
      await this.updateLoginTimestamp(cred.user.uid);

      // Ensure profile exists for existing users
      try {
        await this.migrateUserProfile(cred.user.uid);
      } catch (error) {
        console.error('Profile migration failed:', error);
        // Don't block login if migration fails
      }
    }

    return { user: cred.user, exists: snap.exists() };
  }

  /** Link Google to the currently signed-in user via popup. */
  async linkGoogle(): Promise<User> {
    if (!this.auth.currentUser)
      throw new Error('No authenticated user to link Google for');
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
      // Store session start BEFORE updating server timestamp
      this.sessionValidation.initializeSession(cred.user.uid);
      await this.updateLoginTimestamp(cred.user.uid);

      // Ensure profile exists for existing users
      try {
        await this.migrateUserProfile(cred.user.uid);
      } catch (error) {
        console.error('Profile migration failed:', error);
        // Don't block login if migration fails
      }
    }

    return { user: cred.user, exists: snap.exists() };
  }

  /** Link Apple to the currently signed-in user via popup. */
  async linkApple(): Promise<User> {
    if (!this.auth.currentUser)
      throw new Error('No authenticated user to link Apple for');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    const cred = await linkWithPopup(this.auth.currentUser, provider);
    await this.upsertFromProvider(cred.user);
    return cred.user;
  }

  // --- Email/Password ---

  /** Register a user with email/password and create both user and profile documents. */
  async registerWithEmail(params: {
    name: string;
    email: string;
    password: string;
    phone: string; // store in display format e.g. +91-9xxxxxxxxx
    location: string;
    role: string; // e.g., 'actor', 'producer', 'user'
    productionHouse?: string; // For producer onboarding
    isPhoneVerified?: boolean; // Whether phone was verified via OTP
  }): Promise<User> {
    const { name, email, password, phone, location, role, productionHouse, isPhoneVerified = false } =
      params;
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    // set displayName for convenience
    try {
      await updateProfile(cred.user, { displayName: name });
    } catch {}

    // Store session start BEFORE creating user document to prevent race condition
    this.sessionValidation.initializeSession(cred.user.uid);

    // Create user document in users collection
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
      isPhoneVerified: isPhoneVerified,
      blocked: [],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      // ghost and deleteAccount will be set during those specific operations
    };

    await setDoc(ref, userDoc, { merge: true } as any);

    // Create role-specific profile document
    if (role === 'actor') {
      await this.createActorProfile(cred.user.uid, {
        stageName: name,
        location: location,
      });
    } else if (role === 'producer') {
      await this.createProducerProfile(cred.user.uid, {
        name: name,
        location: location,
        productionHouse: productionHouse,
      });
    }

    // Mark user as onboarded in cache
    this.onboardingCache.markAsOnboarded(cred.user.uid);

    return cred.user;
  }

  /** Login with email/password and bump updatedAt. */
  async loginWithEmail(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    // Store session start BEFORE updating server timestamp
    this.sessionValidation.initializeSession(cred.user.uid);
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
      let devices = Array.isArray(userData['device'])
        ? [...userData['device']]
        : [];

      // Check if this device already exists in the array
      const deviceExists = devices.some(
        (device: any) =>
          device.platform === currentDevice.platform &&
          device.version === currentDevice.version
      );

      // Only add the device if it doesn't already exist
      if (!deviceExists) {
        devices.push(currentDevice);
      }

      // Update login information with the updated device array
      await setDoc(
        ref,
        {
          updatedAt: serverTimestamp(),
          isLoggedIn: true,
          loggedInTime: serverTimestamp(),
          device: devices,
        },
        { merge: true } as any
      );
    } else {
      // If user doc doesn't exist, create it with the current device
      await setDoc(
        ref,
        {
          updatedAt: serverTimestamp(),
          isLoggedIn: true,
          loggedInTime: serverTimestamp(),
          device: [currentDevice],
        },
        { merge: true } as any
      );
    }
  }

  /** Returns the currently authenticated user (or null). */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /** Fetch the full user document */
  async getUserData(uid: string): Promise<UserDoc | null> {
    const ref = doc(this.db, 'users', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserDoc) : null;
  }

  /** Update the current active role for the session */
  async switchRole(uid: string, role: 'actor' | 'producer'): Promise<void> {
    const ref = doc(this.db, 'users', uid);
    await updateDoc(ref, {
      currentRole: role,
      updatedAt: serverTimestamp()
    });
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

  // =========================
  // Email Change Methods
  // =========================

  /** Check if email is already in use by another account */
  async isEmailInUse(email: string): Promise<boolean> {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(this.auth, email);
      return signInMethods.length > 0;
    } catch (error) {
      console.error('[AuthService] Error checking email:', error);
      return false;
    }
  }

  /** Update user email directly */
  async updateUserEmail(newEmail: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      const { updateEmail } = await import('@angular/fire/auth');
      await updateEmail(user, newEmail);
    } catch (error: any) {
      console.error('[AuthService] Email update failed:', error);
      if (error?.code === 'auth/email-already-in-use') {
        throw new Error('This email is already in use by another account');
      } else if (error?.code === 'auth/invalid-email') {
        throw new Error('Invalid email format');
      } else if (error?.code === 'auth/requires-recent-login') {
        throw new Error('Please log out and log back in to change your email');
      }
      throw error;
    }
  }

  /** Send verification email to user's current email */
  async sendVerificationEmail(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      const { sendEmailVerification } = await import('@angular/fire/auth');
      await sendEmailVerification(user, {
        url: `${window.location.origin}/discover/settings?tab=account`,
        handleCodeInApp: false,
      });
    } catch (error: any) {
      console.error('[AuthService] Send verification failed:', error);
      if (error?.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      }
      throw error;
    }
  }

  /** Apply email verification action code */
  async applyEmailVerification(oobCode: string): Promise<void> {
    try {
      await applyActionCode(this.auth, oobCode);
      // Reload user to get updated emailVerified status
      await this.auth.currentUser?.reload();
    } catch (error: any) {
      console.error('[AuthService] Apply verification failed:', error);
      if (error?.code === 'auth/expired-action-code') {
        throw new Error('Verification link has expired');
      } else if (error?.code === 'auth/invalid-action-code') {
        throw new Error('Invalid or already used verification link');
      }
      throw error;
    }
  }

  /** Logs out the current user and updates their status in Firestore */
  async logout(): Promise<void> {
    const user = this.auth.currentUser;

    // Invalidate session validation
    this.sessionValidation.invalidateSession();

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
        const updatedDevices = Array.isArray(userData['device'])
          ? userData['device'].filter(
              (device: any) =>
                !(
                  device.platform === currentDevice.platform &&
                  device.version === currentDevice.version
                )
            )
          : [];

        // Update user status in Firestore
        await updateDoc(ref, {
          isLoggedIn: false,
          device: updatedDevices,
          updatedAt: serverTimestamp(),
        });
      } else {
        // If user doc doesn't exist, just update logout status
        await updateDoc(ref, {
          isLoggedIn: false,
          updatedAt: serverTimestamp(),
        });
      }
    }
    // Sign out from Firebase Auth
    return signOut(this.auth);
  }

  /** Logout from all devices by clearing device array and updating loggedInTime */
  async logoutAllDevices(uid: string): Promise<void> {
    try {
      // Clear all device tokens and update login time
      const userDocRef = doc(this.db, 'users', uid);
      await updateDoc(userDocRef, {
        device: [], // Clear all devices
        loggedInTime: serverTimestamp(), // Update login time to invalidate other sessions
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error('[AuthService] Error logging out from all devices:', error);
      throw error;
    }
  }

  // =========================
  // Account Deletion & Reactivation
  // =========================

  /**
   * Request account deletion with 30-day grace period
   * Sets deleteAccount flag and future deletion date
   * Logs out user from all devices
   */
  async requestAccountDeletion(uid: string, reason?: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30); // 30 days grace period

      await updateDoc(userDocRef, {
        deleteAccount: true,
        deleteAccountDate: Timestamp.fromDate(deletionDate),
        deletionReason: reason || '',
        updatedAt: serverTimestamp(),
      });

      // Logout from all devices
      await this.logoutAllDevices(uid);

      console.log('[AuthService] Account deletion requested for uid:', uid, 'Deletion date:', deletionDate);
    } catch (error) {
      console.error('[AuthService] Error requesting account deletion:', error);
      throw error;
    }
  }

  /**
   * Reactivate account by removing deletion flags
   * Allows user to recover their account during grace period
   */
  async reactivateAccount(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);

      await updateDoc(userDocRef, {
        deleteAccount: deleteField(),
        deleteAccountDate: deleteField(),
        deletionReason: deleteField(),
        updatedAt: serverTimestamp(),
      });

      console.log('[AuthService] Account reactivated for uid:', uid);
    } catch (error) {
      console.error('[AuthService] Error reactivating account:', error);
      throw error;
    }
  }

  /**
   * Check account status to determine if user can access the app
   * @returns 'active' | 'pending_deletion' | 'deleted'
   */
  async checkAccountStatus(uid: string): Promise<'active' | 'pending_deletion' | 'deleted'> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return 'deleted';
      }

      const data = userDoc.data() as UserDoc;

      if (data.deleteAccount) {
        const deletionDate = data.deleteAccountDate?.toDate?.();
        if (deletionDate && deletionDate < new Date()) {
          return 'deleted'; // Grace period expired
        }
        return 'pending_deletion';
      }

      return 'active';
    } catch (error) {
      console.error('[AuthService] Error checking account status:', error);
      return 'active'; // Default to active on error to avoid blocking legitimate users
    }
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
    productionHouse?: string; // For producer onboarding
    isPhoneVerified?: boolean; // Whether phone was verified via OTP
  }): Promise<User> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user found for onboarding');

    // If password is provided, link email/password to this provider account
    // This avoids creating a separate account and fixes auth/email-already-in-use
    if (params.password && params.email) {
      try {
        const cred = EmailAuthProvider.credential(
          params.email,
          params.password
        );
        await linkWithCredential(user, cred);
      } catch (err: any) {
        // If it's already linked or email already in use by this user, ignore
        if (
          err?.code !== 'auth/provider-already-linked' &&
          err?.code !== 'auth/credential-already-in-use' &&
          err?.code !== 'auth/email-already-in-use'
        ) {
          throw err;
        }
      }
    }

    // Store session start BEFORE creating user document to prevent race condition
    this.sessionValidation.initializeSession(user.uid);

    // Create user document in users collection
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
      isPhoneVerified: params.isPhoneVerified ?? !!user.phoneNumber,
      blocked: [],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      // ghost and deleteAccount will be set during those specific operations
    };

    await setDoc(ref, userDoc, { merge: true } as any);

    // Create role-specific profile document
    if (params.role === 'actor') {
      await this.createActorProfile(user.uid, {
        stageName: params.name,
        location: params.location,
      });
    } else if (params.role === 'producer') {
      await this.createProducerProfile(user.uid, {
        name: params.name,
        location: params.location,
        productionHouse: params.productionHouse,
      });
    }

    // Mark user as onboarded in cache
    this.onboardingCache.markAsOnboarded(user.uid);

    return user;
  }
}
