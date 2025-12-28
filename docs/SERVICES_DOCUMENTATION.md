# Castrole Services Documentation

Complete technical documentation for Authentication, Upload, and Chat services in the Castrole application.

---

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [Phone Authentication & OTP Services](#phone-authentication--otp-services)
3. [Upload Service](#upload-service)
4. [Chat Service](#chat-service)
5. [Presence Service](#presence-service)
6. [Firestore Data Structure](#firestore-data-structure)
7. [Best Practices](#best-practices)

---

## Authentication Service

### Overview
The `AuthService` manages user authentication, profile management, session tracking, and **real-time presence tracking**. It supports email/password, Google, and Apple authentication methods. The service automatically integrates with `PresenceService` to track user online/offline status.

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
  
  // Presence tracking fields
  - lastSeen: Timestamp (optional) - Last activity timestamp
  - isOnline: boolean (optional) - Real-time online status
  - presenceUpdatedAt: Timestamp (optional) - Last presence update
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
  role: 'actor',
  isPhoneVerified: true // Set after OTP verification
});
```

**`loginWithEmail(email, password)`**
- Authenticates user with email and password
- Updates login timestamp and device tracking
- **Automatically starts presence tracking**
- Returns: `Promise<User>`

```typescript
const user = await authService.loginWithEmail('john@example.com', 'SecurePass123');
// Presence tracking starts automatically
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
  role: 'producer',
  isPhoneVerified: true // Set after OTP verification
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
- **Stops presence tracking before logout**
- Removes current device from device array
- Sets `isLoggedIn` to false
- Sets user status to offline
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

### Presence Tracking Integration

The `AuthService` automatically integrates with `PresenceService` for real-time user status tracking:

**Automatic Tracking:**
- Presence tracking starts automatically on login (via `onAuthStateChanged`)
- Stops automatically on logout
- No manual intervention required

**Constructor Implementation:**
```typescript
constructor() {
  // Auto-track presence based on auth state
  this.auth.onAuthStateChanged((user) => {
    if (user) {
      this.presence.startTracking(user.uid);
    } else {
      this.presence.stopTracking();
    }
  });
}
```

**What Gets Tracked:**
- User activity (mouse, keyboard, touch, scroll)
- Tab visibility (active/inactive)
- Last seen timestamp
- Online/offline status
- Updates every 2 minutes when active

**Status Levels:**
- **Online**: Active within last 1 minute (green dot)
- **Last seen now**: Active 1-2 minutes ago
- **Last seen few moments ago**: Active 2-5 minutes ago
- **Last seen [time] ago**: Shows relative time (5m, 2h, etc.)
- **Last seen yesterday**: Last active yesterday
- **Last seen long time ago**: Inactive for > 7 days

---

## Phone Authentication & OTP Services

### Overview
The phone authentication system consists of two services that work together to provide secure OTP-based phone number verification during user onboarding. This system integrates Firebase Auth phone verification with reCAPTCHA protection and provides a seamless user experience.

### Services Architecture

#### **PhoneAuthService**
Handles Firebase phone authentication with reCAPTCHA verification.

#### **OtpVerificationService** 
Manages verification status using Angular signals for reactive UI updates.

### PhoneAuthService

**File:** `src/app/services/phone-auth.service.ts`

#### **Key Methods**

**`initializeRecaptcha(containerId)`**
- Sets up Firebase reCAPTCHA verifier
- Must be called before sending OTP
- Uses invisible reCAPTCHA for better UX
- Returns: `void`

```typescript
// Usually called automatically by OTP component
phoneAuthService.initializeRecaptcha('recaptcha-container');
```

**`sendOTP(phoneNumber)`**
- Sends OTP to specified phone number
- Supports test numbers in development
- Returns confirmation result for verification
- Returns: `Promise<ConfirmationResult>`

```typescript
const confirmationResult = await phoneAuthService.sendOTP('+917358356139');
// For production numbers, user receives SMS
// For test numbers (dev), use OTP: 123456
```

**`verifyOTP(otp)`**
- Verifies the OTP code entered by user
- Works with both real and test phone numbers
- Returns: `Promise<boolean>`

```typescript
const isValid = await phoneAuthService.verifyOTP('123456');
if (isValid) {
  console.log('Phone number verified successfully');
}
```

**`cleanup()`**
- Cleans up reCAPTCHA verifier
- Called on component destroy
- Returns: `void`

#### **Test Numbers Support**

For development, the service supports test phone numbers:

```typescript
// Test numbers (development only)
private testPhoneNumbers = new Map([
  ['+917358356139', '123456'],
  ['+916374087443', '123456'],
]);
```

**Usage in Development:**
1. Use test phone numbers during development
2. OTP code is always `123456` for test numbers
3. No actual SMS is sent
4. Production numbers work normally with real SMS

### OtpVerificationService

**File:** `src/app/services/otp-verification.service.ts`

#### **Purpose**
Manages phone verification status across components using Angular signals for reactive updates.

#### **Key Methods**

**`markAsVerified(phoneNumber)`**
- Marks a phone number as verified
- Updates reactive signal
- Triggers UI updates automatically
- Returns: `void`

```typescript
// Called automatically after successful OTP verification
otpVerificationService.markAsVerified('+917358356139');
```

**`isPhoneVerified(phoneNumber)`**
- Checks if a phone number is verified
- Returns: `boolean`

```typescript
const isVerified = otpVerificationService.isPhoneVerified('+917358356139');
```

**`getVerificationSignal()`**
- Returns readonly signal for reactive programming
- Used in computed signals and effects
- Returns: `Signal<ReadonlyMap<string, VerificationStatus>>`

```typescript
// In computed signals
const verificationMap = this.otpVerificationService.getVerificationSignal()();
const status = verificationMap.get(phoneNumber);
```

**`clearVerificationStatus(phoneNumber?)`**
- Clears verification status (single number or all)
- Useful for logout/cleanup
- Returns: `void`

#### **Interface**

```typescript
export interface VerificationStatus {
  phoneNumber: string;
  isVerified: boolean;
  timestamp: Date;
}
```

### OTP Modal Component

**File:** `src/app/common-components/otp/otp.component.ts`

#### **Features**
- Modal design that overlays onboarding forms
- Auto-sends OTP when opened
- Supports paste functionality for 6-digit codes
- Automatic phone number formatting
- Test number detection with dev hints
- RxJS-based input handling for smooth UX

#### **Key Methods**

**`open(phoneNumber)`**
- Opens modal and sends OTP automatically
- Initializes reCAPTCHA if needed
- Resets previous state
- Returns: `void`

```typescript
// Called by onboarding components
this.otpModal.open('+917358356139');
```

**Input/Output Properties:**
```typescript
@Input() isOpen = false;
@Input() phone: string | null = null;
@Output() closeModal = new EventEmitter<void>();
@Output() otpVerified = new EventEmitter<void>();
```

### Integration with Onboarding

#### **Actor/Producer Onboarding Integration**

Both onboarding components now include:

1. **Phone verification requirement** for form submission
2. **OTP modal integration** with event handling
3. **Reactive UI updates** showing verification status
4. **Form state management** with verification status

**Template Integration:**
```html
<!-- Verify button / Verified indicator -->
@if (isPhoneVerified) {
  <div class="verified-indicator">
    <svg>✓</svg>
    verified
  </div>
} @else {
  <button (click)="onVerifyMobile()">verify</button>
}

<!-- Next button with verification requirement -->
<button 
  [disabled]="form.invalid || !isPhoneVerified"
  (click)="onNext()"
>
  next
</button>

<!-- OTP Modal -->
<app-otp 
  #otpModal
  [isOpen]="showOtpModal" 
  [phone]="otpPhoneNumber"
  (closeModal)="onCloseOtpModal()"
  (otpVerified)="onOtpVerified()"
></app-otp>
```

**Component Logic:**
```typescript
export class ActorOnboardComponent {
  isPhoneVerified = false;
  @ViewChild('otpModal') otpModal!: OtpComponent;

  onVerifyMobile() {
    const phoneNumber = this.constructPhoneNumber();
    this.otpModal.open(phoneNumber);
  }

  onOtpVerified() {
    this.isPhoneVerified = true;
    // UI updates automatically
  }

  onNext() {
    if (this.form.invalid || !this.isPhoneVerified) {
      this.errorMsg = 'Please complete all fields and verify your phone number';
      return;
    }
    // Proceed with registration...
  }
}
```

### User Flow

#### **Complete Verification Flow:**

1. **User fills onboarding form** including phone number
2. **User clicks "verify" button** next to phone field
3. **OTP modal opens** and automatically sends OTP
4. **User receives SMS** (or uses test code in dev)
5. **User enters 6-digit code** in modal
6. **System verifies OTP** with Firebase
7. **On success:**
   - Modal closes automatically
   - Verify button becomes green "verified" indicator
   - Next button becomes enabled
   - Verification status stored in service
8. **User completes onboarding** with verified phone number
9. **Account created** with `isPhoneVerified: true`

#### **Form Validation:**

- **Next button disabled** until phone is verified AND form is valid
- **Phone number changes** reset verification status
- **Error handling** for failed OTP attempts
- **User-friendly messages** for validation states

### Firebase Configuration

#### **Required Firebase Setup:**

1. **Enable Phone Authentication** in Firebase Console
2. **Configure reCAPTCHA** for web applications
3. **Add test phone numbers** in Firebase Console (development)
4. **Set up production domain** for reCAPTCHA verification

#### **Test Numbers Configuration:**

In Firebase Console → Authentication → Settings → Phone numbers for testing:
- `+917358356139` → `123456`
- `+916374087443` → `123456`

### Error Handling

#### **Common Error Scenarios:**

**reCAPTCHA Issues:**
```typescript
// Error: auth/invalid-app-credential
// Solution: Ensure Phone Auth is enabled in Firebase Console
```

**Rate Limiting:**
```typescript
// Error: auth/too-many-requests
// Solution: Use test numbers for development, implement retry logic
```

**Invalid Phone Format:**
```typescript
// Error: auth/invalid-phone-number
// Solution: Ensure international format (+CountryCodeNumber)
```

### Security Considerations

1. **reCAPTCHA Protection** - Prevents automated OTP requests
2. **Rate Limiting** - Firebase enforces SMS limits
3. **Test Numbers** - Only work in development environment
4. **Input Validation** - Phone numbers validated client-side
5. **Session Management** - OTP verification tied to user session

### Best Practices

#### **Development:**
- ✅ Use test phone numbers for consistent testing
- ✅ Initialize reCAPTCHA before sending OTP
- ✅ Clean up verifiers on component destroy
- ✅ Handle async operations with proper loading states
- ❌ Don't skip reCAPTCHA initialization
- ❌ Don't forget to clean up on destroy

#### **Production:**
- ✅ Monitor SMS usage and costs
- ✅ Implement proper error messages for users
- ✅ Use production domain for reCAPTCHA
- ✅ Validate phone numbers before sending OTP
- ❌ Don't expose test numbers in production
- ❌ Don't skip rate limiting considerations

#### **UX Guidelines:**
- ✅ Show clear loading states during OTP operations
- ✅ Provide visual feedback for verification status
- ✅ Support paste functionality for OTP codes
- ✅ Auto-focus next input field after digit entry
- ❌ Don't make users manually trigger OTP send
- ❌ Don't hide verification status from users

### Performance Optimizations

1. **Lazy Loading** - OTP component loaded only when needed
2. **Signal-based Updates** - Efficient reactive UI updates
3. **Debounced Input** - Smooth OTP entry experience
4. **Minimal Re-renders** - Strategic change detection triggers
5. **Memory Management** - Proper cleanup of services and subscriptions

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
- ✅ Pass `isPhoneVerified` parameter after OTP verification
- ✅ Store phone numbers in display format (+Country-Number)
- ❌ Never store sensitive data in Firestore
- ❌ Don't skip device tracking—useful for security
- ❌ Don't skip phone verification in production

### Phone Verification
- ✅ Use test numbers for development and testing
- ✅ Initialize reCAPTCHA before sending OTP
- ✅ Validate phone number format before verification
- ✅ Clean up verifiers on component destroy
- ✅ Implement proper error handling for OTP failures
- ✅ Use modal design for better form state retention
- ✅ Reset verification status when phone number changes
- ❌ Don't expose test numbers in production builds
- ❌ Don't skip reCAPTCHA initialization
- ❌ Don't allow form submission without verification

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

## Presence Service

### Overview
The `PresenceService` provides real-time user online/offline status tracking with activity detection and automatic status updates. It integrates seamlessly with `AuthService` for automatic lifecycle management.

### Features
- **Real-time presence tracking** with Firestore
- **Activity detection** (mouse, keyboard, touch, scroll, tab visibility)
- **Automatic updates** every 2 minutes when user is active
- **Granular status levels** (online, last seen now, few moments ago, etc.)
- **Browser close detection** (sets offline on tab/window close)

### Key Methods

#### **Lifecycle Management**

**`startTracking(userId)`**
- Starts presence tracking for a user
- Sets user as online immediately
- Begins periodic updates (every 2 minutes)
- Attaches activity listeners
- Sets up beforeunload handler
- **Called automatically by AuthService on login**

```typescript
// Usually called automatically, but can be manual:
presenceService.startTracking('userId123');
```

**`stopTracking()`**
- Stops presence tracking
- Sets user as offline
- Clears intervals and listeners
- **Called automatically by AuthService on logout**

```typescript
// Usually called automatically, but can be manual:
presenceService.stopTracking();
```

#### **Status Observation**

**`observeUserOnlineStatus(userId)`**
- Returns Observable that emits true/false for online status
- User is considered online if active within last 1 minute
- Updates in real-time as status changes
- Returns: `Observable<boolean>`

```typescript
presenceService.observeUserOnlineStatus('userId123').subscribe(isOnline => {
  console.log('User is online:', isOnline);
});
```

**`getLastSeenTime(userId)`**
- Returns Observable of user's last activity timestamp
- Updates in real-time
- Returns: `Observable<Date | null>`

```typescript
presenceService.getLastSeenTime('userId123').subscribe(lastSeen => {
  console.log('Last seen:', lastSeen);
});
```

**`formatLastSeen(lastSeenDate)`**
- Formats last seen date into human-readable status
- Returns granular status strings
- Returns: `string`

```typescript
const status = presenceService.formatLastSeen(new Date());
// Returns: "online", "last seen now", "last seen 5m ago", etc.
```

### Status Levels

| Time Since Activity | Status Text | Green Dot |
|---------------------|-------------|-----------|
| < 1 minute | "online" | ✅ Yes |
| 1-2 minutes | "last seen now" | ❌ No |
| 2-5 minutes | "last seen few moments ago" | ❌ No |
| 5-60 minutes | "last seen 15m ago" | ❌ No |
| 1-24 hours | "last seen 3h ago" | ❌ No |
| Yesterday | "last seen yesterday" | ❌ No |
| 2-7 days | "last seen 3d ago" | ❌ No |
| > 7 days | "last seen long time ago" | ❌ No |

### Activity Detection

The service tracks these user activities:
- **Mouse movement**
- **Keyboard input**
- **Touch events**
- **Click events**
- **Scroll events**
- **Tab visibility** (active/hidden)

Activities are debounced by 1 second to prevent excessive updates.

### Firestore Updates

**Update Frequency:**
- Initial: Immediately on `startTracking()`
- Periodic: Every 2 minutes while user is active
- On activity: When user becomes active after being idle
- On close: Immediately when browser/tab closes

**Fields Updated:**
```typescript
{
  isOnline: boolean,
  lastSeen: Timestamp,
  presenceUpdatedAt: Timestamp
}
```

### Integration Example

**In Chat Component:**
```typescript
export class ChatComponent {
  private presence = inject(PresenceService);
  
  counterpartOnline = signal<boolean>(false);
  counterpartLastSeen = signal<string>('');

  ngOnInit() {
    // Observe counterpart's online status
    combineLatest([
      this.presence.observeUserOnlineStatus(counterpartId),
      this.presence.getLastSeenTime(counterpartId)
    ]).subscribe(([isOnline, lastSeen]) => {
      this.counterpartOnline.set(isOnline);
      this.counterpartLastSeen.set(
        this.presence.formatLastSeen(lastSeen)
      );
    });
  }
}
```

**In Template:**
```html
<span class="flex items-center gap-1.5">
  <span 
    class="w-2 h-2 rounded-full"
    [ngClass]="{
      'bg-green-500 animate-pulse': counterpartOnline(),
      'bg-gray-500': !counterpartOnline()
    }"
  ></span>
  <span>{{ counterpartLastSeen() }}</span>
</span>
```

### Best Practices

1. **Don't call manually** - Let AuthService handle lifecycle
2. **Use signals** - For reactive UI updates
3. **Combine observables** - Track both online status and last seen
4. **Handle null values** - Last seen can be null for new users
5. **Debounce UI updates** - Use `distinctUntilChanged()` to prevent flicker

### Performance Considerations

- Updates are throttled to every 2 minutes
- Activity detection is debounced by 1 second
- Only tracks when user is active (not when idle)
- Minimal Firestore writes (efficient)
- Uses Firestore real-time listeners (no polling)

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

### Presence
- Let AuthService handle lifecycle (don't call manually)
- Use `combineLatest` to track both online status and last seen
- Use `distinctUntilChanged()` to prevent unnecessary UI updates
- Handle null values for new users without presence data
- Consider caching status locally for frequently viewed users

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
- [ ] Test presence tracking (login/logout/activity)
- [ ] Verify online status indicators in chat
- [ ] Check upload permissions and quotas
- [ ] Monitor Firestore usage and costs
- [ ] Test presence tracking across multiple devices/tabs

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

**Document Version:** 1.1  
**Last Updated:** October 25, 2025  
**Maintained By:** Castrole Development Team

### Version History

**v1.1 (October 25, 2025)**
- Added comprehensive Phone Authentication & OTP Services documentation
- Updated Authentication Service with phone verification parameters
- Added integration examples for onboarding components
- Included test numbers configuration and development guidelines
- Added security considerations and best practices for phone verification

**v1.0 (October 12, 2025)**
- Initial documentation for Authentication, Upload, Chat, and Presence services
