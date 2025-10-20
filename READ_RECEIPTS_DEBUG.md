# Read Receipts Debugging Guide

## Issue: Blue Ticks Not Working

### Required Firestore Index

The blue ticks require a composite index in Firestore. Without it, the `markMessagesAsSeen()` query will fail silently.

**Required Index:**
```json
{
  "collectionGroup": "messages",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "receiverId", "order": "ASCENDING" },
    { "fieldPath": "read", "order": "ASCENDING" }
  ]
}
```

### Deploy the Index

1. **Check if index exists:**
   - Go to Firebase Console → Firestore Database → Indexes
   - Look for an index on the `messages` collection with fields: `receiverId`, `read`

2. **Deploy the index:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Wait for index to build:**
   - This can take a few minutes
   - Check Firebase Console for index status

### Debugging Steps

1. **Open browser console** and check for logs:
   - `✓ Marked X messages as seen for receiver: userId in room: roomId`
   - If you don't see this, the query is failing (likely missing index)

2. **Check for Firestore errors:**
   - Look for "index required" errors in console
   - Firestore will provide a link to create the index

3. **Enable debug mode:**
   ```javascript
   // In browser console
   window.DEBUG_RECEIPTS = true;
   ```
   Then send/receive messages and check the logged status values.

4. **Manually verify in Firestore:**
   - Go to Firestore Console
   - Navigate to: `chatRooms/{roomId}/messages`
   - Check if messages have:
     - `deliveredAt`: timestamp (for delivered status)
     - `readAt`: timestamp (for seen status)
     - `read`: true (for seen status)

### Expected Behavior

**When you send a message:**
1. Shows ✓ (single gray checkmark) - sent
2. When other user's app loads → ✓✓ (double gray) - delivered
3. When other user opens chat → ✓✓ (double blue) - seen

**When you receive a message:**
1. Message appears in real-time
2. Automatically marked as delivered
3. When you open the chat → marked as seen
4. Sender sees blue ticks

### Common Issues

1. **Missing Firestore Index**
   - Solution: Deploy `firestore.indexes.json`

2. **Index still building**
   - Solution: Wait a few minutes, check Firebase Console

3. **Messages sent before implementing read receipts**
   - Solution: These won't have `deliveredAt`/`readAt` fields
   - Send new messages to test

4. **Cache issues**
   - Solution: Clear browser cache and localStorage
   - Or use incognito mode for testing

### Quick Test

1. Open two browser windows (or one incognito)
2. Login as Producer in one, Actor in another
3. Producer sends message → should see ✓
4. Actor's window should receive message instantly
5. Producer should see ✓✓ (gray) - delivered
6. Actor opens the chat
7. Producer should see ✓✓ (blue) - seen

### If Still Not Working

Check browser console for:
- Any Firestore errors
- The debug logs from `markMessagesAsDelivered()` and `markMessagesAsSeen()`
- Network tab to see if Firestore updates are happening
