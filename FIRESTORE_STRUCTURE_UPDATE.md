# Firestore Document Structure Update

## Overview

Updated the UI to handle your actual Firestore document structure, including cases where `thumbnailUrl` is null and additional fields like `description` and `fileUrl`.

---

## Your Firestore Document Structure

```javascript
{
  // Identifiers
  id: "63e85708-a7fd-40cd-b433-141b96463ac7",
  
  // Content
  title: "Video Post",
  content: "this is a video.",
  subtitle: null,
  description: null,  // Alternative content field
  
  // Media
  type: "video",
  videoUrl: "https://firebasestorage.googleapis.com/v0/b/yberhood-castrole.firebasestorage.app/o/discover%2Fvideos%2F20251215_211732_VID-20251215-WA0039.mp4?alt=media&token=40a823af-54e2-4240-b09f-fb47f79b2967",
  thumbnailUrl: null,  // ← No thumbnail
  imageUrl: null,
  fileUrl: null,  // Generic file field
  
  // Metadata
  category: "Trending",
  tags: ["wow", "trending"],
  customUrl: "www.linkedin.com",
  location: null,
  metadata: null,
  
  // Status
  isActive: true,
  isFeatured: false,
  
  // Dates
  postDate: Timestamp (December 15, 2025 at 9:17:40 PM UTC+5:30),
  createdAt: Timestamp (December 15, 2025 at 9:17:40 PM UTC+5:30),
  updatedAt: Timestamp (December 15, 2025 at 9:17:40 PM UTC+5:30),
  expiryDate: Timestamp (December 18, 2025 at 12:00:00 AM UTC+5:30)
}
```

**Note:** This post has already expired (expiryDate: Dec 18, 2025) and won't show in the feed due to expiry filtering.

---

## UI Changes Made

### 1. Video Without Thumbnail Fallback

**Problem:** When `thumbnailUrl` and `imageUrl` are both null, video posts showed a generic placeholder.

**Solution:** Added a special video-specific fallback UI.

```typescript
<!-- Fallback for Video without thumbnail -->
<div *ngIf="item.type === 'video' && !item.thumbnailUrl && !item.imageUrl && item.videoUrl" 
     class="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-900/20 to-neutral-900">
  <svg class="h-20 w-20 text-purple-400/60" viewBox="0 0 24 24">
    <!-- Video camera icon -->
  </svg>
  <span class="text-sm text-neutral-400 font-medium">{{ item.title || 'Video' }}</span>
</div>
```

**Features:**
- ✅ Shows video camera icon
- ✅ Displays video title
- ✅ Purple gradient background (matches theme)
- ✅ Still shows play button overlay

---

### 2. Enhanced Play Button

**Before:** Small play button (16x16)  
**After:** Larger, more prominent play button (20x20)

```typescript
<div class="w-20 h-20 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
  <svg class="w-10 h-10 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
</div>
```

**Features:**
- ✅ Larger and more visible
- ✅ Border for better contrast
- ✅ Backdrop blur effect
- ✅ Better accessibility

---

### 3. Interface Updates

**Added Optional Fields:**
```typescript
export interface Discover {
  // Made optional (may not always be present)
  authorId?: string;
  authorName?: string;
  
  // New fields from Firestore
  description?: string;  // Alternative to content
  fileUrl?: string;      // Generic file URL
  
  // ... other fields
}
```

---

### 4. Service Mapping Updates

**Added Field Mappings:**
```typescript
{
  authorId: data['authorId'] || undefined,
  authorName: data['authorName'] || undefined,
  content: data['content'] || data['description'] || '',  // Fallback to description
  description: data['description'] || undefined,
  fileUrl: data['fileUrl'] || undefined,
  // ... other fields
}
```

**Fallback Logic:**
- If `content` is missing → Use `description`
- If `authorName` is missing → Show "Anonymous"
- If `title` is missing → Use `subtitle`

---

### 5. Modal Content Updates

**Author Display:**
```typescript
<span *ngIf="currentCard.authorName">{{ currentCard.authorName }}</span>
<span *ngIf="!currentCard.authorName">Anonymous</span>
```

**Title Display:**
```typescript
<h2 *ngIf="currentCard.title || currentCard.subtitle">
  {{ currentCard.title || currentCard.subtitle }}
</h2>
```

**Content Display:**
```typescript
<p>{{ currentCard.content || currentCard.description }}</p>
```

---

## How It Works Now

### Grid Display (Video Without Thumbnail)

```
┌─────────────────────────┐
│                         │
│     🎥 Video Icon       │
│                         │
│    "Video Post"         │
│                         │
│      ▶️ Play Button     │
│                         │
└─────────────────────────┘
```

**Features:**
- Video camera icon (purple/gray)
- Video title below icon
- Large play button overlay
- Purple gradient background

---

### Modal Display

```
┌──────────────────────────────────────┐
│                                      │
│   [Video Player with Controls]       │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  Anonymous • Dec 15, 2025            │
│                                      │
│  Video Post                          │
│                                      │
│  this is a video.                    │
│                                      │
│  #wow #trending                      │
│                                      │
└──────────────────────────────────────┘
```

**Features:**
- Video player with controls
- "Anonymous" if no author
- Title displayed
- Content/description shown
- Tags displayed

---

## Field Priority & Fallbacks

### Content Display
1. **`content`** (primary)
2. **`description`** (fallback)
3. Empty string (last resort)

### Title Display
1. **`title`** (primary)
2. **`subtitle`** (fallback)
3. Hidden if both missing

### Author Display
1. **`authorName`** (primary)
2. **"Anonymous"** (fallback)

### Thumbnail Display (Videos)
1. **`thumbnailUrl`** (primary)
2. **`imageUrl`** (fallback)
3. **Video icon + title** (last resort)

---

## Testing Your Video Post

### Issue: Post Won't Show

**Reason:** Your post has expired!

```javascript
expiryDate: December 18, 2025 at 12:00:00 AM UTC+5:30
// Current date: December 21, 2025
// Post expired 3 days ago
```

**Solution:** Update the expiry date to a future date:

```javascript
// In Firebase Console
expiryDate: Timestamp.fromDate(new Date('2026-12-31'))
```

Or remove the expiry date:
```javascript
// Delete the expiryDate field
expiryDate: null
```

---

### Test Steps

1. **Update Expiry Date** in Firebase Console
   - Navigate to Firestore
   - Open your document
   - Change `expiryDate` to a future date
   - Or delete the field

2. **Refresh the Page**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear cache if needed

3. **Expected Results:**
   - ✅ Video card appears in grid
   - ✅ Shows video camera icon with "Video Post" title
   - ✅ Large play button overlay visible
   - ✅ Purple gradient background
   - ✅ Category shows "Trending"

4. **Click the Card:**
   - ✅ Modal opens
   - ✅ Video player appears
   - ✅ Can play the video
   - ✅ Shows "Anonymous" as author
   - ✅ Shows "Video Post" as title
   - ✅ Shows "this is a video." as content
   - ✅ Shows tags: "wow", "trending"

---

## Recommended Firestore Structure

### Complete Video Post (Best Practice)

```javascript
{
  // Required fields
  id: "unique-id",
  type: "video",
  videoUrl: "https://firebasestorage.googleapis.com/.../video.mp4",
  content: "Video description",
  title: "Video Title",
  category: "Trending",
  isActive: true,
  isFeatured: false,
  postDate: Timestamp.now(),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  
  // Recommended fields
  thumbnailUrl: "https://firebasestorage.googleapis.com/.../thumbnail.jpg",  // ← Add this!
  authorId: "user-123",
  authorName: "John Doe",
  tags: ["video", "trending"],
  
  // Optional fields
  subtitle: "Video subtitle",
  description: "Alternative description",
  customUrl: "https://example.com",
  location: "Mumbai",
  expiryDate: Timestamp.fromDate(new Date('2026-12-31')),  // Future date
  
  // Not needed (can be null or omitted)
  imageUrl: null,
  fileUrl: null,
  metadata: null
}
```

---

## How to Add Thumbnail

### Option 1: Extract from Video (Recommended)

**Using FFmpeg:**
```bash
# Extract frame at 1 second
ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 -q:v 2 thumbnail.jpg

# Upload to Firebase Storage
# Get download URL
# Add to Firestore document
```

### Option 2: Upload Separate Image

1. Create/select a thumbnail image
2. Upload to Firebase Storage (`discover/thumbnails/`)
3. Get download URL
4. Add to Firestore:
   ```javascript
   thumbnailUrl: "https://firebasestorage.googleapis.com/.../thumbnail.jpg"
   ```

### Option 3: Use First Frame (Client-side)

```javascript
const video = document.createElement('video');
video.src = videoUrl;
video.currentTime = 1;

video.addEventListener('seeked', () => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  canvas.toBlob(async (blob) => {
    // Upload blob to Firebase Storage
    const thumbnailUrl = await uploadThumbnail(blob);
    
    // Update Firestore document
    await updateDoc(docRef, { thumbnailUrl });
  }, 'image/jpeg', 0.8);
});
```

---

## Common Issues

### Issue 1: Video Not Showing in Grid

**Possible Causes:**
1. ✅ **Expired** - Check `expiryDate` is in the future
2. ✅ **Inactive** - Check `isActive: true`
3. ✅ **Wrong Category** - Check category filter
4. ✅ **Missing Fields** - Check required fields present

**Debug Steps:**
```javascript
// Check in browser console
console.log('Fetched posts:', posts);
console.log('Filtered posts:', filteredPosts);
console.log('Current category:', currentCategory);
```

---

### Issue 2: Video Shows But No Thumbnail

**Expected Behavior:** ✅ This is correct!

When `thumbnailUrl` and `imageUrl` are both null:
- Shows video camera icon
- Shows video title
- Shows play button overlay
- Purple gradient background

**To Add Thumbnail:** Follow "How to Add Thumbnail" section above.

---

### Issue 3: "Anonymous" Shows Instead of Author

**Cause:** `authorId` and `authorName` fields are missing from Firestore.

**Solution:** Add author fields:
```javascript
{
  authorId: currentUser.uid,
  authorName: currentUser.displayName || "User Name"
}
```

---

### Issue 4: Video Won't Play in Modal

**Possible Causes:**
1. Invalid video URL
2. CORS issues
3. Video codec not supported
4. File too large

**Solutions:**
1. Test video URL directly in browser
2. Check Firebase Storage rules
3. Convert to MP4 (H.264)
4. Compress video if > 50MB

---

## Summary

### What Changed

**Interface:**
- ✅ Added `description` and `fileUrl` fields
- ✅ Made `authorId` and `authorName` optional

**Service:**
- ✅ Maps new fields from Firestore
- ✅ Fallback logic for missing fields

**UI:**
- ✅ Better video fallback (no thumbnail)
- ✅ Larger play button
- ✅ "Anonymous" for missing author
- ✅ Flexible content display

### Your Video Post

**Current Status:** ❌ Expired (Dec 18, 2025)

**To Fix:**
1. Update `expiryDate` to future date
2. Or remove `expiryDate` field
3. Refresh page

**Will Show:**
- Video camera icon + "Video Post" title
- Large play button overlay
- Purple gradient background
- Clicking opens video player

**Recommended:**
- Add `thumbnailUrl` for better UX
- Add `authorName` to show author
- Update `expiryDate` to future date

---

## Next Steps

1. **Update expiry date** in Firebase Console
2. **Add thumbnail** (optional but recommended)
3. **Add author info** (optional)
4. **Test** the video post
5. **Create more posts** with proper structure

The UI is now fully compatible with your Firestore structure! 🎉
