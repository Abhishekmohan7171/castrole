import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

/**
 * Caches user onboarding status to minimize Firestore reads.
 * The cache is session-scoped and resets on auth state changes.
 */
@Injectable({ providedIn: 'root' })
export class UserOnboardingCacheService {
  private auth = inject(Auth);
  private db = inject(Firestore);

  // Cache: uid -> hasCompletedOnboarding
  private cache = signal<Map<string, boolean>>(new Map());

  constructor() {
    // Clear cache when auth state changes
    this.auth.onAuthStateChanged(() => {
      this.cache.set(new Map());
    });
  }

  /**
   * Checks if the user has completed onboarding (has a Firestore user document).
   * Result is cached per uid for the session.
   */
  async hasCompletedOnboarding(uid: string): Promise<boolean> {
    const cached = this.cache().get(uid);
    if (cached !== undefined) {
      return cached;
    }

    // Fetch from Firestore
    const userRef = doc(this.db, 'users', uid);
    const snapshot = await getDoc(userRef);
    const exists = snapshot.exists();

    // Cache the result
    this.cache.update(map => {
      const newMap = new Map(map);
      newMap.set(uid, exists);
      return newMap;
    });

    return exists;
  }

  /**
   * Manually mark a user as onboarded (call this after creating the user document).
   */
  markAsOnboarded(uid: string): void {
    this.cache.update(map => {
      const newMap = new Map(map);
      newMap.set(uid, true);
      return newMap;
    });
  }

  /**
   * Clear the cache for a specific user or all users.
   */
  clearCache(uid?: string): void {
    if (uid) {
      this.cache.update(map => {
        const newMap = new Map(map);
        newMap.delete(uid);
        return newMap;
      });
    } else {
      this.cache.set(new Map());
    }
  }
}
