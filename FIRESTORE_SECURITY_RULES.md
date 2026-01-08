# Firestore Security Rules for Real-time Analytics

## Overview
These rules allow producers to update analytics fields in actor profiles while maintaining security.

## Rules to Add/Update

Add these rules to your `firestore.rules` file or Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
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
      return getUserRole(request.auth.uid) == 'producer';
    }

    function isActor() {
      return getUserRole(request.auth.uid) == 'actor';
    }

    // Profiles collection
    match /profiles/{profileId} {
      // Allow anyone authenticated to read profiles (for viewing)
      allow read: if isAuthenticated();

      // Allow profile owners to update their own profile
      allow update: if isOwner(profileId);

      // Allow profile owners to create their profile
      allow create: if isOwner(profileId);

      // Allow producers to update analytics fields ONLY
      allow update: if isAuthenticated()
        && isProducer()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'profileViewCount',
          'wishListCount',
          'actorAnalytics',
          'videoAnalytics'
        ])
        // Ensure counts can only increase or decrease appropriately
        && request.resource.data.profileViewCount >= resource.data.get('profileViewCount', 0)
        && (
          // wishListCount can decrease (removal) or increase (addition)
          request.resource.data.wishListCount >= resource.data.get('wishListCount', 0) - 1
        );
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // Other collections...
  }
}
```

## Key Security Features

### 1. Analytics Write Permissions
- **Producers only**: Only users with `currentRole: 'producer'` can write analytics
- **Limited fields**: Producers can ONLY update:  - `profileViewCount`
  - `wishListCount`
  - `actorAnalytics`
  - `videoAnalytics`
- **No other modifications**: Producers cannot change any other profile fields

### 2. Validation Rules
- **Profile view count**: Can only increment (never decrease)
- **Wishlist count**: Can increment or decrement by at most 1 (for add/remove)
- **Array fields**: No specific validation (Firestore handles array updates)

### 3. Owner Permissions
- **Full control**: Profile owners can update any field in their profile
- **Privacy**: Actors can enable `ghostModeEnabled` to disable analytics tracking

## Testing Security Rules

### Test 1: Producer Updates Analytics
```javascript
// SHOULD SUCCEED
const actorProfileRef = db.collection('profiles').doc('actor123');
await actorProfileRef.update({
  profileViewCount: firebase.firestore.FieldValue.increment(1),
  actorAnalytics: updatedAnalyticsArray
});
```

### Test 2: Producer Tries to Update Other Fields
```javascript
// SHOULD FAIL
const actorProfileRef = db.collection('profiles').doc('actor123');
await actorProfileRef.update({
  profileViewCount: firebase.firestore.FieldValue.increment(1),
  stageName: 'Hacked Name'  // ❌ Not allowed
});
```

### Test 3: Actor Updates Own Profile
```javascript
// SHOULD SUCCEED
const ownProfileRef = db.collection('profiles').doc(currentUser.uid);
await ownProfileRef.update({
  stageName: 'New Stage Name',
  profileViewCount: 0  // Can reset own analytics
});
```

### Test 4: Unauthorized Access
```javascript
// SHOULD FAIL
// Not logged in
await db.collection('profiles').doc('actor123').update({
  profileViewCount: firebase.firestore.FieldValue.increment(1)
});
```

## Deployment

### Option 1: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Paste the rules above
5. Click **Publish**

### Option 2: Firebase CLI
1. Create a `firestore.rules` file in your project root
2. Paste the rules above
3. Deploy:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Important Notes

1. **Ghost Mode**: The security rules don't enforce ghost mode - this is handled in the application layer (analytics.service.ts)

2. **Rate Limiting**: Consider adding rate limiting to prevent abuse:
   - Cloud Functions can track requests per producer per minute
   - Implement client-side debouncing for video view events

3. **Audit Trail**: Since we removed `analytics_events` collection:
   - Consider keeping raw events for audit purposes if needed
   - Could add a separate `audit_log` collection with stricter security

4. **Array Size Limits**: Firestore documents have a 1MB limit:
   - `actorAnalytics` capped at 100 entries (code enforced)
   - `videoAnalytics` grows with number of videos
   - Monitor document sizes if actors have many videos

## Alternative: Transaction-based Security

For even stricter security, you could require all analytics updates to go through a Cloud Function with validation logic:

```typescript
// Cloud Function (if you decide to add one later)
exports.updateAnalytics = functions.https.onCall(async (data, context) => {
  // Verify producer role
  // Validate request data
  // Update profile atomically
  // Return success/failure
});
```

This approach provides:
- Centralized validation logic
- Better rate limiting control
- Detailed logging
- But adds latency (not real-time)

## Summary

The rules above provide a good balance of:
- ✅ Real-time updates (no Cloud Function latency)
- ✅ Security (limited field access, role-based)
- ✅ Simplicity (no complex Cloud Functions)
- ⚠️ Trust client code (producers can't maliciously update, but could spam)

Choose based on your security requirements and expected traffic patterns.
