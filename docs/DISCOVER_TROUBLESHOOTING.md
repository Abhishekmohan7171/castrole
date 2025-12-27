# Discover Feed Troubleshooting Guide

## Error: "Failed to load posts. Please try again."

This error occurs when the Firestore query fails. Follow these steps to diagnose and fix the issue:

---

## Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for detailed error messages. You should see:
- `Firestore error details:`
- `Error code:`
- `Error message:`

The error code will tell you exactly what's wrong.

---

## Common Issues & Solutions

### 1. **Permission Denied (Error code: `permission-denied`)**

**Cause:** Firestore security rules are blocking read access to the `discover` collection.

**Solution:** Update your Firestore security rules:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to discover collection for all users
    match /discover/{document} {
      allow read: if true;  // For testing - adjust for production
      allow write: if request.auth != null;  // Only authenticated users can write
    }
  }
}
```

**For production, use more restrictive rules:**
```javascript
match /discover/{document} {
  // Only allow reading active posts
  allow read: if resource.data.isActive == true;
  // Only allow authenticated users to create/update
  allow create, update: if request.auth != null;
  allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
}
```

---

### 2. **Missing Index (Error code: `failed-precondition`)**

**Cause:** Firestore requires a composite index for the query but it doesn't exist.

**Solution:** The error message will include a link to create the index. Click it, or manually create:

**Required Index:**
- Collection: `discover`
- Fields to index:
  1. `isActive` (Ascending)
  2. `postDate` (Descending)
- Query scope: Collection

**How to create manually:**
1. Go to Firebase Console → Firestore Database
2. Click "Indexes" tab
3. Click "Create Index"
4. Set Collection ID: `discover`
5. Add fields:
   - `isActive` → Ascending
   - `postDate` → Descending
6. Click "Create"

**Or use firestore.indexes.json:**
```json
{
  "indexes": [
    {
      "collectionGroup": "discover",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "postDate",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

Deploy with: `firebase deploy --only firestore:indexes`

---

### 3. **Collection Doesn't Exist**

**Cause:** The `discover` collection hasn't been created in Firestore yet.

**Solution:** Create at least one document in the `discover` collection:

1. Go to Firebase Console → Firestore Database
2. Click "Start collection"
3. Collection ID: `discover`
4. Add first document with these fields:

```javascript
{
  authorId: "your-user-id",
  authorName: "Test Author",
  category: "news",
  content: "This is a test post content",
  createdAt: [Current timestamp],
  customUrl: null,
  id: "test-post-1",
  imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
  isActive: true,
  isFeatured: false,
  location: null,
  metadata: null,
  postDate: [Current timestamp],
  subtitle: "Test subtitle",
  tags: ["test", "news"],
  thumbnailUrl: null,
  title: "Test Post",
  type: "image",
  updatedAt: [Current timestamp],
  videoUrl: null
}
```

---

### 4. **No Active Posts**

**Cause:** All documents have `isActive: false` or the field is missing.

**Solution:** Ensure at least one document has `isActive: true`:

1. Go to Firestore Database
2. Open a document in the `discover` collection
3. Set `isActive` field to `true`
4. Save

---

### 5. **Firestore Not Initialized**

**Cause:** Firebase/Firestore is not properly configured in your Angular app.

**Solution:** Check your Firebase configuration:

**File: `src/app/app.config.ts` or `src/environments/environment.ts`**

Ensure Firebase is initialized:
```typescript
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
    })),
    provideFirestore(() => getFirestore()),
    // ... other providers
  ]
};
```

---

### 6. **Network Issues**

**Cause:** No internet connection or Firestore is down.

**Solution:**
- Check your internet connection
- Check Firebase Status: https://status.firebase.google.com/
- Try again later

---

## Debugging Steps

### Step 1: Enable Detailed Logging

The error handler now logs detailed information. Check the console for:

```javascript
Firestore error details: [Error object]
Error code: "permission-denied" | "failed-precondition" | etc.
Error message: "Detailed error message"
```

### Step 2: Test Firestore Connection

Create a simple test to verify Firestore is working:

```typescript
// In your component or service
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

async testFirestore() {
  try {
    const snapshot = await getDocs(collection(this.firestore, 'discover'));
    console.log('Documents found:', snapshot.size);
    snapshot.forEach(doc => {
      console.log('Document:', doc.id, doc.data());
    });
  } catch (error) {
    console.error('Firestore test failed:', error);
  }
}
```

### Step 3: Verify Query Structure

The service uses this query:
```typescript
query(
  collection(firestore, 'discover'),
  where('isActive', '==', true),
  orderBy('postDate', 'desc'),
  limit(100)
)
```

**Requirements:**
- Field `isActive` must exist and be a boolean
- Field `postDate` must exist and be a Timestamp
- Composite index must exist (see Issue #2 above)

### Step 4: Check Document Structure

Verify your documents match this structure:
```typescript
{
  id: string,
  authorId: string,
  authorName: string,
  postDate: Timestamp,  // ← Must be Firestore Timestamp
  content: string,
  title?: string,
  subtitle?: string,
  imageUrl?: string,
  videoUrl?: string,
  customUrl?: string,
  thumbnailUrl?: string,
  category?: string,
  tags?: string[],
  type: 'text' | 'image' | 'video' | 'link' | 'article' | 'ad',
  isFeatured: boolean,
  location?: string,
  metadata?: any,
  isActive: boolean,  // ← Must be true to show
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Quick Fixes

### Fix 1: Temporarily Remove Filters

To test if the query itself is the problem, temporarily simplify it:

**In `discover.service.ts`, line 39-44:**
```typescript
// Simplified query for testing
let q = query(
  this.discoverCollection,
  limit(10)  // Just get first 10 documents
);
```

If this works, the issue is with the `where` or `orderBy` clauses.

### Fix 2: Check Field Names

Ensure field names in Firestore match exactly (case-sensitive):
- `isActive` (not `IsActive` or `is_active`)
- `postDate` (not `PostDate` or `post_date`)

### Fix 3: Verify Timestamps

Ensure `postDate`, `createdAt`, and `updatedAt` are Firestore Timestamps, not strings or numbers.

**To fix existing documents:**
```javascript
// In Firebase Console, run this in the Firestore Rules Playground or use a script
import { serverTimestamp } from 'firebase/firestore';

// Update document
updateDoc(docRef, {
  postDate: serverTimestamp(),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

---

## Testing Checklist

- [ ] Browser console shows detailed error message
- [ ] Firestore rules allow read access
- [ ] Required composite index exists
- [ ] `discover` collection exists with at least 1 document
- [ ] At least 1 document has `isActive: true`
- [ ] Document has `postDate` as Firestore Timestamp
- [ ] Firebase is properly initialized in app config
- [ ] Internet connection is working
- [ ] No CORS errors in console

---

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Share the exact error message** from the browser console
2. **Check Firestore rules** - copy and share them
3. **Verify document structure** - share a screenshot of a document
4. **Check indexes** - share screenshot of Indexes tab
5. **Test with simplified query** (Fix 1 above)

---

## Success Indicators

When working correctly, you should see:
- ✅ Loading spinner appears briefly
- ✅ Posts load and display in grid
- ✅ Console shows: `Fetched X discover posts`
- ✅ No error messages in console
- ✅ Can filter by tabs (all, academic, news, trending)
- ✅ Can click posts to open modal

---

## Production Recommendations

Once working:

1. **Remove console.error statements** or gate them with LoggerService
2. **Implement proper security rules** (not `allow read: if true`)
3. **Add pagination** for better performance
4. **Cache results** to reduce Firestore reads
5. **Monitor Firestore usage** in Firebase Console
6. **Set up error tracking** (e.g., Sentry, Firebase Crashlytics)
