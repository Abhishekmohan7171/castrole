import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  docData,
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserDoc, blockedDetails } from '../../assets/interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class BlockService {
  private firestore = inject(Firestore);

  /**
   * Block a user
   * @param userId The user who is blocking
   * @param blockedUserId The user being blocked
   * @param reason Optional reason for blocking
   */
  async blockUser(
    userId: string,
    blockedUserId: string,
    reason?: string
  ): Promise<void> {
    if (userId === blockedUserId) {
      console.warn('Cannot block yourself');
      return;
    }

    try {
      const userDocRef = doc(this.firestore, 'users', userId);

      // Create blocked details with Timestamp.now() instead of serverTimestamp()
      // because serverTimestamp() cannot be used inside arrayUnion()
      // Also, arrayUnion() doesn't accept undefined values, so only add reason if provided
      const blockedDetail: any = {
        blockedBy: blockedUserId,
        date: new Date(),
      };

      // Only add reason field if it's provided (arrayUnion doesn't accept undefined)
      if (reason) {
        blockedDetail.reason = reason;
      }

      // Add to blocked array
      await updateDoc(userDocRef, {
        blocked: arrayUnion(blockedDetail),
      });

      console.log(`✓ User ${blockedUserId} has been blocked`);
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   * @param userId The user who is unblocking
   * @param blockedUserId The user being unblocked
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error('User document not found');
        return;
      }

      const userData = userDoc.data() as UserDoc;
      const blocked = userData.blocked || [];

      // Find and remove the blocked entry
      const updatedBlocked = blocked.filter(
        (b) => b.blockedBy !== blockedUserId
      );

      await updateDoc(userDocRef, {
        blocked: updatedBlocked,
      });

      console.log(`✓ User ${blockedUserId} has been unblocked`);
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  /**
   * Check if a user is blocked
   * @param userId The user checking
   * @param checkUserId The user to check if blocked
   * @returns Observable<boolean> true if blocked
   */
  isUserBlocked(userId: string, checkUserId: string): Observable<boolean> {
    const userDocRef = doc(this.firestore, 'users', userId);
    return docData(userDocRef).pipe(
      map((userData) => {
        if (!userData) return false;
        const user = userData as UserDoc;
        const blocked = user.blocked || [];
        return blocked.some((b) => b.blockedBy === checkUserId);
      }),
      catchError((error) => {
        console.error('Error checking if user is blocked:', error);
        return of(false);
      })
    );
  }

  /**
   * Check if a user is blocked (async/promise version)
   * @param userId The user checking
   * @param checkUserId The user to check if blocked
   * @returns Promise<boolean> true if blocked
   */
  async isUserBlockedAsync(
    userId: string,
    checkUserId: string
  ): Promise<boolean> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) return false;

      const userData = userDoc.data() as UserDoc;
      const blocked = userData.blocked || [];
      return blocked.some((b) => b.blockedBy === checkUserId);
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }

  /**
   * Get list of blocked user IDs
   * @param userId The user's ID
   * @returns Observable<string[]> Array of blocked user IDs
   */
  getBlockedUserIds(userId: string): Observable<string[]> {
    const userDocRef = doc(this.firestore, 'users', userId);
    return docData(userDocRef).pipe(
      map((userData) => {
        if (!userData) return [];
        const user = userData as UserDoc;
        const blocked = user.blocked || [];
        return blocked.map((b) => b.blockedBy);
      }),
      catchError((error) => {
        console.error('Error fetching blocked user IDs:', error);
        return of([]);
      })
    );
  }

  /**
   * Check if either user has blocked the other (bidirectional check)
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Promise<boolean> true if either has blocked the other
   */
  async isBlockedBidirectional(
    userId1: string,
    userId2: string
  ): Promise<boolean> {
    const user1BlockedUser2 = await this.isUserBlockedAsync(userId1, userId2);
    const user2BlockedUser1 = await this.isUserBlockedAsync(userId2, userId1);
    return user1BlockedUser2 || user2BlockedUser1;
  }

  /**
   * Can two users interact (neither has blocked the other)
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Promise<boolean> true if they can interact
   */
  async canUsersInteract(userId1: string, userId2: string): Promise<boolean> {
    const isBlocked = await this.isBlockedBidirectional(userId1, userId2);
    return !isBlocked;
  }
}
