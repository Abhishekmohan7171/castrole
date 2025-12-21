# Video Thumbnail Implementation

## Overview

Updated the discover feed to show **thumbnails** for video posts in the grid, and play the **actual video** in the modal when clicked.

---

## Implementation

### Grid View (Feed)
**Shows:** Thumbnail image with play icon overlay  
**Behavior:** Click to open modal

```typescript
<!-- Thumbnail for Video (use thumbnailUrl or imageUrl) -->
<img 
  *ngIf="item.type === 'video' && (item.thumbnailUrl || item.imageUrl)"
  [src]="item.thumbnailUrl || item.imageUrl" 
  [alt]="item.title || 'Video thumbnail'"
  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
  loading="lazy"
  (error)="onImageError($event)"
/>

<!-- Video Play Icon Overlay (only for video posts) -->
<div *ngIf="item.type === 'video' && item.videoUrl" class="absolute inset-0 flex items-center justify-center pointer-events-none">
  <div class="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
    <svg class="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  </div>
</div>
```

### Modal View (Detail)
**Shows:** Full video player with controls  
**Behavior:** User can play, pause, seek, adjust volume

```typescript
<!-- Video Player for Video Posts -->
<video 
  *ngIf="currentCard.type === 'video' && currentCard.videoUrl"
  [src]="currentCard.videoUrl"
  [poster]="currentCard.thumbnailUrl || currentCard.imageUrl"
  class="w-full h-full object-cover"
  controls
  playsinline>
  Your browser does not support the video tag.
</video>

<!-- Image for Image Posts -->
<img 
  *ngIf="currentCard.type === 'image' && currentCard.imageUrl"
  [src]="currentCard.imageUrl" 
  [alt]="currentCard.title"
  class="w-full h-full object-cover"
  loading="lazy"
/>
```

---

## User Flow

### 1. Browse Feed
```
User sees grid of posts
  ↓
Video posts show:
  - Thumbnail image (from thumbnailUrl or imageUrl)
  - Play icon overlay (indicates it's a video)
  - Title below
```

### 2. Click Video Post
```
User clicks on video card
  ↓
Modal opens
  ↓
Video player appears with:
  - Thumbnail as poster
  - Play/pause controls
  - Progress bar
  - Volume control
  - Fullscreen option
```

### 3. Watch Video
```
User clicks play button
  ↓
Video starts playing
  ↓
User can:
  - Pause/resume
  - Seek to any position
  - Adjust volume
  - Enter fullscreen
  - Close modal (video stops)
```

---

## Thumbnail Priority

For video posts, the system uses this fallback order:

1. **`thumbnailUrl`** (preferred) - Dedicated video thumbnail
2. **`imageUrl`** (fallback) - General image field
3. **Placeholder icon** (last resort) - If both are missing

```typescript
[src]="item.thumbnailUrl || item.imageUrl"
```

---

## Benefits

### Performance
- ✅ **Faster page load** - Only loads thumbnails, not videos
- ✅ **Less bandwidth** - Videos only load when user clicks
- ✅ **Better mobile experience** - Thumbnails are smaller files
- ✅ **Lazy loading** - Images load as user scrolls

### User Experience
- ✅ **Clear indication** - Play icon shows it's a video
- ✅ **Preview before play** - Thumbnail gives context
- ✅ **User control** - Video only plays when user wants
- ✅ **Full controls** - Standard video player in modal

### Technical
- ✅ **Consistent grid** - All cards same size
- ✅ **No autoplay issues** - Videos don't start automatically
- ✅ **Browser compatibility** - Works on all modern browsers
- ✅ **Mobile friendly** - `playsinline` attribute for iOS

---

## Firestore Document Structure

### Complete Video Post Example
```javascript
{
  // Required fields
  id: "video-post-123",
  type: "video",  // ← Must be 'video'
  videoUrl: "https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/videos%2Fvideo.mp4?alt=media&token=...",
  
  // Thumbnail (at least one required)
  thumbnailUrl: "https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/thumbnails%2Fthumb.jpg?alt=media&token=...",  // Preferred
  imageUrl: "https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/images%2Fimage.jpg?alt=media&token=...",  // Fallback
  
  // Content
  title: "My Awesome Video",
  subtitle: "Watch this amazing content",
  content: "Full description of the video...",
  
  // Metadata
  category: "news",
  tags: ["video", "news", "trending"],
  authorId: "user-123",
  authorName: "John Doe",
  location: "Mumbai",
  
  // Status
  isActive: true,
  isFeatured: false,
  
  // Dates
  postDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiryDate: Timestamp  // Optional
}
```

---

## How to Create Video Posts

### Step 1: Upload Video to Firebase Storage
```javascript
// Upload video file
const videoRef = ref(storage, `videos/${Date.now()}_${file.name}`);
const videoSnapshot = await uploadBytes(videoRef, videoFile);
const videoUrl = await getDownloadURL(videoSnapshot.ref);
```

### Step 2: Generate Thumbnail
**Option A: Extract from video (client-side)**
```javascript
// Create video element
const video = document.createElement('video');
video.src = URL.createObjectURL(videoFile);

// Wait for metadata
video.addEventListener('loadedmetadata', () => {
  video.currentTime = 1; // Seek to 1 second
});

// Capture frame
video.addEventListener('seeked', () => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  canvas.toBlob(async (blob) => {
    // Upload thumbnail
    const thumbRef = ref(storage, `thumbnails/${Date.now()}_thumb.jpg`);
    const thumbSnapshot = await uploadBytes(thumbRef, blob);
    const thumbnailUrl = await getDownloadURL(thumbSnapshot.ref);
  }, 'image/jpeg', 0.8);
});
```

**Option B: Use Cloud Function (server-side)**
```javascript
// Cloud Function to generate thumbnail
exports.generateThumbnail = functions.storage.object().onFinalize(async (object) => {
  if (!object.name.startsWith('videos/')) return;
  
  // Use ffmpeg to extract frame
  const thumbnail = await extractFrame(object.name, '00:00:01');
  
  // Upload thumbnail
  await uploadThumbnail(thumbnail);
});
```

**Option C: Upload separate thumbnail**
```javascript
// User uploads video and thumbnail separately
const thumbnailRef = ref(storage, `thumbnails/${Date.now()}_thumb.jpg`);
const thumbSnapshot = await uploadBytes(thumbnailRef, thumbnailFile);
const thumbnailUrl = await getDownloadURL(thumbSnapshot.ref);
```

### Step 3: Create Firestore Document
```javascript
import { addDoc, collection, Timestamp } from 'firebase/firestore';

await addDoc(collection(firestore, 'discover'), {
  type: 'video',
  videoUrl: videoUrl,
  thumbnailUrl: thumbnailUrl,  // From Step 2
  title: 'My Video Title',
  subtitle: 'Video subtitle',
  content: 'Video description...',
  category: 'news',
  tags: ['video', 'news'],
  authorId: currentUser.uid,
  authorName: currentUser.displayName,
  isActive: true,
  isFeatured: false,
  postDate: Timestamp.now(),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
});
```

---

## Testing

### Test Grid Display

1. **Create a video post** with `thumbnailUrl`
2. **Navigate to discover feed**
3. **Expected:**
   - ✅ Thumbnail image shows
   - ✅ Play icon overlay appears
   - ✅ Hover effect works
   - ✅ No video loading/buffering

### Test Modal Display

1. **Click on video card**
2. **Expected:**
   - ✅ Modal opens
   - ✅ Video player appears
   - ✅ Thumbnail shows as poster
   - ✅ Play button visible
   - ✅ Controls visible

### Test Video Playback

1. **Click play button in modal**
2. **Expected:**
   - ✅ Video starts playing
   - ✅ Audio plays (if present)
   - ✅ Progress bar updates
   - ✅ Can pause/resume
   - ✅ Can seek
   - ✅ Can adjust volume
   - ✅ Can fullscreen

### Test Fallbacks

1. **Video with only `imageUrl` (no `thumbnailUrl`)**
   - ✅ Uses `imageUrl` as thumbnail
   
2. **Video with no thumbnail or image**
   - ✅ Shows placeholder icon
   
3. **Invalid video URL**
   - ✅ Shows error in modal

---

## Common Issues & Solutions

### Issue 1: Thumbnail Not Showing

**Symptoms:**
- Placeholder icon shows instead of thumbnail
- Play icon appears but no image

**Causes:**
1. Both `thumbnailUrl` and `imageUrl` are missing
2. Invalid thumbnail URL
3. CORS issues

**Solutions:**

**A. Check Firestore document:**
```javascript
{
  thumbnailUrl: "https://..."  // ← Must be present
  // OR
  imageUrl: "https://..."  // ← Fallback
}
```

**B. Verify URL accessibility:**
- Open URL in browser
- Should display image
- Check Firebase Storage rules

**C. Generate thumbnail:**
- Extract frame from video
- Upload to Firebase Storage
- Add URL to document

---

### Issue 2: Video Won't Play in Modal

**Symptoms:**
- Modal opens
- Video player shows
- Play button doesn't work

**Causes:**
1. Invalid `videoUrl`
2. Video codec not supported
3. CORS issues
4. File too large

**Solutions:**

**A. Verify video URL:**
```javascript
{
  videoUrl: "https://firebasestorage.googleapis.com/.../video.mp4?alt=media&token=..."
}
```

**B. Check video format:**
- Supported: MP4 (H.264), WebM, Ogg
- Recommended: MP4 with H.264 codec
- Convert if needed:
  ```bash
  ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4
  ```

**C. Test video directly:**
- Open `videoUrl` in browser
- Should play without errors

---

### Issue 3: Play Icon Not Showing

**Symptoms:**
- Thumbnail shows
- No play icon overlay

**Causes:**
1. `type` field is not `'video'`
2. `videoUrl` is missing
3. CSS issue

**Solutions:**

**A. Check type field:**
```javascript
{
  type: "video"  // ← Must be exactly "video"
}
```

**B. Check videoUrl:**
```javascript
{
  videoUrl: "https://..."  // ← Must be present
}
```

**C. Verify condition:**
```typescript
*ngIf="item.type === 'video' && item.videoUrl"
```

---

### Issue 4: Video Loads in Grid (Performance Issue)

**Symptoms:**
- Page loads slowly
- Videos start buffering in grid
- High bandwidth usage

**Cause:**
- Using `<video>` element in grid instead of `<img>`

**Solution:**
- Ensure grid uses `<img>` for thumbnails
- Only use `<video>` in modal
- Check implementation matches this guide

---

## Performance Optimization

### Thumbnail Best Practices

1. **Size:** 1280x720px (720p) or 1920x1080px (1080p)
2. **Format:** JPEG (smaller) or WebP (better quality)
3. **Compression:** 70-80% quality
4. **File size:** < 200KB per thumbnail

### Video Best Practices

1. **Resolution:** 720p or 1080p (avoid 4K for web)
2. **Format:** MP4 with H.264 codec
3. **Bitrate:** 2-5 Mbps for 720p, 5-8 Mbps for 1080p
4. **Duration:** Keep under 5 minutes for better UX
5. **File size:** < 50MB recommended

### Compression Commands

**Compress video:**
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
```

**Generate thumbnail:**
```bash
ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 -q:v 2 thumbnail.jpg
```

**Compress thumbnail:**
```bash
ffmpeg -i thumbnail.jpg -q:v 5 thumbnail_compressed.jpg
```

---

## Browser Compatibility

### Video Element
- ✅ Chrome 4+
- ✅ Firefox 3.5+
- ✅ Safari 3.1+
- ✅ Edge 12+
- ✅ iOS Safari 3.2+
- ✅ Android Browser 2.3+

### Supported Formats
- ✅ MP4 (H.264) - All browsers
- ✅ WebM (VP8/VP9) - Chrome, Firefox, Edge
- ✅ Ogg (Theora) - Chrome, Firefox

### Recommended Format
**MP4 with H.264 codec** - Universal support

---

## Summary

### Grid View
- ✅ Shows thumbnail image (from `thumbnailUrl` or `imageUrl`)
- ✅ Play icon overlay indicates video
- ✅ Fast loading (only images, no videos)
- ✅ Click to open modal

### Modal View
- ✅ Shows full video player with controls
- ✅ Thumbnail as poster image
- ✅ User can play, pause, seek, adjust volume
- ✅ Fullscreen support

### Benefits
- ✅ Better performance (thumbnails only in grid)
- ✅ Better UX (user controls when to play)
- ✅ Lower bandwidth (videos load on demand)
- ✅ Mobile friendly (playsinline support)

### Files Modified
- `feed.component.ts` - Grid shows thumbnails, modal shows video

---

## Next Steps

1. **Upload videos** to Firebase Storage
2. **Generate thumbnails** for each video
3. **Create Firestore documents** with proper structure
4. **Test** on different devices and browsers
5. **Monitor** performance and bandwidth usage

The implementation is complete and ready to use! 🎉
