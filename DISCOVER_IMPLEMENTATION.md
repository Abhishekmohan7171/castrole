# Discover Feed - Dynamic Implementation

## Overview
Converted the static discover feed to dynamically fetch and display posts from the Firestore `discover` collection.

## Changes Made

### 1. Created DiscoverService (`src/app/services/discover.service.ts`)
A new service that handles all Firestore interactions for the discover collection:

**Key Features:**
- Real-time data synchronization using Firestore `onSnapshot`
- Multiple query methods:
  - `getDiscoverPosts(category?, limitCount)` - Get posts with optional category filter
  - `getFeaturedPosts(limitCount)` - Get only featured posts
  - `getPostsByType(postType, limitCount)` - Get posts by specific type
- Automatic Timestamp conversion from Firestore to JavaScript Date
- Proper error handling and logging
- Efficient query with `isActive` filter and `postDate` ordering

**Firestore Queries:**
```typescript
// Base query structure
query(
  collection(firestore, 'discover'),
  where('isActive', '==', true),
  orderBy('postDate', 'desc'),
  limit(50)
)
```

### 2. Updated FeedComponent (`src/app/discover/feed.component.ts`)

**Removed:**
- Static `actorItems` and `producerItems` arrays (150+ lines of hardcoded data)

**Added:**
- `OnInit` and `OnDestroy` lifecycle hooks
- Reactive state management using signals:
  - `isLoading` - Loading state indicator
  - `errorMessage` - Error message display
  - `allPosts` - Dynamic posts from Firestore
- `fetchDiscoverPosts()` - Fetches data from Firestore
- `retryFetch()` - Retry mechanism for failed requests
- Proper subscription management and cleanup

**UI Enhancements:**
- Loading spinner with "Loading posts..." message
- Error state with retry button
- Empty state when no posts match filters
- All existing filtering (by tab, search) works with dynamic data

### 3. Interface Compatibility
The existing `Discover` interface matches the Firestore document structure:

```typescript
interface Discover {
  id: string;
  authorId: string;
  authorName: string;
  postDate: Date;
  content: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  videoUrl?: string;
  customUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  type: PostType;
  isFeatured: boolean;
  location?: string;
  metadata?: Map<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Firestore Collection Structure

Based on your screenshots, the `discover` collection documents should have:

```javascript
{
  authorId: "z4oNyrQYVWMgYgbmOx8h3Ew1qy1",
  authorName: "admin@gmail.com",
  category: "super",
  content: "for the day of my House of my house...",
  createdAt: Timestamp,
  customUrl: null,
  id: "3f70cf28-4971-4836-b1d5-ef1dc94ed4df",
  imageUrl: "https://firebasestorage.googleapis.com/...",
  isActive: true,
  isFeatured: true,
  location: null,
  metadata: null,
  postDate: Timestamp,
  subtitle: null,
  tags: ["fghh", "ggh", "ghj", "ghj"],
  thumbnailUrl: null,
  title: "ts3",
  type: "image",
  updatedAt: Timestamp,
  videoUrl: null
}
```

## Required Firestore Indexes

For optimal performance, create these composite indexes in Firestore:

1. **All active posts ordered by date:**
   - Collection: `discover`
   - Fields: `isActive` (Ascending), `postDate` (Descending)

2. **Posts by category:**
   - Collection: `discover`
   - Fields: `isActive` (Ascending), `category` (Ascending), `postDate` (Descending)

3. **Featured posts:**
   - Collection: `discover`
   - Fields: `isActive` (Ascending), `isFeatured` (Ascending), `postDate` (Descending)

4. **Posts by type:**
   - Collection: `discover`
   - Fields: `isActive` (Ascending), `type` (Ascending), `postDate` (Descending)

## How It Works

1. **Component Initialization:**
   - `ngOnInit()` calls `fetchDiscoverPosts()`
   - Sets loading state to true

2. **Data Fetching:**
   - DiscoverService queries Firestore with real-time listener
   - Filters for `isActive: true` posts
   - Orders by `postDate` descending (newest first)
   - Limits to 100 posts

3. **Real-time Updates:**
   - Any changes to the Firestore collection automatically update the UI
   - No need to refresh the page

4. **Client-side Filtering:**
   - Tab filtering (all/academic/news/trending) happens in `filteredItems` getter
   - Search filtering also happens client-side
   - This approach reduces Firestore reads

5. **Error Handling:**
   - If fetch fails, shows error message with retry button
   - User can click retry to attempt fetching again

## Testing Checklist

- [ ] Posts load from Firestore on page load
- [ ] Loading spinner shows while fetching
- [ ] Posts display correctly with images, titles, content
- [ ] Tab filtering works (all, academic, news, trending)
- [ ] Search functionality works
- [ ] Modal opens and displays full post details
- [ ] Navigation arrows work in modal
- [ ] Error state shows if Firestore is unavailable
- [ ] Retry button works after error
- [ ] Real-time updates work (add/edit post in Firestore console)
- [ ] Empty state shows when no posts match filters

## Performance Considerations

1. **Efficient Queries:**
   - Single query fetches all posts (max 100)
   - Client-side filtering reduces Firestore reads
   - Real-time listener reuses connection

2. **Bundle Size:**
   - Removed 150+ lines of static data
   - Service is tree-shakeable

3. **Memory Management:**
   - Proper subscription cleanup in `ngOnDestroy`
   - Unsubscribes from Firestore listener on component destroy

## Future Enhancements

1. **Pagination:**
   - Implement infinite scroll or "Load More" button
   - Use `startAfter` cursor for efficient pagination

2. **Caching:**
   - Cache posts in memory signal
   - Reduce redundant Firestore reads

3. **Optimistic Updates:**
   - Show new posts immediately before Firestore confirms

4. **Advanced Filtering:**
   - Filter by multiple categories
   - Date range filtering
   - Sort options (newest, oldest, most popular)

5. **Analytics:**
   - Track which posts users view
   - Track search queries
   - Monitor error rates

## Troubleshooting

**Posts not loading:**
- Check Firestore rules allow read access
- Verify collection name is exactly "discover"
- Check browser console for errors
- Ensure at least one document has `isActive: true`

**Images not displaying:**
- Verify `imageUrl` field contains valid URLs
- Check Firebase Storage CORS configuration
- Ensure Storage rules allow public read

**Filtering not working:**
- Verify `category` field matches tab names exactly
- Check case sensitivity (should be lowercase)
- Ensure `isActive` is set to true

**Real-time updates not working:**
- Check Firestore connection
- Verify listener is not being unsubscribed early
- Check browser console for WebSocket errors
