import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, docData, getDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserDoc } from '../../assets/interfaces/interfaces';

@Injectable({ providedIn: 'root' })
export class UserService {
  private auth = inject(Auth);
  private db = inject(Firestore);

  constructor() {}

  // Observable stream of the current user's Firestore document.
  // Emits null when unauthenticated.
  currentUserDoc$(): Observable<UserDoc | null> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (!user) return of(null);
        const ref = doc(this.db, 'users', user.uid);
        return docData(ref, { idField: 'uid' }) as Observable<UserDoc>;
      })
    );
  }

  // One-time fetch of the current user's Firestore document.
  // Returns null if unauthenticated or the document does not exist.
  async getCurrentUserDocOnce(): Promise<UserDoc | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    const ref = doc(this.db, 'users', user.uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserDoc) : null;
  }

  // Helper to get a user document (for names/roles)
  observeUser(uid: string): Observable<any> {
    const uref = doc(this.db, 'users', uid);
    return docData(uref, { idField: 'uid' });
  }
}
