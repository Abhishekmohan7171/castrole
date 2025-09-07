import { Injectable, inject } from '@angular/core';
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
    await setDoc(ref, {
      uid: cred.user.uid,
      name: name || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || 'user',
      isLoggedIn: true,
      device: 'web',
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
    await setDoc(ref, { 
      updatedAt: serverTimestamp(),
      isLoggedIn: true,
      LoggedInTime: serverTimestamp() 
    }, { merge: true } as any);
  }

  /** Returns the currently authenticated user (or null). */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
  
  /** Logs out the current user and updates their status in Firestore */
  async logout(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      // Update user status in Firestore
      const ref = doc(this.db, 'users', user.uid);
      await updateDoc(ref, { 
        isLoggedIn: false,
        LoggedOutTime: serverTimestamp() 
      });
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
    await setDoc(ref, {
      uid: user.uid,
      name: params.name || user.displayName || '',
      email: params.email || user.email || '',
      phone: params.phone || user.phoneNumber || '',
      location: params.location || '',
      role: params.role || 'user',
      isLoggedIn: true,
      device: 'web',
      LoggedInTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true } as any);

    return user;
  }
}
