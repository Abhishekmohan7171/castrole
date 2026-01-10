# 🧪 Notification Testing Guide

**Complete step-by-step testing instructions for all 20 notification types**

---

## 📋 TESTING PREREQUISITES

### **Setup Requirements:**
1. Two browser windows (or incognito + normal)
2. Two test accounts:
   - **Actor Account** (e.g., actor@test.com)
   - **Producer Account** (e.g., producer@test.com)
3. Browser console access (F12)
4. Firebase Console access (optional, for verification)

### **Quick Setup:**
```bash
# Open two browser windows
Window 1: http://localhost:4200 (Actor)
Window 2: http://localhost:4200/discover?role=producer (Producer)
```

---

## 🎭 ACTOR NOTIFICATIONS (12 Types)

### **1. Connection Request** ✅

**What it tests:** Producer sends connection request to actor

**Steps:**
1. **Window 1:** Login as Actor
2. **Window 2:** Login as Producer
3. **Window 2:** Navigate to Search → Find the actor
4. **Window 2:** Click on actor's profile
5. **Window 2:** Click "Connect" or "Send Message"
6. **Window 1:** Click notification bell icon (top right)

**Expected Result:**
```
🔔 New Connection Request
"[Producer Name] wants to connect with you"
Action: Click → Navigate to /discover/chat/requests
```

**Verification:**
- Notification appears in drawer
- Unread count badge shows "1"
- Click navigates to chat requests page

---

### **2. Connection Established** ✅

**What it tests:** Actor accepts connection request

**Steps:**
1. **Window 1:** Login as Actor (with pending request)
2. **Window 1:** Navigate to Chat → Requests tab
3. **Window 1:** Click "Accept" on producer's request
4. **Window 1:** Check notification drawer immediately

**Expected Result:**
```
🔔 Connection Established
"You're now connected with [Producer Name] — Start chatting"
Action: Click → Navigate to chat room
```

**Verification:**
- Notification appears immediately after accepting
- Chat room is created
- Click opens chat with producer

---

### **3. New Message from Producer** ✅

**What it tests:** Producer sends message in active chat

**Steps:**
1. **Window 1:** Login as Actor
2. **Window 2:** Login as Producer
3. **Window 2:** Navigate to Chat → Find actor's chat room
4. **Window 2:** Type message: "Hello, are you available for a project?"
5. **Window 2:** Press Send
6. **Window 1:** Check notification drawer (don't open chat)

**Expected Result:**
```
🔔 New message from [Producer Name]
"Hello, are you available for a project?"
Action: Click → Navigate to chat room
```

**Verification:**
- Notification shows message preview (first 100 chars)
- Unread count increments
- Click opens specific chat room

---

### **4. Profile Viewed** ✅

**What it tests:** Producer views actor profile (Premium vs Free)

**Steps for Premium Actor:**
1. **Window 1:** Login as Premium Actor
2. **Window 2:** Login as Producer
3. **Window 2:** Navigate to Search → Find actor
4. **Window 2:** Click on actor's profile
5. **Window 2:** Wait 2+ seconds (profile view tracked)
6. **Window 2:** Navigate away (triggers notification)
7. **Window 1:** Check notification drawer

**Expected Result (Premium):**
```
🔔 Profile View
"[Producer Name] viewed your profile"
Action: Click → Navigate to /discover/settings/analytics
```

**Expected Result (Free):**
```
🔔 Profile View
"A producer viewed your profile"
Action: Click → Navigate to /discover/settings/subscription
```

**Verification:**
- Premium actors see producer name
- Free actors see generic message
- Action URL differs based on subscription

---

### **5. Added to Wishlist** ✅

**What it tests:** Producer adds actor to wishlist

**Steps:**
1. **Window 1:** Login as Actor
2. **Window 2:** Login as Producer
3. **Window 2:** Navigate to Search
4. **Window 2:** Find actor in search results
5. **Window 2:** Click heart/wishlist icon on actor card
6. **Window 1:** Check notification drawer

**Expected Result:**
```
🔔 Added to Wishlist
"[Producer Name] added you to their wishlist"
Action: Click → Navigate to /discover/profile
```

**Verification:**
- Notification appears immediately
- Producer name shown
- Click navigates to actor's own profile

---

### **6. Monthly Profile Views** ✅ (Premium Only)

**What it tests:** Auto-triggered monthly analytics summary

**Steps:**
1. Login as Premium Actor
2. Open browser console (F12)
3. Clear localStorage key:
   ```javascript
   const userId = 'YOUR_ACTOR_ID'; // Get from Firebase
   const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
   localStorage.removeItem(`analytics_sent_${userId}_${monthKey}`);
   ```
4. Refresh page (Ctrl+R)
5. Check notification drawer

**Expected Result:**
```
🔔 Monthly Profile Views
"Your profile got 15 views this month — View full analytics"
Action: Click → Navigate to /discover/settings/analytics
```

**Verification:**
- Only appears for premium actors
- Shows actual view count from last month
- Only sends once per month

**Note:** Requires analytics data in Firestore:
```
user_analytics/{actorId}/daily/{YYYYMM01}
  - profileViews: 15
```

---

### **7. Monthly Search Appearances** ✅ (Premium Only)

**What it tests:** Auto-triggered monthly search analytics

**Steps:**
1. Login as Premium Actor
2. Open browser console (F12)
3. Clear localStorage key:
   ```javascript
   const userId = 'YOUR_ACTOR_ID';
   const monthKey = new Date().toISOString().slice(0, 7);
   localStorage.removeItem(`analytics_sent_${userId}_${monthKey}`);
   ```
4. Refresh page
5. Check notification drawer

**Expected Result:**
```
🔔 Monthly Search Appearances
"You appeared in 42 searches this month — View full analytics"
Action: Click → Navigate to /discover/settings/analytics
```

**Verification:**
- Only for premium actors
- Shows search impression count
- Sent with monthly profile views

---

### **8. Profile Completeness Reminder** ✅

**What it tests:** Auto-triggered weekly reminder for incomplete profiles

**Steps:**
1. Login as Actor with incomplete profile (< 80% complete)
2. Open browser console (F12)
3. Clear localStorage key:
   ```javascript
   const userId = 'YOUR_ACTOR_ID';
   const now = new Date();
   const weekKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-W${Math.ceil(now.getDate() / 7)}`;
   localStorage.removeItem(`profile_reminder_${userId}_${weekKey}`);
   ```
4. Refresh page
5. Check notification drawer

**Expected Result:**
```
🔔 Complete Your Profile
"Your profile is 60% complete. Add more details to increase visibility"
Action: Click → Navigate to /discover/edit-profile
```

**Verification:**
- Only for profiles < 80% complete
- Shows actual percentage
- Sends once per week

**To test different percentages:**
- Remove fields from actor profile in Firebase Console
- Completeness calculated from 10 fields:
  - stageName, bio, profileImage, age, gender, height, weight, location, skills, languages

---

### **9. Visibility Suggestion** ✅

**What it tests:** Auto-triggered monthly suggestion for low-visibility profiles

**Steps:**
1. Login as Actor with low profile views (< 10 views)
2. Open browser console (F12)
3. Clear localStorage key:
   ```javascript
   const userId = 'YOUR_ACTOR_ID';
   const monthKey = new Date().toISOString().slice(0, 7);
   localStorage.removeItem(`visibility_suggestion_${userId}_${monthKey}`);
   ```
4. Refresh page
5. Check notification drawer

**Expected Result:**
```
🔔 Improve Your Visibility
"Add more photos and videos to your profile to increase visibility. Complete profiles get 3x more views!"
Action: Click → Navigate to /discover/edit-profile
```

**Verification:**
- Only for actors with < 10 profile views
- Sends once per month
- Provides actionable suggestion

---

### **10. Subscription Reminder** ✅

**What it tests:** Auto-triggered reminder before subscription expires

**Steps:**
1. Login as Premium Actor
2. Set subscription expiry to 3 days from now in Firebase:
   ```
   profiles/{actorId}/actorProfile
     - isSubscribed: true
     - subscriptionExpiryDate: [3 days from now]
   ```
3. Refresh page
4. Check notification drawer

**Expected Result:**
```
🔔 Subscription Expiring Soon
"Your premium subscription expires in 3 days. Renew to keep premium features"
Action: Click → Navigate to /discover/settings/subscription
```

**Verification:**
- Triggers at 7, 3, and 1 day before expiry
- Shows exact days remaining
- Only for premium actors

**Test all thresholds:**
- Set expiry to 7 days → Check notification
- Set expiry to 3 days → Check notification
- Set expiry to 1 day → Check notification

---

### **11. Security Alert** ✅

**What it tests:** Manual admin trigger for security events

**Steps:**
1. Login as Actor
2. Open browser console (F12)
3. Inject AdminNotificationService and trigger:
   ```javascript
   // In Angular component or console:
   import { inject } from '@angular/core';
   import { AdminNotificationService } from './services/admin-notification.service';
   
   const adminService = inject(AdminNotificationService);
   await adminService.sendSecurityAlert(
     'YOUR_ACTOR_ID',
     'actor',
     'Chrome on Windows 11',
     '192.168.1.100'
   );
   ```
4. Check notification drawer

**Expected Result:**
```
🔔 New Device Login
"New login detected from Chrome on Windows 11. If this wasn't you, secure your account immediately"
Action: Click → Navigate to /discover/settings/account
```

**Verification:**
- Shows device info
- Shows IP address in metadata
- Action navigates to account settings

**Alternative Test (Backend):**
Create a test endpoint or Cloud Function to trigger security alerts.

---

### **12. Platform Update** ✅

**What it tests:** Manual admin announcement to actors

**Steps:**
1. Login as Actor
2. Trigger via admin service:
   ```javascript
   await adminService.sendPlatformUpdate(
     'actor',
     'New Feature: Video Portfolios',
     'You can now upload video portfolios to showcase your talent!'
   );
   ```
3. Check notification drawer

**Expected Result:**
```
🔔 New Feature: Video Portfolios
"You can now upload video portfolios to showcase your talent!"
Action: Click → Navigate to /discover/feed
```

**Verification:**
- Custom title and message
- Sent to all actors
- Action navigates to feed

---

## 🎬 PRODUCER NOTIFICATIONS (8 Types)

### **1. Connection Accepted** ✅

**What it tests:** Actor accepts producer's connection request

**Steps:**
1. **Window 1:** Login as Producer (with pending request sent)
2. **Window 2:** Login as Actor
3. **Window 2:** Navigate to Chat → Requests
4. **Window 2:** Click "Accept" on producer's request
5. **Window 1:** Check notification drawer

**Expected Result:**
```
🔔 Connection Accepted
"[Actor Name] accepted your connection request — Start chatting"
Action: Click → Navigate to chat room
```

**Verification:**
- Notification appears immediately
- Chat room ID in metadata
- Click opens chat with actor

---

### **2. Connection Declined** ✅

**What it tests:** Actor declines producer's connection request

**Steps:**
1. **Window 1:** Login as Producer (with pending request sent)
2. **Window 2:** Login as Actor
3. **Window 2:** Navigate to Chat → Requests
4. **Window 2:** Click "Decline" on producer's request
5. **Window 1:** Check notification drawer

**Expected Result:**
```
🔔 Connection Declined
"[Actor Name] declined your connection request"
Action: Click → Navigate to /discover/search
```

**Verification:**
- Notification appears immediately
- Suggests searching for other actors
- Actor name shown

---

### **3. New Message from Actor** ✅

**What it tests:** Actor sends message in active chat

**Steps:**
1. **Window 1:** Login as Producer
2. **Window 2:** Login as Actor
3. **Window 2:** Navigate to Chat → Find producer's chat room
4. **Window 2:** Type message: "Yes, I'm interested in your project!"
5. **Window 2:** Press Send
6. **Window 1:** Check notification drawer (don't open chat)

**Expected Result:**
```
🔔 New message from [Actor Name]
"Yes, I'm interested in your project!"
Action: Click → Navigate to chat room
```

**Verification:**
- Message preview shown (first 100 chars)
- Unread count increments
- Click opens specific chat room

---

### **4. Wishlist Matches** ✅

**What it tests:** Auto-triggered when wishlisted actors upload new content

**Steps:**
1. Login as Producer
2. Add 2-3 actors to wishlist (heart icon)
3. **As those actors:** Upload new photos/videos
4. **Next day:** Login as Producer
5. Open browser console (F12)
6. Clear localStorage key:
   ```javascript
   const userId = 'YOUR_PRODUCER_ID';
   const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
   localStorage.removeItem(`wishlist_matches_${userId}_${today}`);
   ```
7. Refresh page
8. Check notification drawer

**Expected Result:**
```
🔔 New Actor Matches
"3 new actors match your wishlist criteria"
Action: Click → Navigate to /discover/search
```

**Verification:**
- Shows count of new uploads
- Only checks wishlisted actors
- Sends once per day

**Note:** Requires:
- Actors in wishlist collection
- Recent uploads in `userUploads/{actorId}/uploads` (last 24 hours)

---

### **5. Database Growth** ✅

**What it tests:** Auto-triggered weekly update about new actors

**Steps:**
1. Login as Producer
2. Open browser console (F12)
3. Clear localStorage key:
   ```javascript
   const userId = 'YOUR_PRODUCER_ID';
   const now = new Date();
   const weekKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-W${Math.ceil(now.getDate() / 7)}`;
   localStorage.removeItem(`database_growth_${userId}_${weekKey}`);
   ```
4. Refresh page
5. Check notification drawer

**Expected Result:**
```
🔔 Actor Database Growth
"Database increased by 25% — 25 new actors joined this week"
Action: Click → Navigate to /discover/search
```

**Verification:**
- Shows new actor count
- Sends once per week
- Encourages discovery

**Note:** Requires new actors in `users` collection with:
- `currentRole: 'actor'`
- `createdAt` within last 7 days

---

### **6. Subscription Billing** ✅

**What it tests:** Manual admin billing reminder

**Steps:**
1. Login as Producer
2. Trigger via admin service:
   ```javascript
   await adminService.sendProducerBillingReminder(
     'YOUR_PRODUCER_ID',
     'Your subscription will renew on Jan 15, 2026 for $29.99'
   );
   ```
3. Check notification drawer

**Expected Result:**
```
🔔 Billing Update
"Your subscription will renew on Jan 15, 2026 for $29.99"
Action: Click → Navigate to /discover/settings/subscription
```

**Verification:**
- Custom billing message
- Action navigates to subscription settings
- Premium flag in metadata

---

### **7. Security Alert (Producer)** ✅

**What it tests:** Manual admin security notification

**Steps:**
1. Login as Producer
2. Trigger via admin service:
   ```javascript
   await adminService.sendSecurityAlert(
     'YOUR_PRODUCER_ID',
     'producer',
     'Safari on MacOS',
     '203.0.113.0'
   );
   ```
3. Check notification drawer

**Expected Result:**
```
🔔 New Device Login
"New login detected from Safari on MacOS. If this wasn't you, secure your account immediately"
Action: Click → Navigate to /discover/settings/account
```

**Verification:**
- Shows device and IP
- Urgent tone
- Action to account settings

---

### **8. Platform Update (Producer)** ✅

**What it tests:** Manual admin announcement to producers

**Steps:**
1. Login as Producer
2. Trigger via admin service:
   ```javascript
   await adminService.sendPlatformUpdate(
     'producer',
     'New Feature: Advanced Search Filters',
     'Find the perfect talent with our new advanced search filters!'
   );
   ```
3. Check notification drawer

**Expected Result:**
```
🔔 New Feature: Advanced Search Filters
"Find the perfect talent with our new advanced search filters!"
Action: Click → Navigate to /discover/feed
```

**Verification:**
- Custom title and message
- Sent to all producers
- Action navigates to feed

---

## 🔧 TESTING UTILITIES

### **Quick localStorage Clear Script**

```javascript
// Clear all notification throttles for testing
function clearAllNotificationThrottles(userId) {
  const keys = Object.keys(localStorage);
  const notificationKeys = keys.filter(key => 
    key.includes('analytics_sent_') ||
    key.includes('profile_reminder_') ||
    key.includes('subscription_reminder_') ||
    key.includes('visibility_suggestion_') ||
    key.includes('wishlist_matches_') ||
    key.includes('database_growth_')
  );
  
  notificationKeys.forEach(key => {
    if (key.includes(userId)) {
      localStorage.removeItem(key);
      console.log('Cleared:', key);
    }
  });
  
  console.log(`Cleared ${notificationKeys.length} notification throttles`);
}

// Usage:
clearAllNotificationThrottles('YOUR_USER_ID');
location.reload();
```

### **Check Notification Count**

```javascript
// In browser console
const notificationBadge = document.querySelector('.notification-badge');
console.log('Unread count:', notificationBadge?.textContent);
```

### **Manually Trigger Notification (Dev Only)**

```javascript
// In component with NotificationService injected
await this.notificationService.createConnectionRequestNotification(
  'actorId123',
  'producerId456',
  'Test Producer',
  'room789',
  'https://example.com/photo.jpg'
);
```

---

## 📊 TESTING CHECKLIST

### **Actor Notifications**
- [ ] Connection Request
- [ ] Connection Established
- [ ] New Message from Producer
- [ ] Profile Viewed (Premium)
- [ ] Profile Viewed (Free)
- [ ] Added to Wishlist
- [ ] Monthly Profile Views
- [ ] Monthly Search Appearances
- [ ] Profile Completeness Reminder
- [ ] Visibility Suggestion
- [ ] Subscription Reminder (7 days)
- [ ] Subscription Reminder (3 days)
- [ ] Subscription Reminder (1 day)
- [ ] Security Alert
- [ ] Platform Update

### **Producer Notifications**
- [ ] Connection Accepted
- [ ] Connection Declined
- [ ] New Message from Actor
- [ ] Wishlist Matches
- [ ] Database Growth
- [ ] Subscription Billing
- [ ] Security Alert
- [ ] Platform Update

### **General Functionality**
- [ ] Notification drawer opens/closes
- [ ] Unread count badge updates
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Click notification navigates correctly
- [ ] Real-time updates (no refresh needed)
- [ ] Notifications persist after refresh
- [ ] Premium gating works correctly

---

## 🐛 TROUBLESHOOTING

### **Notification not appearing?**
1. Check browser console for errors
2. Verify user is logged in
3. Check Firestore rules allow notification creation
4. Verify localStorage throttle isn't blocking (clear it)
5. Check notification was created in Firestore Console

### **Auto-trigger not working?**
1. Clear localStorage throttle key
2. Verify user role is correct (actor vs producer)
3. Check profile data exists in Firestore
4. Verify analytics data exists (for analytics notifications)
5. Check subscription status (for premium notifications)

### **Click action not working?**
1. Verify `actionUrl` is set in notification
2. Check Angular routing is configured
3. Verify user has permission to access route

### **Real-time updates not working?**
1. Check Firestore connection
2. Verify onSnapshot listener is active
3. Check browser console for errors
4. Verify Firestore indexes are deployed

---

## 📞 SUPPORT

For issues or questions:
- Check `NOTIFICATION_SYSTEM_COMPLETE.md` for implementation details
- Check `SENIOR_ANALYSIS_NOTIFICATION_SYSTEM.md` for architecture
- Review `NotificationService` source code
- Check Firestore Console for data verification

---

**Happy Testing!** 🎉
