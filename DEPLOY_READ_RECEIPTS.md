# Deploy Read Receipts Feature

## ⚠️ CRITICAL: Deploy Firestore Index First

The blue ticks **will not work** until you deploy the Firestore index. This is the most common reason they don't appear.

## Step 1: Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

**Expected output:**
```
✔ Deploy complete!

Indexes:
  - (messages) receiverId ASC, read ASC [CREATING]
```

## Step 2: Wait for Index to Build

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to: **Firestore Database** → **Indexes**
4. Look for the index with:
   - Collection: `messages`
   - Fields: `receiverId`, `read`
   - Status: Should change from "Building" to "Enabled"

⏱️ **This can take 2-10 minutes depending on your data size**

## Step 3: Test Read Receipts

### Option A: Two Browser Windows

1. **Window 1:** Login as Producer
2. **Window 2:** Login as Actor (or use incognito)
3. **Producer** sends a message
4. **Check Producer's screen:**
   - Should show ✓ (single gray checkmark) = sent
5. **Actor's screen:**
   - Message appears automatically (no reload needed)
6. **Check Producer's screen again:**
   - Should now show ✓✓ (double gray checkmarks) = delivered
7. **Actor** opens/views the chat
8. **Check Producer's screen:**
   - Should now show ✓✓ (double **blue** checkmarks) = seen ✅

### Option B: Two Different Devices

1. Login as Producer on Device 1
2. Login as Actor on Device 2
3. Follow same steps as above

## Step 4: Verify in Browser Console

Open browser console (F12) and check for these logs:

### When messages are delivered:
```
✓ Marked X messages as delivered for receiver: {userId} in room: {roomId}
```

### When messages are seen:
```
✓ Marked X messages as seen for receiver: {userId} in room: {roomId}
```

### Enable detailed debugging:
```javascript
window.DEBUG_RECEIPTS = true;
```

Then send/receive messages. You should see:
```javascript
Message status check: {
  id: "messageId",
  readAt: Timestamp {...},  // Should exist when seen
  deliveredAt: Timestamp {...},  // Should exist when delivered
  read: true  // Should be true when seen
}
```

## Troubleshooting

### Issue: Still seeing gray ticks instead of blue

**Possible causes:**

1. **Index not deployed or still building**
   - Solution: Run `firebase deploy --only firestore:indexes`
   - Wait for index to finish building in Firebase Console

2. **Index exists but query is failing**
   - Check browser console for Firestore errors
   - Look for "Missing index" errors
   - Firestore will provide a direct link to create the index

3. **Messages were sent before implementing read receipts**
   - Old messages won't have `deliveredAt`/`readAt` fields
   - Solution: Send **new messages** to test

4. **Browser cache**
   - Clear browser cache and localStorage
   - Or test in incognito mode

5. **Not opening the chat**
   - The blue ticks only appear when the recipient **opens the conversation**
   - Just receiving the message shows gray ticks (delivered)
   - Opening the chat triggers the "seen" status

### Issue: Messages not appearing in real-time

- Check if you're subscribed to the messages observable
- Look for errors in console
- Verify Firestore rules allow read access

### Issue: Console shows "Error marking messages as seen"

- This means the Firestore index is missing
- Deploy the index using the command above

## Visual Reference

| Status | What You See | When It Happens |
|--------|--------------|-----------------|
| **Sent** | ✓ (gray) | Message sent to Firestore |
| **Delivered** | ✓✓ (gray) | Recipient's app loaded the message |
| **Seen** | ✓✓ (**blue**) | Recipient opened the conversation |

## Files Modified

- `src/assets/interfaces/interfaces.ts` - Added `deliveredAt`, `readAt` fields
- `src/app/services/chat.service.ts` - Added `markMessagesAsDelivered()`, `markMessagesAsSeen()`
- `src/app/discover/chat.component.ts` - Added status calculation and UI
- `firestore.indexes.json` - Added required composite index

## Next Steps After Deployment

1. ✅ Deploy indexes: `firebase deploy --only firestore:indexes`
2. ⏱️ Wait for index to build (check Firebase Console)
3. 🧪 Test with two browser windows
4. 🔍 Check browser console for logs
5. 🎉 Enjoy real-time read receipts!

## Need Help?

If blue ticks still don't work after following all steps:

1. Share the browser console logs
2. Check Firestore Console to see if `readAt` field exists on messages
3. Verify the index status in Firebase Console
4. Try sending a completely new message (not old ones)
