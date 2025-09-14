import { inject, Injectable } from '@angular/core';
import { collection, Firestore, query, where } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { collectionData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProducersService {
  private db = inject(Firestore);
  constructor() { }


  getAllProducers(): Observable<UserDoc[]> {
      const ref = collection(this.db, 'users');
      const queryAll = query(ref, where('role', '==', 'producer'));
      return collectionData(queryAll, { idField: 'uid' }) as Observable<UserDoc[]>;
    }
}
