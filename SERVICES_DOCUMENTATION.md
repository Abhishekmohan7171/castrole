# Castrole Services Documentation

Complete technical documentation for Authentication, Upload, and Chat services in the Castrole application.

---

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [Upload Service](#upload-service)
3. [Chat Service](#chat-service)
4. [Firestore Data Structure](#firestore-data-structure)
5. [Best Practices](#best-practices)

---

## Authentication Service

### Overview
The `AuthService` manages user authentication, profile management, and session tracking. It supports email/password, Google, and Apple authentication methods.

### Firestore Collection
```
/users/{userId}
  - uid: string
  - name: string
  - email: string
  - phone: string (format: +91-9xxxxxxxxx)
  - location: string
  - currentRole: string ('actor' | 'producer' | 'user')
  - roles: string[] (array of all roles)
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - isLoggedIn: boolean
  - device: devices[]
  - loggedInTime: Timestamp
  - isPhoneVerified: boolean
  - blocked: blockedDetails[] (optional)
  - ghost: boolean (optional)
  - deleteAccount: boolean (optional)
  - deleteAccountDate: Timestamp (optional)
```

### Key Methods

#### **Email/Password Authentication**

**`registerWithEmail(params)`**
- Creates new user account with email and password
- Generates complete UserDoc with all required fields
- Sets initial role in both `currentRole` and `roles` array
- Tracks device information and login state
- Returns: `Promise<User>`

```typescript
await authService.registerWithEmail({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  phone: '+91-9876543210',
  location: 'Mumbai',
  role: 'actor'
});
```

**`loginWithEmail(email, password)`**
- Authenticates user with email and password
- Updates login timestamp and device tracking
- Returns: `Promise<User>`

```typescript
const user = await authService.loginWithEmail('john@example.com', 'SecurePass123');
```

#### **Social Authentication**

**`signInWithGoogle()`**
- Opens Google sign-in popup
- Checks if user profile exists
- Updates login timestamp if user exists
- Returns: `Promise<{ user: User; exists: boolean }>`

**`signInWithApple()`**
- Opens Apple sign-in popup  
- Similar flow to Google authentication
- Returns: `Promise<{ user: User; exists: boolean }>`

**`onboardProviderUser(params)`**
- Completes profile setup for Google/Apple users
- Optionally links email/password for multi-method login
- Creates full UserDoc structure
- Returns: `Promise<User>`

```typescript
const user = await authService.onboardProviderUser({
  name: 'Jane Smith',
  email: 'jane@gmail.com',
  password: 'OptionalPassword123', // Optional
  phone: '+91-9123456789',
  location: 'Delhi',
  role: 'producer'
});
```

#### **Account Linking**

**`linkGoogle()`** / **`linkApple()`**
- Links additional auth provider to existing account
- Prevents duplicate accounts
- Updates profile with provider data

#### **Session Management**

**`updateLoginTimestamp(uid)`**
- Updates `loggedInTime`, `isLoggedIn`, and `device` array
- Tracks unique devices (prevents duplicates)
- Called automatically on login

**`logout()`**
- Removes current device from device array
- Sets `isLoggedIn` to false
- Signs out from Firebase Auth
- Updates `updatedAt` timestamp

#### **Password Reset**

**`sendPasswordResetEmail(email)`**
- Sends password reset email to user
- Returns: `Promise<void>`

**`verifyPasswordResetCode(code)`**
- Verifies the reset code from email link
- Returns: `Promise<string>` (email)

**`confirmPasswordReset(code, newPassword)`**
- Completes password reset process
- Returns: `Promise<void>`

#### **Utility Methods**

**`getCurrentUser()`**
- Returns currently authenticated user or null
- Returns: `User | null`

**`saveUserProfile(uid, data)`**
- Updates user profile with partial data
- Automatically updates `updatedAt`
- Returns: `Promise<void>`

### Device Tracking

The service tracks devices using the `BrowserDetectionService`:

```typescript
interface devices {
  model?: string;
  platform: string; // 'web', 'ios', 'android'
  version?: string;
}
```

- Devices are added on login
- Devices are removed on logout
- Prevents duplicate device entries

---

## Upload Service

### Overview
The `UploadService` handles media file uploads to Firebase Storage and manages metadata in Firestore using a hierarchical subcollection structure.

### Firestore Structure

**New Hierarchical Structure:**
```
/uploads/{userId}/userUploads/{uploadId}
  - fileName: string
  - fileUrl: string (Firebase Storage download URL)
  - fileType: 'video' | 'image'
  - fileSize: number (bytes)
  - uploadedAt: Timestamp
  - metadata: VideoMetadata | ImageMetadata
```

### Interfaces

```typescript
interface MediaUpload {
  userId?: string; // Extracted from path, not stored in document
  fileName: string;
  fileUrl: string;
  fileType: 'video' | 'image';
  fileSize: number;
  uploadedAt: any;
  metadata?: VideoMetadata | ImageMetadata;
}

interface VideoMetadata {
  tags: string[];
  mediaType: string; // 'reel', 'short', 'scene', etc.
  description: string;
  thumbnailUrl?: string;
}

interface ImageMetadata {
  caption?: string;
  tags?: string[];
}
```

### Key Methods

#### **Upload Operations**

**`uploadVideo(file, metadata)`**
- Uploads video file to Firebase Storage
- Path: `/users/{userId}/videos/{timestamp}_{sanitizedFileName}`
- Saves metadata to Firestore subcollection
- Returns: `Observable<UploadProgress>`

```typescript
uploadService.uploadVideo(videoFile, {
  tags: ['action', 'drama'],
  mediaType: 'scene',
  description: 'Emotional confrontation scene',
  thumbnailUrl: 'https://...'
}).subscribe({
  next: (progress) => {
    if (progress.url) {
      console.log('Upload complete:', progress.url);
    } else {
      console.log('Progress:', progress.progress);
    }
  },
  error: (err) => console.error('Upload failed:', err)
});
```

**`uploadImages(files, metadata?)`**
- Uploads multiple image files concurrently
- Path: `/users/{userId}/images/{timestamp}_{index}_{sanitizedFileName}`
- Tracks progress for each file individually
- Returns: `Observable<UploadProgress[]>`

```typescript
uploadService.uploadImages([file1, file2, file3], {
  caption: 'Portfolio shots',
  tags: ['headshot', 'portfolio']
}).subscribe({
  next: (progressArray) => {
    progressArray.forEach((p, i) => {
      console.log(`File ${i}: ${p.progress}%`);
    });
  }
});
```

#### **Query Operations**

**`getUserUploads(userId, fileType?, limit?)`**
- Retrieves uploads for specific user
- Uses direct subcollection path (efficient)
- No `where` clause needed
- Returns: `Promise<MediaUpload[]>`

```typescript
const uploads = await uploadService.getUserUploads('userId123', 'video', 20);
```

**`getUploadsByMediaType(mediaType, limit?)`**
- Queries across all users using `collectionGroup`
- Filters by video mediaType
- Returns: `Promise<MediaUpload[]>`

```typescript
const reels = await uploadService.getUploadsByMediaType('reel', 50);
```

**`getUploadsByTag(tag, limit?)`**
- Searches videos by tag across all users
- Uses `array-contains` query
- Returns: `Promise<MediaUpload[]>`

```typescript
const actionVideos = await uploadService.getUploadsByTag('action', 30);
```

**`getRecentUploads(fileType?, limit?)`**
- Gets recent uploads across all users
- Ordered by `uploadedAt` descending
- Optional file type filter
- Returns: `Promise<MediaUpload[]>`

```typescript
const recentVideos = await uploadService.getRecentUploads('video', 25);
```

#### **Validation Methods**

**`validateFileSize(file, maxSizeMB)`**
- Checks if file size is within limit
- Returns: `boolean`

```typescript
if (!uploadService.validateFileSize(file, 100)) {
  alert('File size must be under 100MB');
}
```

**`validateFileType(file, allowedTypes)`**
- Validates file MIME type
- Returns: `boolean`

```typescript
const isValid = uploadService.validateFileType(file, ['video/mp4', 'video/quicktime']);
```

### Storage Paths

**Videos:** `/users/{userId}/videos/{timestamp}_{filename}`  
**Images:** `/users/{userId}/images/{timestamp}_{index}_{filename}`

### Performance Benefits

1. **Direct Path Access**: No `where('userId', '==', ...)` queries for user uploads
2. **Lower Costs**: Fewer composite indexes required
3. **Better Security**: Simple rules - users can only access their own uploads
4. **Scalability**: Easy per-user quotas and limits

### Required Firestore Indexes

See `firestore.indexes.json`:
- `userUploads` collectionGroup with `fileType` + `metadata.mediaType` + `uploadedAt`
- `userUploads` collectionGroup with `fileType` + `metadata.tags` (array) + `uploadedAt`
- `userUploads` collectionGroup with `fileType` + `uploadedAt`

---

## Chat Service

### Overview
The `ChatService` manages real-time messaging between actors and producers with request/accept workflow, typing indicators, and unread tracking.

### Firestore Structure

```
/chatRooms/{roomId}
  - id: string (auto-generated: {actorId}_{producerId})
  - participants: string[] ([actorId, producerId] sorted)
  - actorId: string
  - producerId: string
  - createdBy: string (always producerId)
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - lastMessage: ChatMessage (embedded)
  - actorCanSee: boolean (false until producer sends first message)
  - actorAccepted: boolean (true when actor accepts)
  - actorRejected: boolean (true when actor rejects)
  - unreadCount: { [userId]: number }
  - typingUsers: { [userId]: Timestamp | null }

/chatRooms/{roomId}/messages/{messageId}
  - chatRoomId: string
  - senderId: string
  - receiverId: string
  - text: string
  - timestamp: Timestamp
  - read: boolean
  - messageType: 'text' | 'image' | 'file'
```

### Chat Workflow

#### **Producer-Initiated Flow:**

1. **Producer starts chat**
   ```typescript
   const roomId = await chatService.producerStartChat(actorId, producerId, 'Hello!');
   ```

2. **Chat room created with:**
   - `actorCanSee: false` (initially hidden from actor)
   - First message sent
   - `actorCanSee: true` (room now visible to actor)

3. **Actor sees request in notifications**
   ```typescript
   chatService.observeRequestsForActor(actorId).subscribe(requests => {
     console.log(`${requests.length} pending requests`);
   });
   ```

4. **Actor accepts or rejects**
   ```typescript
   await chatService.acceptChatRequest(roomId, actorId);
   // OR
   await chatService.rejectChatRequest(roomId, actorId);
   ```

5. **If accepted**, chat appears in actor's main chat list

### Key Methods

#### **Room Management**

**`ensureRoom(actorId, producerId)`**
- Creates room if it doesn't exist
- Uses deterministic roomId: sorted participant IDs
- Initializes unread counts and typing indicators
- Returns: `Promise<string>` (roomId)

**`producerStartChat(actorId, producerId, text?)`**
- Creates room and optionally sends first message
- Sets `actorCanSee: true` when message sent
- Returns: `Promise<string>` (roomId)

#### **Messaging**

**`sendMessage({ roomId, senderId, receiverId, text })`**
- Sends message to room's messages subcollection
- Updates room's `lastMessage` and `updatedAt`
- Increments receiver's unread count
- Resets sender's typing indicator
- Returns: `Promise<void>`

```typescript
await chatService.sendMessage({
  roomId: 'actor123_producer456',
  senderId: 'producer456',
  receiverId: 'actor123',
  text: 'Looking forward to working with you!'
});
```

**`observeMessages(roomId, limit?)`**
- Real-time stream of messages ordered by timestamp
- Uses local caching for fast initial load
- Returns: `Observable<(ChatMessage & { id: string })[]>`

```typescript
chatService.observeMessages(roomId, 100).subscribe(messages => {
  console.log('Messages:', messages);
});
```

#### **Unread Tracking**

**`markAllAsRead(roomId, userId)`**
- Resets unread count for user to 0
- Updates localStorage cache immediately
- Clears in-memory cache for refresh
- Returns: `Promise<void>`

```typescript
await chatService.markAllAsRead(roomId, currentUserId);
```

**`getTotalUnreadCount(uid, role)`**
- Returns total unread messages across all rooms
- For actors: only counts accepted chats
- Real-time updates via Observable
- Returns: `Observable<number>`

```typescript
chatService.getTotalUnreadCount(userId, 'actor').subscribe(count => {
  console.log(`${count} unread messages`);
});
```

#### **Chat Requests (Actors Only)**

**`observeRequestsForActor(actorId)`**
- Returns pending chat requests (not yet accepted/rejected)
- Filters for producer-initiated, visible rooms
- Returns: `Observable<(ChatRoom & { id: string })[]>`

**`getChatRequestsCount(actorId)`**
- Returns count of pending requests
- Used for notification badges
- Returns: `Observable<number>`

**`acceptChatRequest(roomId, actorId)`**
- Sets `actorAccepted: true`
- Chat moves to actor's main chat list
- Returns: `Promise<void>`

**`rejectChatRequest(roomId, actorId)`**
- Sets `actorRejected: true`
- Chat removed from actor's view
- Producer can see rejection status
- Returns: `Promise<void>`

**`observeRejectedChatsForProducer(producerId)`**
- Returns chats rejected by actors
- Allows producer to see which actors declined
- Returns: `Observable<(ChatRoom & { id: string })[]>`

#### **Room Queries**

**`observeRoomsForUser(uid, role)`**
- Real-time stream of user's chat rooms
- For actors: only accepted chats
- Sorted by `updatedAt` descending
- Uses localStorage caching
- Returns: `Observable<(ChatRoom & { id: string })[]>`

```typescript
chatService.observeRoomsForUser(userId, 'producer').subscribe(rooms => {
  console.log('My chats:', rooms);
});
```

#### **Typing Indicators**

**`setTypingState(roomId, userId, isTyping)`**
- Sets user's typing status with timestamp
- Auto-expires after 3 seconds of no updates
- Returns: `Promise<void>`

**`observeTypingUsers(roomId, excludeUserId)`**
- Returns list of currently typing users
- Excludes specified user (usually current user)
- Filters out expired typing states (>3s old)
- Returns: `Observable<string[]>`

```typescript
chatService.observeTypingUsers(roomId, currentUserId).subscribe(typingUsers => {
  if (typingUsers.length > 0) {
    console.log(`${typingUsers.length} users typing...`);
  }
});
```

**`createTypingIndicator(roomId, userId)`**
- Creates debounced typing function
- Auto-expires after 3 seconds
- Returns: `(isTyping: boolean) => void`

```typescript
const setTyping = chatService.createTypingIndicator(roomId, userId);

// In input handler:
inputElement.addEventListener('input', () => {
  setTyping(true); // Auto-expires in 3s
});

inputElement.addEventListener('blur', () => {
  setTyping(false); // Clear immediately
});
```

### Caching Strategy

The chat service implements aggressive caching for performance:

#### **In-Memory Cache**
- Messages cache per room (5 min expiry)
- Rooms cache per user+role (5 min expiry)
- Cleared on mutations (send message, accept/reject)

#### **localStorage Cache**
- Stores last known state for instant load
- Updated on every data fetch
- Provides optimistic UI while real data loads

#### **Cache Flow:**
1. Check in-memory cache → return if valid
2. Check localStorage → return immediately if exists
3. Subscribe to Firestore in background
4. Update both caches when data arrives
5. Clear cache on expiry or mutation

---

## Firestore Data Structure

### Complete Schema

```
/users/{userId}
  └── UserDoc fields

/uploads/{userId}/userUploads/{uploadId}
  └── MediaUpload fields (no userId stored)

/chatRooms/{roomId}
  ├── ChatRoom fields
  └── /messages/{messageId}
      └── ChatMessage fields
```

### Security Rules Recommendations

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User documents
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Uploads
    match /uploads/{userId}/userUploads/{uploadId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat rooms
    match /chatRooms/{roomId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.participants;
      allow create: if request.auth != null &&
                       request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null &&
                       request.auth.uid in resource.data.participants;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null &&
                       request.auth.uid in get(/databases/$(database)/documents/chatRooms/$(roomId)).data.participants;
        allow create: if request.auth != null &&
                         request.auth.uid == request.resource.data.senderId &&
                         request.auth.uid in get(/databases/$(database)/documents/chatRooms/$(roomId)).data.participants;
      }
    }
  }
}
```

---

## Best Practices

### Authentication
- ✅ Always use `currentRole` for active role, `roles` array for all roles
- ✅ Update `updatedAt` on every profile change
- ✅ Track devices for security auditing
- ✅ Call `updateLoginTimestamp()` on all login methods
- ❌ Never store sensitive data in Firestore
- ❌ Don't skip device tracking—useful for security

### Uploads
- ✅ Validate file size and type before upload
- ✅ Use hierarchical structure for better organization
- ✅ Include userId in returned query results
- ✅ Deploy required Firestore indexes
- ❌ Don't store userId in upload documents (it's in the path)
- ❌ Don't query old flat collection—migrate data first

### Chat
- ✅ Use deterministic roomIds for consistency
- ✅ Always increment unread counts on send
- ✅ Reset unread when opening conversation
- ✅ Clear typing indicators on message send
- ✅ Implement optimistic caching for performance
- ❌ Don't skip request/accept workflow for actors
- ❌ Don't forget to filter actor's view by `actorAccepted`

### General
- ✅ Use `serverTimestamp()` for all timestamps
- ✅ Handle errors gracefully with user-friendly messages
- ✅ Implement loading states during async operations
- ✅ Use observables for real-time data
- ❌ Don't use console.log in production (use Logger service)
- ❌ Don't ignore Firestore security rules

---

## Error Handling Examples

```typescript
// Auth Service
try {
  await authService.loginWithEmail(email, password);
} catch (error: any) {
  if (error.code === 'auth/user-not-found') {
    alert('No account found with this email');
  } else if (error.code === 'auth/wrong-password') {
    alert('Incorrect password');
  } else {
    alert('Login failed: ' + error.message);
  }
}

// Upload Service
uploadService.uploadVideo(file, metadata).subscribe({
  next: (progress) => {
    if (progress.url) {
      console.log('Success!', progress.url);
    }
  },
  error: (err) => {
    if (err.error?.includes('storage/unauthorized')) {
      alert('Upload permission denied');
    } else {
      alert('Upload failed: ' + (err.error || 'Unknown error'));
    }
  }
});

// Chat Service  
try {
  await chatService.sendMessage({ roomId, senderId, receiverId, text });
} catch (error) {
  alert('Failed to send message. Please try again.');
}
```

---

## Performance Optimization Tips

### Authentication
- Cache user profile data in component state
- Use Angular's `OnPush` change detection
- Unsubscribe from auth state listeners on component destroy

### Uploads
- Compress images client-side before upload
- Use lazy loading for upload galleries
- Implement pagination for large upload lists
- Consider Cloud Functions for thumbnail generation

### Chat
- Use virtual scrolling for long message lists
- Implement message pagination (load older messages on scroll)
- Debounce typing indicators (300-500ms)
- Clear cache aggressively to prevent memory leaks
- Use `shareReplay(1)` to prevent duplicate subscriptions

---

## Development Workflow

### Testing Services Locally

```typescript
// Mock Auth
const mockUser = { uid: 'test123', email: 'test@example.com' };

// Mock Upload
const mockFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });

// Mock Chat
const mockMessage = {
  roomId: 'actor1_producer1',
  senderId: 'producer1',
  receiverId: 'actor1',
  text: 'Test message'
};
```

### Deployment Checklist

- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Update security rules: `firebase deploy --only firestore:rules`
- [ ] Migrate existing upload data to new structure
- [ ] Test all authentication methods
- [ ] Verify chat request/accept flow
- [ ] Check upload permissions and quotas
- [ ] Monitor Firestore usage and costs

---

## Support & Troubleshooting

### Common Issues

**Issue:** "Missing index" error  
**Solution:** Deploy `firestore.indexes.json`

**Issue:** Chat requests not showing for actor  
**Solution:** Verify `actorCanSee: true` and `actorAccepted !== true`

**Issue:** Upload fails silently  
**Solution:** Check Firebase Storage rules and file size limits

**Issue:** Typing indicator doesn't clear  
**Solution:** Ensure auto-expiry timeout is set (3 seconds)

**Issue:** Unread counts not updating  
**Solution:** Clear localStorage cache and in-memory cache

---

**Document Version:** 1.0  
**Last Updated:** October 12, 2025  
**Maintained By:** Castrole Development Team
