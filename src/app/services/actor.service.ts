import { inject, Injectable } from '@angular/core';
import { Firestore, doc, setDoc, updateDoc, serverTimestamp, getDoc, collection, query, where, getDocs, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { UserDoc } from '../../assets/interfaces/interfaces';


@Injectable({
  providedIn: 'root'
})
export class ActorService {
  private db = inject(Firestore);
  constructor() { }

  getAllActors(): Observable<UserDoc[]> {
    const ref = collection(this.db, 'users');
    const queryAll = query(ref, where('role', '==', 'actor'));
    return collectionData(queryAll, { idField: 'uid' }) as Observable<UserDoc[]>;
  }
}
