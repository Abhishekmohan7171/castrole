# Notification System Implementation Guide

## Overview
This document outlines the comprehensive notification system implemented for Kalacast, supporting both Actor and Producer user roles with real-time notifications for discover events, chat interactions, and premium analytics.

## Architecture

### 1. **Data Structure**

#### Firestore Schema
```
notifications/
  {userId}/
    items/
      {notificationId}/
        - userId: string
        - type: NotificationType
        - category: NotificationCategory
        - title: string
        - message: string
        - timestamp: Timestamp
        - read: boolean
        - actionUrl?: string
        - metadata: NotificationMetadata
```

#### TypeScript Interfaces
```typescript
type NotificationType = 
  | 'profile_view' 
  | 'wishlist' 
  | 'shortlist' 
  | 'chat_request' 
  | 'chat_accepted' 
  | 'message' 
  | 'analytics_view'
  | 'analytics_wishlist'
  | 'analytics_shortlist'
  | 'system';

type NotificationCategory = 'discover' | 'chat' | 'analytics' | 'system';

interface NotificationMetadata {
  actorId?: string;
  actorName?: string;
  actorPhotoUrl?: string;
  producerId?: string;
  producerName?: string;
  producerPhotoUrl?: string;
  chatId?: string;
  isPremium?: boolean;
  analyticsType?: string;
  viewCount?: number;
  profileId?: string;
}
```

### 2. **Notification Service** (`notification.service.ts`)

#### Key Features:
- Real-time notification listeners using Firestore snapshots
- Automatic unread count tracking
- Batch operations for marking notifications as read
- Type-safe notification creation methods
- Premium analytics notification support

#### Core Methods:

##### Initialization
```typescript
initializeNotifications(userId: string): void
```
Sets up real-time listener for user's notifications.

##### Actor Notifications (Discover Events)
```typescript
createProfileViewNotification(actorId, producerId, producerName, producerPhotoUrl?)
createWishlistNotification(actorId, producerId, producerName, producerPhotoUrl?)
createShortlistNotification(actorId, producerId, producerName, producerPhotoUrl?)
```

##### Producer Notifications
```typescript
createChatAcceptedNotification(producerId, actorId, actorName, chatId, actorPhotoUrl?)
```

##### Analytics Notifications (Premium)
```typescript
createAnalyticsNotification(userId, userRole, analyticsType, count, isPremium)
createAnalyticsSummaryNotification(userId, isPremium, summaryData)
```

##### Chat Notifications
```typescript
createMessageNotification(recipientId, senderId, senderName, chatId, messagePreview, senderPhotoUrl?)
```

##### Management
```typescript
markAsRead(userId, notificationId): Promise<void>
markAllAsRead(userId): Promise<void>
deleteNotification(userId, notificationId): Promise<void>
```

### 3. **Notification Drawer Component**

#### Features:
- Responsive slide-in drawer (full width mobile, 480px tablet, 520px desktop)
- Real-time notification updates
- Category badges (discover, chat, analytics, system)
- Premium notification indicators
- Themed UI for Actor/Producer roles
- Click-to-navigate functionality
- Mark as read on click
- Bulk mark all as read
- Empty state handling

#### Visual Design:
- **Actor Theme**: Purple gradients and accents
- **Producer Theme**: Neutral/fuchsia colors
- **Premium Badge**: Amber color indicator
- **Category Badges**: Color-coded by category
- **Notification Icons**: Type-specific SVG icons
- **Unread Indicator**: Colored dot badge

## Integration Points

### 1. **Feed Component Integration** (Profile Views)

Add to `feed.component.ts` when a producer views an actor's profile:

```typescript
import { NotificationService } from '../services/notification.service';

constructor(private notificationService: NotificationService) {}

async viewActorProfile(actorId: string, actorName: string) {
  // Existing profile view logic...
  
  // Create notification for actor
  if (this.currentUserId && this.currentUserRole === 'producer') {
    await this.notificationService.createProfileViewNotification(
      actorId,
      this.currentUserId,
      this.currentUserName,
      this.currentUserPhotoUrl
    );
  }
}
```

### 2. **Wishlist/Shortlist Integration**

When producer adds actor to wishlist/shortlist:

```typescript
async addToWishlist(actorId: string) {
  // Existing wishlist logic...
  
  await this.notificationService.createWishlistNotification(
    actorId,
    this.currentUserId,
    this.currentUserName,
    this.currentUserPhotoUrl
  );
}

async addToShortlist(actorId: string) {
  // Existing shortlist logic...
  
  await this.notificationService.createShortlistNotification(
    actorId,
    this.currentUserId,
    this.currentUserName,
    this.currentUserPhotoUrl
  );
}
```

### 3. **Chat Component Integration** (Chat Request Acceptance)

Add to `chat.component.ts` when actor accepts producer's chat request:

```typescript
async acceptChatRequest(chatId: string, producerId: string, producerName: string) {
  // Existing accept logic...
  
  // Notify producer
  await this.notificationService.createChatAcceptedNotification(
    producerId,
    this.currentUserId,
    this.currentUserName,
    chatId,
    this.currentUserPhotoUrl
  );
}
```

### 4. **Analytics Integration** (Premium Feature)

Add to analytics section when user has premium subscription:

```typescript
// Daily/Weekly analytics summary
async sendAnalyticsSummary(userId: string, isPremium: boolean) {
  if (!isPremium) return;
  
  const summaryData = {
    views: await this.getViewCount(userId),
    wishlists: await this.getWishlistCount(userId),
    shortlists: await this.getShortlistCount(userId),
    period: 'daily' // or 'weekly'
  };
  
  await this.notificationService.createAnalyticsSummaryNotification(
    userId,
    isPremium,
    summaryData
  );
}

// Real-time analytics notification
async notifyAnalyticsEvent(userId: string, isPremium: boolean, type: 'view' | 'wishlist' | 'shortlist') {
  if (!isPremium) return;
  
  const count = await this.getRecentCount(userId, type);
  await this.notificationService.createAnalyticsNotification(
    userId,
    'actor', // or 'producer'
    type,
    count,
    isPremium
  );
}
```

## Firestore Security Rules

Add to `firestore.rules`:

```javascript
// Notification rules
match /notifications/{userId}/items/{notificationId} {
  // Users can only read their own notifications
  allow read: if request.auth != null && request.auth.uid == userId;
  
  // Users can update (mark as read) their own notifications
  allow update: if request.auth != null && 
                   request.auth.uid == userId &&
                   request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
  
  // System can create notifications for users
  allow create: if request.auth != null;
  
  // Users can delete their own notifications
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

## Firestore Indexes

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "items",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "items",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "read",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "items",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

## Notification Types by User Role

### **Actor Notifications**

#### Discover Category:
- ✅ `profile_view` - When a producer views their profile
- ✅ `wishlist` - When a producer adds them to wishlist
- ✅ `shortlist` - When a producer shortlists them

#### Chat Category:
- ✅ `message` - New messages from producers
- ✅ `chat_request` - New chat requests from producers

#### Analytics Category (Premium):
- ✅ `analytics_view` - Profile view analytics
- ✅ `analytics_wishlist` - Wishlist analytics
- ✅ `analytics_shortlist` - Shortlist analytics

### **Producer Notifications**

#### Discover Category:
- ✅ `profile_view` - When they view actor profiles (self-tracking)

#### Chat Category:
- ✅ `chat_accepted` - When actor accepts their chat request
- ✅ `message` - New messages from actors

#### Analytics Category (Premium):
- ✅ `analytics_view` - Search/profile view analytics
- ✅ Analytics summaries for engagement metrics

## Testing Checklist

### Actor Testing:
- [ ] Receive notification when producer views profile
- [ ] Receive notification when added to wishlist
- [ ] Receive notification when added to shortlist
- [ ] Receive chat request notifications
- [ ] Receive message notifications
- [ ] Premium: Receive analytics notifications
- [ ] Click notification navigates to correct page
- [ ] Mark as read functionality works
- [ ] Mark all as read works
- [ ] Unread count updates in real-time

### Producer Testing:
- [ ] Receive notification when actor accepts chat request
- [ ] Receive message notifications
- [ ] Premium: Receive analytics notifications
- [ ] Click notification navigates to correct page
- [ ] Mark as read functionality works
- [ ] Mark all as read works
- [ ] Unread count updates in real-time

### UI/UX Testing:
- [ ] Drawer opens/closes smoothly
- [ ] Responsive on mobile (full width)
- [ ] Responsive on tablet (480px)
- [ ] Responsive on desktop (520px)
- [ ] Theme colors correct for actor/producer
- [ ] Premium badge displays correctly
- [ ] Category badges display correctly
- [ ] Icons display correctly for each type
- [ ] Empty state displays when no notifications
- [ ] Timestamps show relative time correctly

## Performance Considerations

1. **Pagination**: Currently limited to 50 most recent notifications. Consider implementing pagination for users with many notifications.

2. **Indexing**: Ensure Firestore indexes are deployed for optimal query performance.

3. **Batch Operations**: Use batch writes when creating multiple notifications simultaneously.

4. **Real-time Listeners**: Automatically cleaned up on component destroy to prevent memory leaks.

5. **Premium Features**: Analytics notifications are gated by premium status to reduce unnecessary writes.

## Future Enhancements

1. **Push Notifications**: Integrate with Firebase Cloud Messaging for mobile push notifications
2. **Email Notifications**: Send email digests for important notifications
3. **Notification Preferences**: Allow users to customize which notifications they receive
4. **Notification History**: Archive old notifications instead of deleting
5. **Rich Notifications**: Add images, videos, or other media to notifications
6. **Action Buttons**: Add quick action buttons (Accept, Decline, etc.) directly in notifications
7. **Notification Grouping**: Group similar notifications (e.g., "5 producers viewed your profile")
8. **Sound/Vibration**: Add audio/haptic feedback for new notifications

## Maintenance

### Regular Tasks:
- Monitor Firestore read/write costs
- Clean up old notifications (>30 days)
- Review and optimize security rules
- Update notification templates as needed
- Monitor notification delivery success rates

### Troubleshooting:
- Check Firestore security rules if notifications aren't appearing
- Verify indexes are deployed if queries are slow
- Check browser console for any errors
- Verify user permissions and authentication state
- Test with different user roles (actor/producer)

## Support

For issues or questions about the notification system:
1. Check this documentation first
2. Review the NotificationService implementation
3. Check Firestore console for data structure
4. Review browser console for errors
5. Test with different user scenarios

---

**Last Updated**: December 24, 2025
**Version**: 1.0.0
**Status**: ✅ Fully Implemented
