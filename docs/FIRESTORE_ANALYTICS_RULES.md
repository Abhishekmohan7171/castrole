# Firestore Security Rules for Analytics System

## Overview
Security rules for the new analytics system with dedicated `user_analytics` and `wishlists` collections. These rules enforce role-based access control and validate increment bounds to prevent abuse.

**Deploy these rules to Firebase Console manually.**

---

## Complete Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ==================== HELPER FUNCTIONS ====================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function getUserRole(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.currentRole;
    }

    function isProducer() {
      return isAuthenticated() && getUserRole(request.auth.uid) == 'producer';
    }

    function isActor() {
      return isAuthenticated() && getUserRole(request.auth.uid) == 'actor';
    }

    // Validate increment is within reasonable bounds
    function isValidIncrement(field, maxValue) {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny([field])
        || (request.resource.data[field] is int
            && request.resource.data[field] >= resource.data.get(field, 0)
            && request.resource.data[field] <= resource.data.get(field, 0) + maxValue);
    }

    // ==================== USERS COLLECTION ====================

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // ==================== PROFILES COLLECTION ====================

    match /profiles/{profileId} {
      // Anyone authenticated can read profiles
      allow read: if isAuthenticated();

      // Profile owners can update their own profile
      allow update, create: if isOwner(profileId);
    }

    // ==================== USER ANALYTICS COLLECTION ====================

    match /user_analytics/{actorId} {
      // Actors can read their own analytics
      allow read: if isOwner(actorId);

      // Producers can write analytics (with validation)
      allow create, update: if isProducer()
        && request.resource.data.actorId == actorId
        && isValidIncrement('profileViews', 10)
        && isValidIncrement('totalProfileViewMs', 600000)
        && isValidIncrement('searchAppearances', 100)
        && isValidIncrement('totalVideoViews', 50)
        && isValidIncrement('totalWatchMs', 3600000);

      // Daily subcollection
      match /daily/{dateId} {
        // Actors can read their own daily analytics
        allow read: if isOwner(actorId);

        // Producers can write daily analytics (with same validation)
        allow create, update: if isProducer()
          && isValidIncrement('profileViews', 10)
          && isValidIncrement('totalProfileViewMs', 600000)
          && isValidIncrement('searchAppearances', 100)
          && isValidIncrement('totalVideoViews', 50)
          && isValidIncrement('totalWatchMs', 3600000);
      }
    }

    // ==================== WISHLISTS COLLECTION ====================

    match /wishlists/{wishlistId} {
      // Producers can read/write their own wishlist entries
      // Document ID format: {producerId}_{actorId}
      allow read: if isAuthenticated()
        && wishlistId.matches('^' + request.auth.uid + '_.*');

      allow create: if isProducer()
        && wishlistId == request.auth.uid + '_' + request.resource.data.actorId
        && request.resource.data.producerId == request.auth.uid;

      allow delete: if isProducer()
        && wishlistId.matches('^' + request.auth.uid + '_.*');

      // Actors can read count of their wishlist entries (via count aggregation)
      allow read: if isAuthenticated();
    }

    // ==================== UPLOADS COLLECTION ====================

    match /uploads/{userId}/userUploads/{uploadId} {
      // User can read/write their own uploads
      allow read, write: if isOwner(userId);

      // Anyone authenticated can read uploads (for viewing)
      allow read: if isAuthenticated();

      // Producers can update analytics fields only
      allow update: if isProducer()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'metadata.viewCount',
          'metadata.totalWatchMs'
        ])
        && isValidIncrement('metadata.viewCount', 10)
        && isValidIncrement('metadata.totalWatchMs', 3600000);
    }

    // ==================== OTHER COLLECTIONS ====================

    // Add rules for chatRooms, chatMessages, and other collections as needed
  }
}
```

---

## Key Security Features

### 1. Increment Validation Bounds

To prevent abuse, the rules enforce maximum increments per write:

| Field | Max Increment | Rationale |
|-------|--------------|-----------|
| `profileViews` | +10 | Reasonable limit for batch tracking |
| `totalProfileViewMs` | +600,000ms (10 min) | Cap profile view duration |
| `searchAppearances` | +100 | Allow batch search impression tracking |
| `totalVideoViews` | +50 | Handle multiple video views per batch |
| `totalWatchMs` | +3,600,000ms (1 hour) | Cap video watch time per write |
| `metadata.viewCount` | +10 | Video-specific view tracking |
| `metadata.totalWatchMs` | +3,600,000ms (1 hour) | Video-specific watch time |

### 2. Role-Based Access Control

**Producers:**
- Can write analytics to `user_analytics` collection
- Can update video analytics fields (`metadata.viewCount`, `metadata.totalWatchMs`)
- Can create/delete wishlist documents
- Cannot modify actor profile data

**Actors:**
- Can read their own analytics (`user_analytics/{actorId}` and daily subcollection)
- Can read wishlist counts (via count aggregation queries)
- Full control over their own profile

### 3. Document Structure Validation

**Wishlist Documents:**
- Document ID must match pattern: `{producerId}_{actorId}`
- Enforces at creation: `wishlistId == request.auth.uid + '_' + actorId`
- Deletion only by producer who created it

**Analytics Documents:**
- Must include correct `actorId` field
- Enforces: `request.resource.data.actorId == actorId`

---

## Deployment Instructions

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **yberhood-castrole**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the rules from the code block above
5. Click **Publish**
6. Test rules using the **Rules Playground** in the console

### Option 2: Firebase CLI
1. Ensure `firebase.json` has firestore rules configuration:
   ```json
   {
     "firestore": {
       "rules": "firestore.rules"
     }
   }
   ```
2. Create `firestore.rules` file in project root
3. Paste the rules above
4. Deploy:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Testing Security Rules

### Test 1: Producer Updates Analytics ✅ SHOULD SUCCEED
```typescript
const actorId = 'actor123';
const lifetimeRef = doc(firestore, 'user_analytics', actorId);

await updateDoc(lifetimeRef, {
  profileViews: increment(1),
  totalProfileViewMs: increment(5000),
  updatedAt: Timestamp.now(),
});
```

### Test 2: Producer Exceeds Increment Limit ❌ SHOULD FAIL
```typescript
const actorId = 'actor123';
const lifetimeRef = doc(firestore, 'user_analytics', actorId);

// Trying to increment by more than allowed
await updateDoc(lifetimeRef, {
  profileViews: increment(20), // Max is 10 - will be rejected
});
```

### Test 3: Producer Tries to Read Actor Analytics ❌ SHOULD FAIL
```typescript
// Producers cannot read actor analytics
const actorId = 'actor123';
const lifetimeRef = doc(firestore, 'user_analytics', actorId);

const snapshot = await getDoc(lifetimeRef); // Permission denied
```

### Test 4: Actor Reads Own Analytics ✅ SHOULD SUCCEED
```typescript
const currentUser = auth.currentUser;
const lifetimeRef = doc(firestore, 'user_analytics', currentUser.uid);

const snapshot = await getDoc(lifetimeRef); // Success
```

### Test 5: Producer Creates Wishlist ✅ SHOULD SUCCEED
```typescript
const producerId = auth.currentUser.uid;
const actorId = 'actor123';
const wishlistId = `${producerId}_${actorId}`;

await setDoc(doc(firestore, 'wishlists', wishlistId), {
  producerId,
  actorId,
  addedAt: Timestamp.now(),
});
```

### Test 6: Producer Creates Invalid Wishlist ID ❌ SHOULD FAIL
```typescript
const producerId = auth.currentUser.uid;
const actorId = 'actor123';
const invalidId = 'invalid-format'; // Wrong format

await setDoc(doc(firestore, 'wishlists', invalidId), {
  producerId,
  actorId,
  addedAt: Timestamp.now(),
}); // Permission denied
```

---

## Important Notes

### 1. Ghost Mode
Ghost mode is **not enforced by Firestore rules**. It's handled at the application layer in `AnalyticsService.checkGhostMode()`. This is intentional to keep rules simple and avoid extra reads.

If you want to enforce ghost mode in rules (not recommended due to performance):
```javascript
function isGhostMode(actorId) {
  return get(/databases/$(database)/documents/users/$(actorId)).data.ghost == true;
}

// Then add to analytics rules:
allow create, update: if isProducer()
  && !isGhostMode(actorId)
  && ...
```

### 2. Rate Limiting
Firestore rules don't provide built-in rate limiting. Consider:
- **Client-side debouncing** for video progress events
- **Cloud Functions middleware** for additional rate limiting (if needed)
- **Firebase App Check** (recommended) to prevent non-app API abuse

### 3. Document Size Limits
Firestore documents have a 1MB size limit. Monitor:
- `user_analytics` documents grow slowly (only increments)
- `uploads/{userId}/userUploads/{videoId}` documents should stay well under limit

### 4. Firestore Indexes
You may need to create composite indexes for certain queries:

**Required Index:**
```
Collection: user_analytics/{actorId}/daily
Fields: date (Ascending)
```

Create via Firebase Console or automatically when first query fails (Firestore will provide index creation link).

---

## Optional: Firebase App Check

For enhanced security, enable Firebase App Check to prevent unauthorized API access:

### Setup Steps:
1. Go to Firebase Console → **App Check**
2. Register your web app with **reCAPTCHA Enterprise** or **reCAPTCHA v3**
3. Add App Check SDK to your Angular app:

```typescript
// app.config.ts
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    provideAppCheck(() => initializeAppCheck(undefined, {
      provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
      isTokenAutoRefreshEnabled: true
    })),
  ],
};
```

### Update Rules (Optional):
```javascript
// Require App Check for all requests
match /databases/{database}/documents {
  match /{document=**} {
    allow read, write: if request.app != null && isAuthenticated();
  }
}
```

---

## Summary

These security rules provide:
- ✅ **Real-time updates** - No Cloud Function latency
- ✅ **Role-based access** - Producers write, actors read
- ✅ **Increment validation** - Prevents abuse with bounds checking
- ✅ **Document validation** - Enforces correct structure
- ⚠️ **Client trust** - Assumes producers act in good faith within bounds

**Recommended for production:**
1. Enable Firebase App Check
2. Monitor Firestore usage and costs
3. Set up alerts for unusual activity
4. Consider rate limiting via Cloud Functions if abuse detected

---

## Questions or Issues?

If you encounter permission errors:
1. Check that user has correct `currentRole` in `users/{uid}` document
2. Verify document IDs match expected formats
3. Use Firebase Console **Rules Playground** to test specific scenarios
4. Check browser console for detailed permission denied errors
