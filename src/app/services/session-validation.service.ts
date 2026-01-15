import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, doc, onSnapshot, Unsubscribe, getDoc } from '@angular/fire/firestore';
import { Auth, signOut } from '@angular/fire/auth';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class SessionValidationService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private toastService = inject(ToastService);

  private readonly SESSION_START_KEY = 'castrole_session_start';
  private readonly BROADCAST_CHANNEL_NAME = 'castrole-session';

  private sessionListener: Unsubscribe | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isValidatingSession = signal(false);

  constructor() {
    this.initializeBroadcastChannel();
  }

  /**
   * Initialize BroadcastChannel for cross-tab communication
   */
  private initializeBroadcastChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(this.BROADCAST_CHANNEL_NAME);

      this.broadcastChannel.onmessage = async (event) => {
        if (event.data === 'session-invalidated') {
          console.log('[SessionValidation] Received session invalidation from another tab');
          await this.performLogout();
        }
      };
    }
  }

  /**
   * Initialize session after successful login
   * Stores session start time and sets up Firestore listener
   */
  initializeSession(uid: string): void {
    if (typeof window === 'undefined') return;

    // Store session start time in localStorage
    const sessionStartTime = Date.now();
    localStorage.setItem(this.SESSION_START_KEY, sessionStartTime.toString());

    console.log('[SessionValidation] Session initialized for user:', uid);

    // Set up Firestore listener for session invalidation
    this.setupSessionListener(uid);
  }

  /**
   * Set up Firestore listener to monitor loggedInTime changes
   */
  private setupSessionListener(uid: string): void {
    // Clean up existing listener if any
    this.cleanupSessionListener();

    const userDocRef = doc(this.firestore, 'users', uid);

    this.sessionListener = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          console.warn('[SessionValidation] User document does not exist');
          return;
        }

        const userData = snapshot.data() as UserDoc;

        // Check if session has been invalidated
        await this.checkSessionValidity(userData);
      },
      (error) => {
        console.error('[SessionValidation] Error listening to user document:', error);
        // Fallback: session validation will happen on navigation via guard
      }
    );
  }

  /**
   * Check if current session is still valid
   */
  private async checkSessionValidity(userData: UserDoc): Promise<void> {
    if (this.isValidatingSession()) return; // Prevent concurrent validation

    const sessionStartTime = this.getSessionStartTime();
    if (!sessionStartTime) {
      console.warn('[SessionValidation] No session start time found');
      return;
    }

    // Get the server's loggedInTime as a timestamp
    const serverLoggedInTime = userData.loggedInTime?.toMillis?.() || 0;

    // Add 10 second grace period to account for server/client time differences and fresh login timing
    const GRACE_PERIOD_MS = 10000; // 10 seconds

    // Calculate how long this session has been active
    const currentTime = Date.now();
    const sessionAge = currentTime - sessionStartTime;

    // Skip validation for very new sessions (< 30 seconds) to avoid false positives during registration
    if (sessionAge < 30000) {
      console.log('[SessionValidation] Session is very recent, skipping validation to allow registration to complete');
      return;
    }

    // If server's loggedInTime is newer than our session start (with grace period), we've been logged out
    if (serverLoggedInTime > sessionStartTime + GRACE_PERIOD_MS) {
      console.log('[SessionValidation] Session invalidated. Server time:', new Date(serverLoggedInTime), 'Session start:', new Date(sessionStartTime));
      await this.autoLogout();
    }
  }

  /**
   * Validate session manually (used by guard)
   * Returns true if session is valid, false if invalidated
   */
  async validateSession(uid: string): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    const sessionStartTime = this.getSessionStartTime();

    // No session start time means invalid session
    if (!sessionStartTime) {
      console.warn('[SessionValidation] No session start time found during validation');
      return false;
    }

    try {
      // Fetch user document from Firestore
      const userDocRef = doc(this.firestore, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Document doesn't exist yet - this could be a fresh registration where the
        // auth state changed before the document was created. Check if session is very recent.
        const currentTime = Date.now();
        const timeSinceSessionStart = currentTime - sessionStartTime;

        // If session was created within the last 30 seconds, treat as valid (fresh registration)
        if (timeSinceSessionStart < 30000) {
          console.log('[SessionValidation] User document does not exist yet, but session is recent. Treating as valid (fresh registration).');
          return true;
        }

        console.warn('[SessionValidation] User document does not exist and session is not recent');
        return false;
      }

      const userData = userDocSnap.data() as UserDoc;
      const serverLoggedInTime = userData.loggedInTime?.toMillis?.() || 0;

      // Add 10 second grace period to account for server/client time differences and fresh login timing
      const GRACE_PERIOD_MS = 10000; // 10 seconds

      // Session is valid if our session start time (with grace period) is >= server's loggedInTime
      const isValid = sessionStartTime + GRACE_PERIOD_MS >= serverLoggedInTime;

      if (!isValid) {
        console.log('[SessionValidation] Session validation failed. Server time:', new Date(serverLoggedInTime), 'Session start:', new Date(sessionStartTime));
      }

      return isValid;
    } catch (error) {
      console.error('[SessionValidation] Error validating session:', error);
      // On error, assume session is valid to avoid false logouts
      return true;
    }
  }

  /**
   * Get session start time from localStorage
   */
  private getSessionStartTime(): number | null {
    if (typeof window === 'undefined') return null;

    const storedTime = localStorage.getItem(this.SESSION_START_KEY);
    return storedTime ? parseInt(storedTime, 10) : null;
  }

  /**
   * Check if there's an existing session (before auth state initialized it)
   * Used to distinguish fresh logins from existing sessions on app load
   */
  hasExistingSession(): boolean {
    if (typeof window === 'undefined') return false;
    const sessionStart = localStorage.getItem(this.SESSION_START_KEY);
    return sessionStart !== null;
  }

  /**
   * Invalidate current session and clean up
   */
  invalidateSession(): void {
    if (typeof window === 'undefined') return;

    console.log('[SessionValidation] Invalidating session');

    // Clear session start time from localStorage
    localStorage.removeItem(this.SESSION_START_KEY);

    // Clean up Firestore listener
    this.cleanupSessionListener();
  }

  /**
   * Clean up Firestore listener
   */
  private cleanupSessionListener(): void {
    if (this.sessionListener) {
      this.sessionListener();
      this.sessionListener = null;
    }
  }

  /**
   * Auto-logout when session is invalidated
   */
  async autoLogout(): Promise<void> {
    if (this.isValidatingSession()) return; // Prevent concurrent logout

    this.isValidatingSession.set(true);

    console.log('[SessionValidation] Auto-logout triggered');

    try {
      // Broadcast to all tabs to logout
      this.broadcastLogout();

      // Perform logout
      await this.performLogout();
    } finally {
      this.isValidatingSession.set(false);
    }
  }

  /**
   * Broadcast logout message to all tabs
   */
  private broadcastLogout(): void {
    try {
      this.broadcastChannel?.postMessage('session-invalidated');
    } catch (error) {
      console.error('[SessionValidation] Error broadcasting logout:', error);
    }
  }

  /**
   * Perform the actual logout process
   */
  private async performLogout(): Promise<void> {
    console.log('[SessionValidation] Performing logout');

    // Show toast notification to user
    this.toastService.warning('You have been logged out from another device', 4000);

    // Invalidate local session
    this.invalidateSession();

    // Wait a moment for user to see the notification
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Sign out from Firebase Auth
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('[SessionValidation] Error signing out:', error);
    }

    // Redirect to login with reason
    this.router.navigate(['/auth/login'], {
      queryParams: { reason: 'session-expired' }
    });
  }

  /**
   * Clean up on service destroy
   */
  ngOnDestroy(): void {
    this.cleanupSessionListener();
    this.broadcastChannel?.close();
  }
}
