# 🧪 Testing Producer Connection Notifications

## Issue: Connection Accepted/Declined notifications not appearing for producers

---

## **Step-by-Step Testing Guide**

### **Test 1: Connection Accepted Notification**

#### **Setup:**
1. Open two browser windows
   - **Window 1:** Login as Producer
   - **Window 2:** Login as Actor

#### **Steps:**

**Window 1 (Producer):**
1. Navigate to Search
2. Find an actor
3. Click "Connect" or send a message
4. **Open browser console (F12)** - Keep it open to see logs

**Window 2 (Actor):**
1. Navigate to Chat → Requests tab
2. You should see the producer's request
3. **Open browser console (F12)** - Keep it open to see logs
4. Click "Accept" button

#### **What to Check in Console:**

**Actor's Console (Window 2):**
```
Creating connection accepted notifications: {
  producerId: "xxx",
  actorId: "yyy",
  actorName: "Actor Name",
  roomId: "zzz"
}
Notifying producer: xxx
Creating notification: {
  type: "connection_accepted",
  recipientId: "xxx",
  title: "Connection Accepted",
  message: "Actor Name accepted your connection request — Start chatting"
}
✓ Notification created: connection_accepted for user xxx
✓ Producer notification created
```

**Producer's Console (Window 1):**
- Should see notification appear in real-time (no refresh needed)

#### **Expected Result:**
```
Producer's Notification Drawer:
🔔 Connection Accepted
"[Actor Name] accepted your connection request — Start chatting"
Click → Opens chat room
```

---

### **Test 2: Connection Declined Notification**

#### **Setup:**
Same as Test 1

#### **Steps:**

**Window 1 (Producer):**
1. Send another connection request to a different actor
2. **Keep console open (F12)**

**Window 2 (Actor):**
1. Navigate to Chat → Requests tab
2. **Keep console open (F12)**
3. Click "Decline" button

#### **What to Check in Console:**

**Actor's Console (Window 2):**
```
Creating connection declined notification: {
  producerId: "xxx",
  actorId: "yyy",
  actorName: "Actor Name"
}
Creating notification: {
  type: "connection_declined",
  recipientId: "xxx",
  title: "Connection Declined",
  message: "Actor Name declined your connection request"
}
✓ Notification created: connection_declined for user xxx
✓ Producer declined notification created
```

**Producer's Console (Window 1):**
- Should see notification appear in real-time

#### **Expected Result:**
```
Producer's Notification Drawer:
🔔 Connection Declined
"[Actor Name] declined your connection request"
Click → Navigate to /discover/search
```

---

## **Debugging Checklist**

### **If notifications don't appear:**

#### **1. Check Console Logs**
- [ ] Do you see "Creating connection accepted notifications" in actor's console?
- [ ] Do you see "✓ Notification created" in actor's console?
- [ ] Are there any errors in the console?

#### **2. Check Firestore**
Open Firebase Console → Firestore Database:
- [ ] Navigate to: `users/{producerId}/notifications`
- [ ] Do you see the notification document?
- [ ] Check the notification fields:
  ```
  {
    userId: "producerId",
    type: "connection_accepted",
    category: "connection",
    title: "Connection Accepted",
    message: "Actor Name accepted...",
    timestamp: [Firestore Timestamp],
    read: false,
    actionUrl: "/discover/chat/roomId",
    metadata: { actorId, actorName, actorPhotoUrl, chatRoomId }
  }
  ```

#### **3. Check Producer's Notification Listener**
In producer's browser console:
```javascript
// Check if notification service is listening
const userId = 'YOUR_PRODUCER_ID';
console.log('Checking notifications for:', userId);
```

#### **4. Check Firestore Rules**
Verify notification creation is allowed:
```javascript
// In Firestore rules
match /users/{userId}/notifications/{notificationId} {
  allow create: if request.auth != null; // Should allow any authenticated user
  allow read: if request.auth.uid == userId;
}
```

#### **5. Check Actor Profile Data**
The issue might be that actor's name/photo isn't being fetched:

In actor's browser console:
```javascript
import { inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

const firestore = inject(Firestore);
const userId = 'YOUR_ACTOR_ID';
const profileDoc = await getDoc(doc(firestore, 'profiles', userId));
console.log('Actor profile:', profileDoc.data());
console.log('Stage name:', profileDoc.data()?.actorProfile?.stageName);
console.log('Photo URL:', profileDoc.data()?.actorProfile?.actorProfileImageUrl);
```

---

## **Common Issues & Solutions**

### **Issue 1: "No room data found for roomId"**
**Cause:** Chat room doesn't exist or has wrong structure  
**Solution:** Check `chatRooms/{roomId}` in Firestore, ensure it has:
- `producerId`
- `producerName`
- `producerPhotoUrl`
- `actorId`

### **Issue 2: Notification created but not appearing**
**Cause:** Producer's notification listener not active  
**Solution:** 
1. Refresh producer's page
2. Check DiscoverComponent is calling `observeNotifications(producerId)`
3. Check console for listener errors

### **Issue 3: "actorName is undefined"**
**Cause:** Actor profile not found or missing stageName  
**Solution:**
1. Verify actor has profile in `profiles/{actorId}`
2. Verify `actorProfile.stageName` exists
3. Check console logs for profile fetch errors

### **Issue 4: Notifications appear after refresh only**
**Cause:** Real-time listener not working  
**Solution:**
1. Check Firestore connection
2. Verify onSnapshot listener is active
3. Check for JavaScript errors blocking real-time updates

---

## **Manual Test in Browser Console**

If automated tests aren't working, manually create a notification:

**In Producer's Browser Console:**
```javascript
// Get NotificationService
import { inject } from '@angular/core';
import { NotificationService } from './app/services/notification.service';

const notificationService = inject(NotificationService);
const producerId = 'YOUR_PRODUCER_ID';
const actorId = 'YOUR_ACTOR_ID';

// Manually create notification
await notificationService.createConnectionAcceptedNotification(
  producerId,
  actorId,
  'Test Actor',
  'test-room-123',
  'https://example.com/photo.jpg'
);

// Check if it appears in drawer
```

---

## **Verification Steps**

### **After Accept/Decline:**

1. **Check Firestore Console:**
   - Navigate to `users/{producerId}/notifications`
   - Verify notification document exists
   - Check timestamp is recent

2. **Check Producer's Notification Drawer:**
   - Click bell icon
   - Should see notification
   - Unread count should increment

3. **Check Notification Click:**
   - Click on notification
   - Should navigate to correct page
   - Notification should mark as read

---

## **Expected Console Output (Success)**

### **When Actor Accepts:**
```
[ChatComponent] Accepting request for room: abc123
[ChatComponent] Actor profile: { stageName: "John Actor", actorProfileImageUrl: "..." }
[ChatService] Creating connection accepted notifications: {
  producerId: "prod123",
  actorId: "actor456",
  actorName: "John Actor",
  roomId: "abc123"
}
[ChatService] Notifying producer: prod123
[NotificationService] Creating notification: {
  type: "connection_accepted",
  recipientId: "prod123",
  title: "Connection Accepted",
  message: "John Actor accepted your connection request — Start chatting"
}
[NotificationService] ✓ Notification created: connection_accepted for user prod123
[ChatService] ✓ Producer notification created
[ChatService] Notifying actor: actor456
[NotificationService] Creating notification: {
  type: "connection_established",
  recipientId: "actor456",
  ...
}
[NotificationService] ✓ Notification created: connection_established for user actor456
[ChatService] ✓ Actor notification created
```

---

## **Next Steps if Still Not Working**

1. **Share Console Logs:**
   - Copy all console output from both windows
   - Share any errors

2. **Check Firestore Data:**
   - Screenshot of `users/{producerId}/notifications` collection
   - Screenshot of `chatRooms/{roomId}` document

3. **Verify User IDs:**
   - Confirm producer ID is correct
   - Confirm actor ID is correct
   - Ensure they match the logged-in users

4. **Check Network Tab:**
   - Open DevTools → Network tab
   - Filter by "firestore"
   - Check if notification write request succeeds

---

## **Quick Debug Script**

Run this in browser console to check everything:

```javascript
// Debug script
async function debugNotifications() {
  const userId = 'YOUR_USER_ID'; // Replace with actual ID
  const role = 'producer'; // or 'actor'
  
  console.log('=== Notification Debug ===');
  console.log('User ID:', userId);
  console.log('Role:', role);
  
  // Check if user is logged in
  const auth = inject(AuthService);
  console.log('Logged in:', !!auth.currentUser);
  
  // Check notification service
  const notificationService = inject(NotificationService);
  console.log('Notification service:', notificationService);
  
  // Check if listener is active
  notificationService.observeNotifications(userId).subscribe(
    notifications => {
      console.log('Current notifications:', notifications.length);
      console.log('Notifications:', notifications);
    },
    error => {
      console.error('Listener error:', error);
    }
  );
}

debugNotifications();
```

---

**After running these tests, please share:**
1. Console logs from both windows
2. Whether notifications appear in Firestore
3. Any errors you see
