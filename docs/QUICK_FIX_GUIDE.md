# Quick Fix Guide - "Failed to load posts"

## 🚀 Immediate Actions

### 1. Check Browser Console (F12)
Look for these error codes:

| Error Code | Meaning | Quick Fix |
|------------|---------|-----------|
| `permission-denied` | Firestore rules blocking access | Update rules to allow read |
| `failed-precondition` | Missing index | Click the link in error or create index manually |
| `unavailable` | Firestore down or no internet | Check connection, try later |

---

### 2. Run Diagnostics

**Uncomment this line in `feed.component.ts` (line 335):**
```typescript
ngOnInit(): void {
  this.diagnosticService.runDiagnostics();  // ← Uncomment this
  this.fetchDiscoverPosts();
}
```

Reload the page and check console for detailed diagnostics.

---

### 3. Most Common Fix: Update Firestore Rules

**Go to:** Firebase Console → Firestore Database → Rules

**Replace with:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /discover/{document} {
      allow read: if true;  // Allow everyone to read
      allow write: if request.auth != null;  // Only authenticated users can write
    }
  }
}
```

Click **Publish**

---

### 4. Second Most Common Fix: Create Index

**If you see "failed-precondition" error:**

1. Click the link in the error message (it will open Firebase Console)
2. OR manually:
   - Go to Firebase Console → Firestore → Indexes
   - Click "Create Index"
   - Collection: `discover`
   - Fields:
     - `isActive` → Ascending
     - `postDate` → Descending
   - Click Create

Wait 1-2 minutes for index to build.

---

### 5. Verify Collection Has Data

**Go to:** Firebase Console → Firestore Database

**Check:**
- [ ] Collection named `discover` exists
- [ ] At least 1 document inside
- [ ] Document has `isActive: true`
- [ ] Document has `postDate` as Timestamp (not string)

**If missing, add a test document:**
```javascript
{
  authorId: "test-user",
  authorName: "Test Author",
  category: "news",
  content: "Test content",
  createdAt: [Timestamp - use "Add field" → "timestamp"],
  isActive: true,  // ← MUST be true
  isFeatured: false,
  imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
  postDate: [Timestamp - use "Add field" → "timestamp"],
  tags: ["test"],
  title: "Test Post",
  type: "image",
  updatedAt: [Timestamp]
}
```

---

## 📋 Checklist

Work through this in order:

1. [ ] Open browser console (F12) and check error code
2. [ ] Run diagnostics (uncomment line in `ngOnInit`)
3. [ ] Update Firestore rules to allow read access
4. [ ] Create composite index if needed
5. [ ] Verify collection exists with active documents
6. [ ] Ensure `postDate` is Firestore Timestamp
7. [ ] Check internet connection
8. [ ] Clear browser cache and reload

---

## 🎯 Expected Console Output (Success)

When working correctly, you should see:
```
🔍 Starting Firestore Diagnostics...
📡 Test 1: Testing Firestore connection...
✅ Firestore connection successful
📚 Test 2: Checking discover collection...
✅ Collection exists with X document(s)
📋 Test 3: Checking document structure...
✅ All required fields present
✅ postDate is valid Timestamp
🔍 Test 4: Checking for active posts...
✅ Found X active post(s)
🎯 Test 5: Testing actual service query...
✅ Query successful! Found X post(s)
✅ Diagnostics complete!
```

---

## 🆘 Still Not Working?

1. **Share the console output** - Copy all error messages
2. **Share Firestore rules** - Copy from Firebase Console
3. **Share document structure** - Screenshot of a document
4. **Share indexes** - Screenshot of Indexes tab

---

## 📞 Need Help?

Check the detailed guide: `DISCOVER_TROUBLESHOOTING.md`
