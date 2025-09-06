import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  linkWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, updateDoc, serverTimestamp, getDoc } from '@angular/fire/firestore';
import type { ConfirmationResult } from 'firebase/auth';

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

  // We keep a reference so we can reuse between steps in a single page
  private recaptcha?: RecaptchaVerifier;

  /**
   * Initializes an invisible reCAPTCHA verifier if not already created.
   * Place a <div id="recaptcha-container"></div> in the template, or pass a custom container ID.
   */
  initRecaptcha(containerId: string = 'recaptcha-container', size: 'invisible' | 'normal' = 'invisible'): RecaptchaVerifier {
    if (this.recaptcha) return this.recaptcha;
    // Create at call time to avoid SSR issues with window/document
    this.recaptcha = new RecaptchaVerifier(this.auth, containerId, { size });
    return this.recaptcha;
  }

  // =========================
  // B. Passwordless Email Link
  // =========================

  /**
   * Starts passwordless signup by sending a magic link to the provided email.
   * The link will return to `${origin}${returnPath}` where you should call completeEmailLinkSignup.
   */
  async startEmailLinkSignup(email: string, returnPath: string = '/onboarding/complete'): Promise<void> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const actionCodeSettings = { url: origin + returnPath, handleCodeInApp: true } as const;
    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', email);
    }
  }

  /**
   * Completes the email link sign-in. Creates the user account if new, signs in if existing.
   * Also writes the basic profile to Firestore.
   */
  async completeEmailLinkSignup(linkHref: string, profile: ProfileBase): Promise<User | null> {
    if (!isSignInWithEmailLink(this.auth, linkHref)) return null;
    const email = (typeof window !== 'undefined') ? window.localStorage.getItem('emailForSignIn') || profile.email : profile.email;
    const cred = await signInWithEmailLink(this.auth, email, linkHref);

    // Set display name
    await updateProfile(cred.user, { displayName: profile.name });

    // Upsert profile document
    const ref = doc(this.db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { ...profile, emailVerified: true });
    } else {
      await setDoc(ref, { ...profile, emailVerified: true, createdAt: serverTimestamp() });
    }

    return cred.user;
  }

  /**
   * Begins linking a phone number to the currently signed-in user.
   * Returns a ConfirmationResult to be confirmed with the OTP code.
   */
  async startLinkPhone(phone: string, containerId: string = 'recaptcha-container'): Promise<ConfirmationResult> {
    if (!this.auth.currentUser) throw new Error('No authenticated user to link phone for');
    const verifier = this.initRecaptcha(containerId);
    return linkWithPhoneNumber(this.auth.currentUser, phone, verifier);
  }

  /**
   * Confirms the OTP to finish linking the phone number.
   * Optionally updates the user profile document with the mobile number if provided.
   */
  async confirmLinkPhone(confirmation: ConfirmationResult, otp: string, mobile?: string): Promise<User> {
    const cred = await confirmation.confirm(otp);
    if (mobile) {
      const ref = doc(this.db, 'users', cred.user.uid);
      await updateDoc(ref, { mobile, phoneVerified: true });
    }
    return cred.user;
  }

  // =========================
  // C. Phone OTP as primary, then link Email via magic link
  // =========================

  /**
   * Starts phone-based signup. Returns a ConfirmationResult; call confirmPhoneSignup with the OTP.
   */
  async startPhoneSignup(phone: string, containerId: string = 'recaptcha-container'): Promise<ConfirmationResult> {
    const verifier = this.initRecaptcha(containerId);
    return signInWithPhoneNumber(this.auth, phone, verifier);
  }

  /**
   * Confirms the phone OTP and writes the base profile. Use sendEmailLinkToLinkAccount next to verify/link the email.
   */
  async confirmPhoneSignup(confirmation: ConfirmationResult, otp: string, profile: Omit<ProfileBase, 'email'> & { email?: string }): Promise<User> {
    const cred = await confirmation.confirm(otp);
    await updateProfile(cred.user, { displayName: profile.name });

    const ref = doc(this.db, 'users', cred.user.uid);
    await setDoc(ref, {
      uid: cred.user.uid,
      name: profile.name,
      email: profile.email ?? '',
      phone: (profile as any).mobile ?? '',
      location: profile.location,
      role: profile.role,
      phoneVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true } as any);
    return cred.user;
  }

  /**
   * Sends an email link to link an email to the currently signed-in (phone) user.
   */
  async sendEmailLinkToLinkAccount(email: string, returnPath: string = '/onboarding/link-email'): Promise<void> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const actionCodeSettings = { url: origin + returnPath, handleCodeInApp: true } as const;
    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForLinking', email);
    }
  }

  /**
   * Completes linking of the email using the magic link on the current user (who signed up with phone).
   */
  async completeEmailLinking(linkHref: string): Promise<User | null> {
    const user = this.auth.currentUser;
    if (!user || !isSignInWithEmailLink(this.auth, linkHref)) return null;
    const email = (typeof window !== 'undefined') ? window.localStorage.getItem('emailForLinking') || '' : '';
    if (!email) throw new Error('Missing stored email for linking');
    const credential = EmailAuthProvider.credentialWithLink(email, linkHref);
    const cred = await linkWithCredential(user, credential);

    // Update Firestore doc with email & verified flag
    const ref = doc(this.db, 'users', user.uid);
    await updateDoc(ref, { email, emailVerified: true });

    return cred.user;
  }

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

  /** Sign in with Google using a popup. */
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    await this.upsertFromProvider(cred.user);
    return cred.user;
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

  /** Sign in with Apple using a popup. */
  async signInWithApple(): Promise<User> {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    const cred = await signInWithPopup(this.auth, provider);
    await this.upsertFromProvider(cred.user);
    return cred.user;
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
    const ref = doc(this.db, 'users', cred.user.uid);
    await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true } as any);
    return cred.user;
  }
}
