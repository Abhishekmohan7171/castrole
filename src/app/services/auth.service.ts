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
  signInWithPhoneNumber,
  linkWithPhoneNumber,
} from '@angular/fire/auth';
import { RecaptchaVerifier } from 'firebase/auth';
// Try to import Enterprise verifier if available in SDK; fall back at runtime if not
let RecaptchaEnterpriseVerifierRef: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RecaptchaEnterpriseVerifierRef = (require('firebase/auth') as any).RecaptchaEnterpriseVerifier;
} catch {}
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

  // Keep latest confirmation for OTP across components if needed
  private lastPhoneConfirmation?: ConfirmationResult;
  private lastPhoneDisplay?: string;

  // Maintain a single RecaptchaVerifier instance per page
  private recaptcha?: any;

  // =========================
  // Email/Password, Google, Apple Auth
  // =========================

  // =========================
  // Phone verification (OTP)
  // =========================
  /** Start phone verification or link phone to current user. phoneE164: +<country><number> */
  async startPhoneVerification(phoneE164: string, containerId: string = 'recaptcha-container', phoneDisplay?: string): Promise<ConfirmationResult> {
    // Clear any previous widget bound to a different container to avoid captcha-check-failed
    try { await this.recaptcha?.clear?.(); } catch {}

    // Prefer Enterprise verifier when available (project may have Enterprise enabled)
    const VerifierCtor: any = RecaptchaEnterpriseVerifierRef || RecaptchaVerifier as any;
    this.recaptcha = new VerifierCtor(this.auth, containerId, { size: 'invisible' } as any);

    // Ensure the widget is created and execute invisible challenge where supported
    await (this.recaptcha.render?.() ?? Promise.resolve());
    try {
      if (typeof this.recaptcha.verify === 'function') {
        await this.recaptcha.verify();
      }
    } catch (err) {
      const e: any = err || {};
      // Fallback to visible widget when captcha blocked or requires interaction
      if (e?.code === 'auth/captcha-check-failed' || e?.message?.toLowerCase?.().includes('captcha')) {
        try { await this.recaptcha.clear?.(); } catch {}
        this.recaptcha = new VerifierCtor(this.auth, containerId, { size: 'normal' } as any);
        await (this.recaptcha.render?.() ?? Promise.resolve());
        const friendly = new Error('Captcha blocked. Please complete the captcha below, then tap Verify again.');
        (friendly as any).code = 'auth/captcha-visible-required';
        throw friendly;
      }
      throw err;
    }

    const user = this.auth.currentUser;
    let confirmation: ConfirmationResult;
    if (user) {
      confirmation = await linkWithPhoneNumber(user, phoneE164, this.recaptcha);
    } else {
      confirmation = await signInWithPhoneNumber(this.auth, phoneE164, this.recaptcha);
    }
    this.lastPhoneConfirmation = confirmation;
    this.lastPhoneDisplay = phoneDisplay;
    return confirmation;
  }

  getLastPhoneConfirmation(): ConfirmationResult | undefined { return this.lastPhoneConfirmation; }
  getLastPhoneDisplay(): string | undefined { return this.lastPhoneDisplay; }

  /** Confirm OTP and persist verification flag. Optionally persist display phone (e.g., +91-9xxxxxxxxx). */
  async confirmPhoneVerification(confirmation: ConfirmationResult, otp: string, phoneDisplay?: string): Promise<User> {
    const cred = await confirmation.confirm(otp);
    const ref = doc(this.db, 'users', cred.user.uid);
    await setDoc(ref, {
      uid: cred.user.uid,
      phone: phoneDisplay ?? cred.user.phoneNumber ?? '',
      isPhoneVerified: true,
      phoneVerified: true,
      updatedAt: serverTimestamp(),
    }, { merge: true } as any);
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
      role: ('' as any) as UserRole,
      emailVerified: user.emailVerified || false,
      phoneVerified: !!user.phoneNumber,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, { ...base }, { merge: true } as any);
  }

  // --- Google ---
  async signInWithGoogle(): Promise<{ user: User; exists: boolean }> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    const ref = doc(this.db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    return { user: cred.user, exists: snap.exists() };
  }

  async linkGoogle(): Promise<User> {
    if (!this.auth.currentUser) throw new Error('No authenticated user to link Google for');
    const provider = new GoogleAuthProvider();
    const cred = await linkWithPopup(this.auth.currentUser, provider);
    await this.upsertFromProvider(cred.user);
    return cred.user;
  }

  // --- Apple ---
  async signInWithApple(): Promise<{ user: User; exists: boolean }> {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    const cred = await signInWithPopup(this.auth, provider);
    const ref = doc(this.db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    return { user: cred.user, exists: snap.exists() };
  }

  async linkApple(): Promise<User> {
    if (!this.auth.currentUser) throw new Error('No authenticated user to link Apple for');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    const cred = await linkWithPopup(this.auth.currentUser, provider);
    await this.upsertFromProvider(cred.user);
    return cred.user;
  }

  // --- Email/Password ---
  async registerWithEmail(params: { name: string; email: string; password: string; phone: string; location: string; role: string; }): Promise<User> {
    const { name, email, password, phone, location, role } = params;
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    try { await updateProfile(cred.user, { displayName: name }); } catch {}
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

  async loginWithEmail(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    await this.updateLoginTimestamp(cred.user.uid);
    return cred.user;
  }

  async updateLoginTimestamp(uid: string): Promise<void> {
    const ref = doc(this.db, 'users', uid);
    await setDoc(ref, { updatedAt: serverTimestamp(), isLoggedIn: true, LoggedInTime: serverTimestamp() }, { merge: true } as any);
  }

  getCurrentUser(): User | null { return this.auth.currentUser; }

  async logout(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      const ref = doc(this.db, 'users', user.uid);
      await updateDoc(ref, { isLoggedIn: false, LoggedOutTime: serverTimestamp() });
    }
    return signOut(this.auth);
  }

  async onboardProviderUser(params: { name: string; email: string; password?: string; phone: string; location: string; role: string; }): Promise<User> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user found for onboarding');

    if (params.password && params.email) {
      try {
        const cred = EmailAuthProvider.credential(params.email, params.password);
        await linkWithCredential(user, cred);
      } catch (err: any) {
        if (err?.code !== 'auth/provider-already-linked' && err?.code !== 'auth/credential-already-in-use' && err?.code !== 'auth/email-already-in-use') {
          throw err;
        }
      }
    }

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
