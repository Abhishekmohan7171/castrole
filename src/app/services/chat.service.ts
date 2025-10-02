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
  where,
  increment,
  limit as firestoreLimit
} from '@angular/fire/firestore';
import { Observable, map, BehaviorSubject, of, shareReplay, tap, catchError, concatMap, delay } from 'rxjs';

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
  actorAccepted?: boolean;            // true when actor accepts the chat request
  actorRejected?: boolean;            // true when actor rejects the chat request

  // Unread counts - per user
  unreadCount?: Record<string, number>; // { userId: count }

  // Typing indicators
  typingUsers?: Record<string, Timestamp | null>; // { userId: timestamp or null }
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

  // Track typing state per room
  private typingState = new Map<string, BehaviorSubject<boolean>>();

  // Cache for messages and rooms
  private messagesCache = new Map<string, Observable<(ChatMessage & { id: string })[]>>();
  private roomsCache = new Map<string, Observable<(ChatRoom & { id: string })[]>>();
  private userRoomsCache = new Map<string, Observable<(ChatRoom & { id: string })[]>>();

  // Cache expiry time in milliseconds (5 minutes)
  private readonly CACHE_EXPIRY = 5 * 60 * 1000;

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
        unreadCount: {
          [actorId]: 0,
          [producerId]: 0
        },
        typingUsers: {
          [actorId]: null,
          [producerId]: null
        }
      } as Partial<ChatRoom>);
    }
    return roomId;
  }

  // Producer initiates chat by sending first message (optional)
  async producerStartChat(actorId: string, producerId: string, text?: string): Promise<string> {
    const roomId = await this.ensureRoom(actorId, producerId);
    
    // Only send a message if text is provided
    if (text) {
      await this.sendMessage({ roomId, senderId: producerId, receiverId: actorId, text });
    }
    
    return roomId;
  }

  // Send a message in a room
  async sendMessage({ roomId, senderId, receiverId, text }: { roomId: string; senderId: string; receiverId: string; text: string }): Promise<void> {
    const msgRef = collection(this.db, 'chatRooms', roomId, 'messages');
    const timestamp = serverTimestamp();
    const message = {
      chatRoomId: roomId,
      senderId,
      receiverId,
      text: text.trim(),
      timestamp,
      read: false,
      messageType: 'text',
    };
    const created = await addDoc(msgRef, message);

    // Reset typing indicator for sender
    this.setTypingState(roomId, senderId, false);

    const roomRef = doc(this.db, 'chatRooms', roomId);
    await updateDoc(roomRef, {
      lastMessage: { ...message, id: created.id },
      actorCanSee: true,
      updatedAt: serverTimestamp(),
      [`unreadCount.${receiverId}`]: increment(1)
    });

    // Clear cache for this room since we have new messages
    this.clearRoomCache(roomId);
  }

  // Observe rooms for a user by role (client-side sort by updatedAt desc)
  observeRoomsForUser(uid: string, role: UserRole): Observable<(ChatRoom & { id: string })[]> {
    const cacheKey = `rooms_${uid}_${role}`;

    // Check if we have a cached observable
    if (this.userRoomsCache.has(cacheKey)) {
      return this.userRoomsCache.get(cacheKey)!;
    }

    // Try to get initial data from localStorage
    const initialData = this.getCachedRooms(uid, role);

    // If not in cache, create the observable and cache it
    const roomsRef = collection(this.db, 'chatRooms');
    const baseQ = query(roomsRef, where('participants', 'array-contains', uid));
    const q$ = collectionData(baseQ, { idField: 'id' }) as Observable<(ChatRoom & { id: string })[]>;
    
    // For actors, filter rooms based on actorCanSee and actorAccepted
    const filtered$ = role === 'actor'
      ? q$.pipe(map(rooms => rooms.filter(r => r.actorCanSee && r.actorAccepted === true)))
      : q$;

    const result$ = filtered$.pipe(
      map(rooms => [...rooms].sort((a, b) => {
        const at = (a.updatedAt as any)?.toMillis?.() ?? 0;
        const bt = (b.updatedAt as any)?.toMillis?.() ?? 0;
        return bt - at;
      })),
      // Cache the result with shareReplay
      shareReplay(1),
      // Store data in localStorage for faster initial load
      tap(rooms => {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(rooms));
        } catch (e) {
          // Ignore storage errors
        }
      })
    );

    // Store in cache
    this.userRoomsCache.set(cacheKey, result$);

    // Set cache expiry
    setTimeout(() => {
      this.userRoomsCache.delete(cacheKey);
    }, this.CACHE_EXPIRY);

    // If we have initial data, return it immediately while the real data loads
    if (initialData && initialData.length > 0) {
      // Create a new observable that emits the cached data first, then switches to the real data
      return of(initialData).pipe(
        tap(() => {
          // Subscribe to the real data in the background to update the cache
          setTimeout(() => result$.subscribe(), 0);
        }),
        shareReplay(1)
      );
    }

    return result$;
  }

  // Get cached rooms from localStorage (for initial fast load)
  getCachedRooms(uid: string, role: UserRole): (ChatRoom & { id: string })[] | null {
    try {
      const cacheKey = `rooms_${uid}_${role}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Ignore storage errors
    }
    return null;
  }

  // Observe requests for an actor (producer-initiated threads)
  observeRequestsForActor(actorId: string): Observable<(ChatRoom & { id: string })[]> {
    const roomsRef = collection(this.db, 'chatRooms');
    const q = query(roomsRef, where('actorId', '==', actorId));
    const q$ = collectionData(q, { idField: 'id' }) as Observable<(ChatRoom & { id: string })[]>;

    return q$.pipe(
      // Filter for rooms that:
      // 1. Have messages not from the actor (producer initiated)
      // 2. Are not yet accepted by the actor
      // 3. Are not yet rejected by the actor
      map(rooms => rooms.filter(r => {
        return (r.lastMessage?.senderId ?? '') !== actorId && 
               r.actorCanSee === true && 
               r.actorAccepted !== true && 
               r.actorRejected !== true;
      })),
      map(rooms => [...rooms].sort((a, b) => {
        const at = (a.updatedAt as any)?.toMillis?.() ?? 0;
        const bt = (b.updatedAt as any)?.toMillis?.() ?? 0;
        return bt - at;
      })),
      shareReplay(1)
    );
  }

  // Mark all messages in a room as read for a specific user
  async markAllAsRead(roomId: string, userId: string): Promise<void> {
    // Get room reference
    const roomRef = doc(this.db, 'chatRooms', roomId);
    
    try {
      // Reset unread count for this user
      await updateDoc(roomRef, {
        [`unreadCount.${userId}`]: 0
      });
      
      // Update localStorage cache for both actor and producer roles
      // This ensures the notification badge is updated immediately
      this.updateLocalStorageCache(roomId, userId);
      
      // Clear in-memory cache to force a refresh
      const actorCacheKey = `rooms_${userId}_actor`;
      const producerCacheKey = `rooms_${userId}_producer`;
      this.userRoomsCache.delete(actorCacheKey);
      this.userRoomsCache.delete(producerCacheKey);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
  
  // Update localStorage cache to reflect read messages
  private updateLocalStorageCache(roomId: string, userId: string): void {
    try {
      // Update for both roles to ensure all caches are updated
      ['actor', 'producer'].forEach(role => {
        const cacheKey = `rooms_${userId}_${role}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          const rooms = JSON.parse(cachedData) as (ChatRoom & { id: string })[];
          const updatedRooms = rooms.map(room => {
            if (room.id === roomId && room.unreadCount) {
              // Create a new object to ensure reactivity
              return {
                ...room,
                unreadCount: {
                  ...room.unreadCount,
                  [userId]: 0
                }
              };
            }
            return room;
          });
          
          // Update localStorage
          localStorage.setItem(cacheKey, JSON.stringify(updatedRooms));
        }
      });
    } catch (e) {
      // Ignore storage errors
      console.warn('Error updating localStorage cache:', e);
    }
  }
  
  // Mark messages as read when opening a conversation
  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    try {
      await this.markAllAsRead(roomId, userId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Set typing state for a user in a room
  async setTypingState(roomId: string, userId: string, isTyping: boolean): Promise<void> {
    const roomRef = doc(this.db, 'chatRooms', roomId);
    await updateDoc(roomRef, {
      [`typingUsers.${userId}`]: isTyping ? serverTimestamp() : null
    });
  }

  // Observe if someone is typing in a room (excluding the specified user)
  observeTypingUsers(roomId: string, excludeUserId: string): Observable<string[]> {
    const roomRef = doc(this.db, 'chatRooms', roomId);
    return docData(roomRef).pipe(
      map(room => {
        if (!room || !room['typingUsers']) return [];

        const typingUsers: string[] = [];
        const now = Date.now();
        const expiryTime = 3000; // 3 seconds expiry for typing indicator

        Object.entries(room['typingUsers'] as Record<string, any>).forEach(([userId, timestamp]) => {
          if (userId !== excludeUserId && timestamp) {
            // Check if timestamp is recent (within last 3 seconds)
            const typingTime = (timestamp as any)?.toMillis?.();
            if (typingTime && (now - typingTime) < expiryTime) {
              typingUsers.push(userId);
            }
          }
        });

        return typingUsers;
      })
    );
  }

  // Create a debounced typing indicator that automatically expires
  createTypingIndicator(roomId: string, userId: string): (isTyping: boolean) => void {
    let timeout: any;

    return (isTyping: boolean) => {
      clearTimeout(timeout);

      if (isTyping) {
        this.setTypingState(roomId, userId, true);
        // Auto-expire after 3 seconds of no updates
        timeout = setTimeout(() => {
          this.setTypingState(roomId, userId, false);
        }, 3000);
      } else {
        this.setTypingState(roomId, userId, false);
      }
    };
  }

  // Get total unread count across all rooms for a user
  getTotalUnreadCount(uid: string, role: UserRole = 'actor'): Observable<number> {
    const roomsRef = collection(this.db, 'chatRooms');
    const q = query(roomsRef, where('participants', 'array-contains', uid));

    return collectionData(q, { idField: 'id' }).pipe(
      map(rooms => {
        // For actors, only count messages in accepted chats (not requests)
        const filteredRooms = role === 'actor' 
          ? rooms.filter((room: any) => room.actorAccepted === true)
          : rooms;
          
        return filteredRooms.reduce((total, room: any) => {
          const unreadCount = room.unreadCount?.[uid] || 0;
          return total + unreadCount;
        }, 0);
      }),
      shareReplay(1)
    );
  }
  
  // Get count of pending chat requests for an actor
  getChatRequestsCount(actorId: string): Observable<number> {
    return this.observeRequestsForActor(actorId).pipe(
      map(requests => requests.length),
      shareReplay(1)
    );
  }

  // Observe messages in a room ordered by timestamp with caching
  observeMessages(roomId: string, messageLimit = 50): Observable<(ChatMessage & { id: string })[]> {
    // Check if we have a cached observable
    if (this.messagesCache.has(roomId)) {
      return this.messagesCache.get(roomId)!;
    }
    
    // Try to get initial data from localStorage
    const initialData = this.getCachedMessages(roomId);
    
    // If not in cache, create the observable and cache it
    const msgsRef = collection(this.db, 'chatRooms', roomId, 'messages');
    const qMsgs = query(msgsRef, orderBy('timestamp', 'asc'), firestoreLimit(messageLimit));
    
    const result$ = collectionData(qMsgs, { idField: 'id' }).pipe(
      // Cache the result with shareReplay
      shareReplay(1),
      // Store data in localStorage for faster initial load
      tap((messages: any[]) => {
        try {
          localStorage.setItem(`messages_${roomId}`, JSON.stringify(messages));
        } catch (e) {
          // Ignore storage errors
        }
      }),
      catchError(err => {
        console.error('Error fetching messages:', err);
        // Try to return cached messages if available
        const cachedMessages = this.getCachedMessages(roomId);
        return cachedMessages ? of(cachedMessages) : of([]);
      })
    ) as Observable<(ChatMessage & { id: string })[]>;

    // Store in cache
    this.messagesCache.set(roomId, result$);

    // Set cache expiry
    setTimeout(() => {
      this.messagesCache.delete(roomId);
    }, this.CACHE_EXPIRY);

    // If we have initial data, return it immediately while the real data loads
    if (initialData && initialData.length > 0) {
      // Create a new observable that emits the cached data first, then switches to the real data
      return of(initialData).pipe(
        tap(() => {
          // Subscribe to the real data in the background to update the cache
          setTimeout(() => result$.subscribe(), 0);
        }),
        shareReplay(1)
      );
    }

    return result$;
  }

  // Get cached messages from localStorage (for initial fast load)
  getCachedMessages(roomId: string): (ChatMessage & { id: string })[] | null {
    try {
      const cached = localStorage.getItem(`messages_${roomId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Ignore storage errors
    }
    return null;
  }

  // Clear cache for a specific room (use when sending new messages)
  clearRoomCache(roomId: string): void {
    this.messagesCache.delete(roomId);
    try {
      localStorage.removeItem(`messages_${roomId}`);
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Accept a chat request (for actors)
  async acceptChatRequest(roomId: string, actorId: string): Promise<void> {
    const roomRef = doc(this.db, 'chatRooms', roomId);
    
    // Update the room to mark it as accepted
    await updateDoc(roomRef, {
      actorAccepted: true,
      updatedAt: serverTimestamp()
    });
    
    // Clear cache for this room
    this.clearRoomCache(roomId);
  }

  // Reject a chat request (for actors)
  async rejectChatRequest(roomId: string, actorId: string): Promise<void> {
    const roomRef = doc(this.db, 'chatRooms', roomId);
    
    // Update the room to mark it as rejected
    await updateDoc(roomRef, {
      actorRejected: true,
      updatedAt: serverTimestamp()
    });
    
    // Clear cache for this room
    this.clearRoomCache(roomId);
  }

  // Observe rejected chats for producers
  observeRejectedChatsForProducer(producerId: string): Observable<(ChatRoom & { id: string })[]> {
    const roomsRef = collection(this.db, 'chatRooms');
    const q = query(roomsRef, where('participants', 'array-contains', producerId));
    
    return collectionData(q, { idField: 'id' }).pipe(
      map(rooms => {
        // Filter for rooms that have been rejected by the actor
        return (rooms as (ChatRoom & { id: string })[]).filter(r => {
          return r.actorRejected === true;
        });
      }),
      shareReplay(1)
    );
  }
}
