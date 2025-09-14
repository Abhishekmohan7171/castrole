import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  docData,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export type UserRole = 'actor' | 'producer' | 'user';

export interface ChatRoom {
  id?: string;
  participants: string[];             // [actorId, producerId]
  actorId: string;
  producerId: string;
  createdBy: string;                  // producerId
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastMessage?: ChatMessage;
  actorCanSee: boolean;               // only true after producer sends first message
}

export interface ChatMessage {
  id?: string;
  chatRoomId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
  messageType: 'text' | 'image' | 'file';
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private db = inject(Firestore);
  private auth = inject(Auth);

  // Ensure a room exists (created by producer). Returns roomId
  async ensureRoom(actorId: string, producerId: string): Promise<string> {
    const participants = [actorId, producerId].sort();
    const roomId = participants.join('_');
    const roomRef = doc(this.db, 'chatRooms', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
      await setDoc(roomRef, {
        participants,
        actorId,
        producerId,
        createdBy: producerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        actorCanSee: false,
      } as Partial<ChatRoom>);
    }
    return roomId;
  }

  // Producer initiates chat by sending first message
  async producerStartChat(actorId: string, producerId: string, text: string): Promise<string> {
    const roomId = await this.ensureRoom(actorId, producerId);
    await this.sendMessage({ roomId, senderId: producerId, receiverId: actorId, text });
    return roomId;
  }

  // Send a message and update room lastMessage + actor visibility
  async sendMessage(params: { roomId: string; senderId: string; receiverId: string; text: string }): Promise<void> {
    const { roomId, senderId, receiverId, text } = params;
    if (!text.trim()) return;

    const msgRef = collection(this.db, 'chatRooms', roomId, 'messages');
    const timestamp = serverTimestamp() as unknown as Timestamp;
    const message: Partial<ChatMessage> = {
      chatRoomId: roomId,
      senderId,
      receiverId,
      text: text.trim(),
      timestamp,
      read: false,
      messageType: 'text',
    };
    const created = await addDoc(msgRef, message);

    const roomRef = doc(this.db, 'chatRooms', roomId);
    await updateDoc(roomRef, {
      lastMessage: { ...message, id: created.id },
      actorCanSee: true,
      updatedAt: serverTimestamp(),
    } as any);
  }

  // Observe rooms for a user by role (client-side sort by updatedAt desc)
  observeRoomsForUser(uid: string, role: UserRole): Observable<(ChatRoom & { id: string })[]> {
    const roomsRef = collection(this.db, 'chatRooms');
    const baseQ = query(roomsRef, where('participants', 'array-contains', uid));
    const q$ = collectionData(baseQ, { idField: 'id' }) as Observable<(ChatRoom & { id: string })[]>;
    const filtered$ = role === 'actor'
      ? q$.pipe(map(rooms => rooms.filter(r => r.actorCanSee)))
      : q$;
    return filtered$.pipe(
      map(rooms => [...rooms].sort((a, b) => {
        const at = (a.updatedAt as any)?.toMillis?.() ?? 0;
        const bt = (b.updatedAt as any)?.toMillis?.() ?? 0;
        return bt - at;
      }))
    );
  }

  // Observe "requests" for actors: rooms where actor can see, and the last message is from the producer (not the actor)
  observeRequestsForActor(uid: string): Observable<(ChatRoom & { id: string })[]> {
    const roomsRef = collection(this.db, 'chatRooms');
    const baseQ = query(roomsRef, where('actorId', '==', uid), where('actorCanSee', '==', true));
    const q$ = collectionData(baseQ, { idField: 'id' }) as Observable<(ChatRoom & { id: string })[]>;
    return q$.pipe(
      map(rooms => rooms.filter(r => (r.lastMessage?.senderId ?? '') !== uid)),
      map(rooms => [...rooms].sort((a, b) => {
        const at = (a.updatedAt as any)?.toMillis?.() ?? 0;
        const bt = (b.updatedAt as any)?.toMillis?.() ?? 0;
        return bt - at;
      }))
    );
  }

  // Observe messages in a room ordered by timestamp
  observeMessages(roomId: string): Observable<(ChatMessage & { id: string })[]> {
    const msgsRef = collection(this.db, 'chatRooms', roomId, 'messages');
    const qMsgs = query(msgsRef, orderBy('timestamp', 'asc'));
    return collectionData(qMsgs, { idField: 'id' }) as Observable<(ChatMessage & { id: string })[]>;
  }
}
