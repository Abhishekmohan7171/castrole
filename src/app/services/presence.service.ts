import { Injectable, inject } from '@angular/core';
import { Firestore, doc, updateDoc, serverTimestamp, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, fromEvent, merge } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private firestore = inject(Firestore);
  private presenceInterval?: any;
  private currentUserId?: string;
  private unsubscribeSnapshot?: Unsubscribe;

  // Track if user is actively using the app
  private isActive$ = new BehaviorSubject<boolean>(true);

  constructor() {
    // Only run in browser
    if (typeof window !== 'undefined') {
      this.setupActivityTracking();
    }
  }

  /**
   * Start tracking presence for a user
   * Call this after user logs in
   */
  startTracking(userId: string): void {
    if (!userId) return;
    
    this.currentUserId = userId;
    this.setOnline(userId);

    // Update presence every 2 minutes while active
    this.presenceInterval = setInterval(() => {
      if (this.isActive$.value) {
        this.updatePresence(userId);
      }
    }, 120000); // 2 minutes

    // Set offline when user closes tab/browser
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.setOffline(userId));
    }
  }

  /**
   * Stop tracking presence
   * Call this when user logs out
   */
  stopTracking(): void {
    if (this.currentUserId) {
      this.setOffline(this.currentUserId);
    }
    
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = undefined;
    }

    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = undefined;
    }

    this.currentUserId = undefined;
  }

  /**
   * Set user as online
   */
  private async setOnline(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        presenceUpdatedAt: serverTimestamp()
      });
    } catch (error) {
      // Silently handle error - presence is not critical
    }
  }

  /**
   * Set user as offline
   */
  private async setOffline(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
        presenceUpdatedAt: serverTimestamp()
      });
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Update presence timestamp
   */
  private async updatePresence(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
        presenceUpdatedAt: serverTimestamp()
      });
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Setup activity tracking based on user interactions
   */
  private setupActivityTracking(): void {
    // Track mouse movement, keyboard, touch events
    const activity$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll')
    ).pipe(
      debounceTime(1000), // Debounce to avoid too many updates
      map(() => true)
    );

    // Track visibility changes (tab switching)
    const visibility$ = fromEvent(document, 'visibilitychange').pipe(
      map(() => !document.hidden)
    );

    // Combine activity and visibility
    merge(activity$, visibility$).subscribe(isActive => {
      this.isActive$.next(isActive);
      
      // Update presence immediately when user becomes active
      if (isActive && this.currentUserId) {
        this.updatePresence(this.currentUserId);
      }
    });
  }

  /**
   * Observe online status of a user
   * Returns Observable that emits true if user is truly online (active within 1 minute)
   */
  observeUserOnlineStatus(userId: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const userRef = doc(this.firestore, `users/${userId}`);
      
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const isOnline = data['isOnline'] || false;
          const lastSeen = data['lastSeen'];
          
          // Consider user online (green dot) ONLY if:
          // 1. isOnline flag is true AND lastSeen is within 1 minute
          if (isOnline && lastSeen) {
            const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
            observer.next(lastSeenDate > oneMinuteAgo);
          } else {
            observer.next(false);
          }
        } else {
          observer.next(false);
        }
      }, (error) => {
        observer.next(false);
      });

      return () => unsubscribe();
    }).pipe(
      distinctUntilChanged() // Only emit when status actually changes
    );
  }

  /**
   * Get last seen time for a user
   */
  getLastSeenTime(userId: string): Observable<Date | null> {
    return new Observable<Date | null>(observer => {
      const userRef = doc(this.firestore, `users/${userId}`);
      
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const lastSeen = data['lastSeen'];
          
          if (lastSeen) {
            const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
            observer.next(lastSeenDate);
          } else {
            observer.next(null);
          }
        } else {
          observer.next(null);
        }
      }, (error) => {
        observer.next(null);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Format last seen time for display with granular statuses
   * Note: This should be called with the actual online status check
   */
  formatLastSeen(lastSeenDate: Date | null, isOnline: boolean = false): string {
    if (!lastSeenDate) return 'last seen long time ago';

    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Only show "online" if explicitly marked as online
    if (isOnline && diffMins < 1) return 'online';
    
    // Otherwise show last seen status
    if (diffMins < 2) return 'last seen now';
    if (diffMins < 5) return 'last seen few moments ago';
    if (diffMins < 60) return `last seen ${diffMins}m ago`;
    if (diffHours < 24) return `last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'last seen yesterday';
    if (diffDays < 7) return `last seen ${diffDays}d ago`;
    return 'last seen long time ago';
  }
}
