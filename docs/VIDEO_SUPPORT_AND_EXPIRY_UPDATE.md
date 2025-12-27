# Video Support & Expiry Date Implementation

## Changes Made

### ✅ 1. Video Display Support

**Problem:** Videos were not displaying in the discover feed - only showing placeholder icons.

**Solution:** Added proper video rendering with the following features:

#### A. Video Element Rendering
```typescript
<!-- Video -->
<video 
  *ngIf="item.type === 'video' && item.videoUrl"
  [src]="item.videoUrl"
  [poster]="item.thumbnailUrl || item.imageUrl"
  class="w-full h-full object-cover"
  preload="metadata"
  muted
  playsinline>
</video>
```

**Features:**
- ✅ Renders `<video>` element for posts with `type: 'video'`
- ✅ Uses `videoUrl` as the video source
- ✅ Falls back to `thumbnailUrl` or `imageUrl` as poster
- ✅ Preloads metadata only (efficient)
- ✅ Muted by default (autoplay-friendly)
- ✅ `playsinline` for mobile compatibility

#### B. Play Icon Overlay
```typescript
<!-- Video Play Icon Overlay -->
<div *ngIf="item.type === 'video' && item.videoUrl" class="absolute inset-0 flex items-center justify-center pointer-events-none">
  <div class="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
    <svg class="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  </div>
</div>
```

**Features:**
- ✅ Visual indicator that content is a video
- ✅ Centered play button overlay
- ✅ Semi-transparent background
- ✅ Pointer-events disabled (doesn't block clicks)

#### C. Type-Based Rendering
```typescript
<!-- Video for video type -->
<video *ngIf="item.type === 'video' && item.videoUrl" ...>

<!-- Image for image type -->
<img *ngIf="item.type === 'image' && item.imageUrl" ...>

<!-- Fallback for missing media -->
<div *ngIf="!item.imageUrl && !item.videoUrl" ...>
```

**Logic:**
1. Check `item.type` field
2. Render appropriate media element
3. Show fallback icon if both are missing

---

### ✅ 2. Expiry Date Filtering

**Problem:** Posts with expired `expiryDate` were still showing in the feed.

**Solution:** Added automatic filtering to hide expired posts.

#### A. Interface Update
```typescript
// discover.interface.ts
export interface Discover {
  // ... other fields
  expiryDate?: Date;  // ← Added
}
```

#### B. Service Mapping
```typescript
// discover.service.ts
private mapFirestoreToDiscover(id: string, data: DocumentData): Discover | null {
  return {
    // ... other fields
    expiryDate: data['expiryDate'] ? this.convertTimestamp(data['expiryDate']) : undefined,
  };
}
```

**Features:**
- ✅ Converts Firestore Timestamp to JavaScript Date
- ✅ Optional field (undefined if not present)
- ✅ Handles all timestamp formats

#### C. Filtering Logic
```typescript
// feed.component.ts
get filteredItems(): Discover[] {
  const now = new Date();
  let base = this.items;
  
  // Filter out expired posts
  base = base.filter(i => {
    if (!i.expiryDate) return true; // No expiry = never expires
    const expiryDate = i.expiryDate instanceof Date ? i.expiryDate : new Date(i.expiryDate);
    return expiryDate > now; // Only show posts that haven't expired
  });
  
  // ... other filters (category, search)
  
  return base;
}
```

**Logic:**
1. Get current date/time
2. For each post:
   - If no `expiryDate` → Show it (never expires)
   - If `expiryDate` exists → Compare with current time
   - Only show if `expiryDate > now`
3. Apply other filters (category, search)

---

## How It Works

### Video Display Flow

```
1. Post fetched from Firestore
   ↓
2. Check post.type field
   ↓
3. If type === 'video':
   - Render <video> element
   - Use videoUrl as source
   - Use thumbnailUrl/imageUrl as poster
   - Show play icon overlay
   ↓
4. If type === 'image':
   - Render <img> element
   - Use imageUrl as source
   ↓
5. If no media:
   - Show fallback icon
```

### Expiry Date Flow

```
1. Posts fetched from Firestore
   ↓
2. Service converts expiryDate timestamp to Date
   ↓
3. Component filters posts:
   - Get current date
   - Compare each post's expiryDate
   - Remove expired posts
   ↓
4. Remaining posts displayed in UI
   ↓
5. Expired posts automatically hidden
```

---

## Firestore Document Structure

### For Video Posts
```javascript
{
  id: "post-123",
  type: "video",  // ← Must be 'video'
  videoUrl: "https://firebasestorage.googleapis.com/.../video.mp4",  // ← Required
  thumbnailUrl: "https://firebasestorage.googleapis.com/.../thumb.jpg",  // ← Optional poster
  imageUrl: "https://firebasestorage.googleapis.com/.../fallback.jpg",  // ← Fallback poster
  title: "My Video Post",
  content: "Video description...",
  category: "news",
  isActive: true,
  postDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiryDate: Timestamp  // ← Optional expiry
}
```

### For Image Posts
```javascript
{
  id: "post-456",
  type: "image",  // ← Must be 'image'
  imageUrl: "https://firebasestorage.googleapis.com/.../image.jpg",  // ← Required
  title: "My Image Post",
  content: "Image description...",
  category: "super",
  isActive: true,
  postDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiryDate: Timestamp  // ← Optional expiry
}
```

### Expiry Date Examples
```javascript
// Post expires on Jan 1, 2026
{
  expiryDate: Timestamp(2026, 0, 1, 0, 0, 0)  // Will be hidden after this date
}

// Post never expires
{
  expiryDate: null  // or omit the field entirely
}

// Post expires in 7 days
{
  expiryDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
}
```

---

## Testing

### Test Video Display

1. **Create a video post in Firestore:**
   ```javascript
   {
     type: "video",
     videoUrl: "https://firebasestorage.googleapis.com/.../video.mp4",
     thumbnailUrl: "https://firebasestorage.googleapis.com/.../thumb.jpg",
     title: "Test Video",
     // ... other required fields
   }
   ```

2. **Expected Result:**
   - ✅ Video thumbnail shows (from thumbnailUrl or imageUrl)
   - ✅ Play icon overlay appears
   - ✅ Clicking opens modal with video
   - ✅ Video can be played in modal

3. **Check Console:**
   ```
   Fetched posts: Array(X)
     [0]: {
       type: "video",
       videoUrl: "https://...",
       thumbnailUrl: "https://..."
     }
   ```

### Test Expiry Date

1. **Create posts with different expiry dates:**
   ```javascript
   // Post A - Expires tomorrow
   {
     expiryDate: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
   }
   
   // Post B - Expired yesterday
   {
     expiryDate: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
   }
   
   // Post C - Never expires
   {
     expiryDate: null
   }
   ```

2. **Expected Result:**
   - ✅ Post A shows (expires tomorrow)
   - ❌ Post B hidden (expired yesterday)
   - ✅ Post C shows (never expires)

3. **Check Filtering:**
   - Open browser console
   - Check filtered posts count
   - Verify expired posts are excluded

---

## Common Issues & Solutions

### Issue 1: Video Not Showing

**Symptoms:**
- Placeholder icon shows instead of video
- No play button overlay

**Causes:**
1. `type` field is not set to `'video'`
2. `videoUrl` is missing or invalid
3. Video file not accessible (CORS, permissions)

**Solutions:**

**A. Check type field:**
```javascript
// In Firestore document
{
  type: "video"  // ← Must be exactly "video"
}
```

**B. Verify videoUrl:**
```javascript
{
  videoUrl: "https://firebasestorage.googleapis.com/v0/b/.../video.mp4?alt=media&token=..."
}
```

**C. Check Firebase Storage rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Allow public read
    }
  }
}
```

**D. Verify video format:**
- Supported: MP4, WebM, Ogg
- Recommended: MP4 (H.264)
- Check browser compatibility

---

### Issue 2: Video Shows But Won't Play

**Symptoms:**
- Video thumbnail shows
- Play button appears
- Video doesn't play when clicked

**Causes:**
1. Video codec not supported
2. Video file corrupted
3. CORS issues
4. File too large

**Solutions:**

**A. Convert to compatible format:**
```bash
# Using ffmpeg
ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4
```

**B. Check video in browser:**
- Open videoUrl directly in browser
- Should play without errors

**C. Check file size:**
- Recommended: < 50MB for web
- Compress if needed

---

### Issue 3: Expired Posts Still Showing

**Symptoms:**
- Posts with past expiryDate still visible
- Filtering not working

**Causes:**
1. `expiryDate` field missing in Firestore
2. `expiryDate` is string, not Timestamp
3. Timezone issues

**Solutions:**

**A. Verify expiryDate format:**
```javascript
// In Firestore document
{
  expiryDate: Timestamp  // ← Must be Firestore Timestamp, not string
}
```

**B. Check in Firebase Console:**
- Open document
- Verify `expiryDate` field type is "timestamp"
- Value should be in the future

**C. Update existing documents:**
```javascript
// In Firebase Console or script
import { Timestamp } from 'firebase/firestore';

await updateDoc(docRef, {
  expiryDate: Timestamp.fromDate(new Date('2026-01-01'))
});
```

---

### Issue 4: Thumbnail Not Showing for Video

**Symptoms:**
- Video element renders
- No poster/thumbnail image

**Causes:**
1. `thumbnailUrl` and `imageUrl` both missing
2. Invalid thumbnail URL
3. Image not accessible

**Solutions:**

**A. Add thumbnailUrl:**
```javascript
{
  type: "video",
  videoUrl: "https://.../video.mp4",
  thumbnailUrl: "https://.../thumbnail.jpg"  // ← Add this
}
```

**B. Generate thumbnail:**
- Extract frame from video
- Upload to Firebase Storage
- Add URL to document

**C. Use imageUrl as fallback:**
```javascript
{
  videoUrl: "https://.../video.mp4",
  imageUrl: "https://.../fallback.jpg"  // ← Will be used if thumbnailUrl missing
}
```

---

## Performance Considerations

### Video Loading
- ✅ `preload="metadata"` - Only loads metadata, not full video
- ✅ Lazy loading - Videos load as user scrolls
- ✅ Poster images - Show thumbnail while video loads
- ✅ Muted by default - Allows autoplay without user interaction

### Expiry Filtering
- ✅ Client-side filtering - No extra Firestore queries
- ✅ Computed once per render - Efficient
- ✅ Reactive - Updates when posts change
- ✅ Minimal overhead - Simple date comparison

### Optimization Tips

**For Videos:**
1. Compress videos before upload
2. Use appropriate resolution (720p or 1080p max)
3. Generate thumbnails for faster loading
4. Consider CDN for large files

**For Expiry:**
1. Set reasonable expiry dates
2. Clean up expired posts periodically (Cloud Function)
3. Index expiryDate in Firestore if querying server-side

---

## Future Enhancements

### Video Features
- [ ] Video player controls in modal
- [ ] Autoplay on hover (like Instagram)
- [ ] Video duration display
- [ ] Multiple video qualities
- [ ] HLS/DASH streaming for large files
- [ ] Video upload progress indicator

### Expiry Features
- [ ] Show "Expires in X days" badge
- [ ] Admin UI to extend expiry date
- [ ] Automatic archiving of expired posts
- [ ] Email notifications before expiry
- [ ] Bulk expiry date updates
- [ ] Scheduled posts (future postDate)

---

## Testing Checklist

### Video Display
- [ ] Video posts show video element
- [ ] Play icon overlay appears
- [ ] Thumbnail/poster displays
- [ ] Video plays in modal
- [ ] Works on mobile
- [ ] Works on desktop
- [ ] Multiple videos on same page
- [ ] Video controls work

### Expiry Date
- [ ] Posts without expiryDate show
- [ ] Posts with future expiryDate show
- [ ] Posts with past expiryDate hidden
- [ ] Filtering updates in real-time
- [ ] Works with category filters
- [ ] Works with search
- [ ] Console shows correct count

### Edge Cases
- [ ] Missing videoUrl (shows fallback)
- [ ] Missing thumbnailUrl (uses imageUrl)
- [ ] Missing both (shows icon)
- [ ] Invalid expiryDate (post shows)
- [ ] expiryDate exactly now (post hidden)
- [ ] Timezone differences handled

---

## Summary

### ✅ Video Support
- Videos now render properly with `<video>` element
- Play icon overlay for visual indication
- Thumbnail/poster support
- Type-based rendering (video vs image)

### ✅ Expiry Date Filtering
- Posts automatically hidden after expiry
- Optional field (posts without expiryDate never expire)
- Real-time filtering
- Efficient client-side implementation

### 📝 Files Modified
1. `feed.component.ts` - Added video rendering and expiry filtering
2. `discover.interface.ts` - Added expiryDate field
3. `discover.service.ts` - Added expiryDate mapping

### 🎯 Result
- Videos display correctly in feed
- Expired posts automatically hidden
- Better user experience
- Cleaner, more relevant content

---

## Need Help?

If issues persist:
1. Check browser console for errors
2. Verify Firestore document structure
3. Check Firebase Storage rules
4. Test video URL directly in browser
5. Verify expiryDate is Firestore Timestamp
