# Chat UX Upgrade Implementation Guide

## Overview
This document describes the comprehensive UX upgrade for the chat system including:
1. **Date Grouping** - Messages grouped by day with visual separators
2. **Producer Status Banners** - Clear status indicators for chat requests
3. **Re-opening Declined Requests** - Producers can message again after being declined
4. **Block-Only Restrictions** - Only user blocks prevent messaging, not rejections

## Implementation Status

### ✅ Completed Changes

#### 1. ChatService Updates (`chat.service.ts`)

**Added `observeRoom()` method:**
```typescript
observeRoom(roomId: string): Observable<ChatRoom & { id: string }> {
  const roomRef = doc(this.db, 'chatRooms', roomId);
  return docData(roomRef, { idField: 'id' }) as Observable<ChatRoom & { id: string }>;
}
```

**Updated `sendMessage()` to reset rejection flags:**
```typescript
// LOGIC UPDATE: Check if producer is re-sending after rejection
const roomSnap = await getDoc(roomRef);
const roomData = roomSnap.data();

const updateData: any = {
  lastMessage: { ...message, id: created.id },
  actorCanSee: true,
  updatedAt: serverTimestamp(),
  [`unreadCount.${receiverId}`]: increment(1)
};

// If producer is sending and room was previously rejected, reset the rejection
if (roomData && senderId === roomData['producerId'] && roomData['actorRejected'] === true) {
  updateData.actorRejected = false;
  updateData.actorAccepted = false; // Reset to pending state
}

await updateDoc(roomRef, updateData);
```

### 📋 Required ChatComponent Updates

The chat component needs the following additions:

#### 1. Add GroupedMessage Interface

Add this interface at the top of the component file (after imports):

```typescript
// Interface for Date Grouping
interface GroupedMessage {
  type: 'date' | 'message';
  dateLabel?: string;
  message?: ChatMessage & { id: string };
}
```

#### 2. Add New Signals and Computed Properties

Add these to the component class:

```typescript
// Raw messages from Firestore (for date grouping)
rawMessages = signal<(ChatMessage & { id: string })[]>([]);

// Current room metadata (for status checks)
currentRoom = signal<ChatRoom | null>(null);

// Computed: Messages grouped by date
groupedMessages = computed<GroupedMessage[]>(() => {
  const msgs = this.rawMessages();
  if (!msgs.length) return [];

  const groups: GroupedMessage[] = [];
  let lastDate = '';

  msgs.forEach(msg => {
    let msgDate: Date;
    if (msg.timestamp && (msg.timestamp as any).toDate) {
      msgDate = (msg.timestamp as any).toDate();
    } else if (msg.timestamp instanceof Date) {
      msgDate = msg.timestamp;
    } else {
      msgDate = new Date();
    }

    const dateStr = this.getDateLabel(msgDate);
    
    if (dateStr !== lastDate) {
      groups.push({ type: 'date', dateLabel: dateStr });
      lastDate = dateStr;
    }
    groups.push({ type: 'message', message: msg });
  });

  return groups;
});

// Producer status computed signals
showProducerRequestSent = computed(() => {
  if (this.myRole() !== 'producer') return false;
  const room = this.currentRoom();
  const msgs = this.rawMessages();
  return msgs.length > 0 && room && !room.actorAccepted && !room.actorRejected;
});

showProducerRequestAccepted = computed(() => {
  if (this.myRole() !== 'producer') return false;
  const room = this.currentRoom();
  return room && room.actorAccepted === true;
});

showProducerRequestDeclined = computed(() => {
  if (this.myRole() !== 'producer') return false;
  const room = this.currentRoom();
  return room && room.actorRejected === true;
});

// Actor actions visibility
showActorActions = computed(() => {
  if (this.myRole() !== 'actor') return false;
  const room = this.currentRoom();
  return room && !room.actorAccepted && !room.actorRejected;
});

// Block state (only blocks prevent messaging, not rejections)
amIBlocked = signal(false);
```

#### 3. Add Helper Method for Date Labels

```typescript
private getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}
```

#### 4. Update `open()` Method

Add room metadata observation:

```typescript
open(c: Conversation) {
  // ... existing code ...
  
  // Observe room metadata for status updates
  this.roomsSub.add(
    this.chat.observeRoom(c.id).subscribe(async (roomData) => {
      if (roomData) {
        this.currentRoom.set(roomData as ChatRoom);
        
        // Determine counterpart ID
        const counterpartId = (roomData as ChatRoom).actorId === this.meUid 
          ? (roomData as ChatRoom).producerId 
          : (roomData as ChatRoom).actorId;

        // Check Block Status
        if (counterpartId) {
          const blocked = await this.blockService.isUserBlockedBy(this.meUid, counterpartId);
          this.amIBlocked.set(blocked);
        }
      }
    })
  );
  
  // ... rest of existing code ...
}
```

#### 5. Update Messages Stream

Replace the messages$ observable to populate rawMessages signal:

```typescript
// In ngOnInit, update the messages$ pipe:
this.messages$ = this.active$!.pipe(
  filter((c): c is Conversation => !!c),
  switchMap((c: Conversation) => {
    return this.chat.observeMessages(c.id);
  }),
  tap((msgs: (ChatMessage & { id: string })[]) => {
    // Update raw messages for date grouping
    this.rawMessages.set(msgs);
    
    // Mark messages as delivered
    const activeConv = this.active();
    if (activeConv && this.meUid) {
      this.chat.markMessagesAsDelivered(activeConv.id, this.meUid);
    }
  }),
  map((msgs: (ChatMessage & { id: string })[]) => msgs.map((m: ChatMessage & { id: string }) => {
    const from: 'me' | 'them' = m.senderId === this.meUid! ? 'me' : 'them';
    const status = from === 'me' ? this.getMessageStatus(m) : undefined;
    return {
      id: m.id!,
      from,
      text: m.text,
      time: this.formatTime(m.timestamp),
      status,
    } as Message;
  })),
  shareReplay(1)
);
```

#### 6. Update `send()` Method

Remove the rejection check (only block check remains):

```typescript
async send() {
  const txt = this.draft.trim();
  if (!txt || !this.active() || !this.meUid || this.isSending) return;

  // REMOVED: Rejection check - producers can now re-send after being declined
  // Only block check remains
  if (this.amIBlocked()) {
    return; // Blocked users cannot send
  }

  // ... rest of send logic ...
}
```

### 🎨 Template Updates

The template needs to be updated to show:

1. **Date Separators** between message groups
2. **Producer Status Banners** for different states
3. **Input disabled only on block** (not on rejection)

Key template sections to update:

```html
<!-- Messages Area -->
<div class="messages-container">
  @for (item of groupedMessages(); track $index) {
    @if (item.type === 'date') {
      <!-- Date Separator -->
      <div class="flex justify-center my-4 sticky top-2 z-10">
        <span class="bg-neutral-800/80 backdrop-blur-sm text-neutral-400 text-xs px-3 py-1 rounded-full border border-white/5">
          {{ item.dateLabel }}
        </span>
      </div>
    } @else {
      <!-- Message Bubble -->
      <div class="message" [class.from-me]="item.message?.senderId === meUid">
        {{ item.message?.text }}
      </div>
    }
  }
  
  <!-- Producer Status Banners -->
  @if (showProducerRequestSent()) {
    <div class="status-banner sent">Chat request has been sent</div>
  }
  @if (showProducerRequestAccepted()) {
    <div class="status-banner accepted">Your chat request has been accepted</div>
  }
  @if (showProducerRequestDeclined()) {
    <div class="status-banner declined">Your chat request has been declined</div>
  }
  @if (amIBlocked()) {
    <div class="status-banner blocked">You have been blocked by this user</div>
  }
</div>

<!-- Input Area -->
<input 
  [(ngModel)]="draft"
  [disabled]="amIBlocked()"
  placeholder="Type a message..."
/>
```

## Testing Checklist

### Date Grouping
- [ ] Messages from today show "Today" separator
- [ ] Messages from yesterday show "Yesterday" separator
- [ ] Older messages show full date
- [ ] Date separators appear between different days
- [ ] Separators are sticky at top when scrolling

### Producer Status Banners
- [ ] "Send first message" shows when no messages exist
- [ ] "Request sent" shows after sending but before acceptance
- [ ] "Request accepted" shows after actor accepts
- [ ] "Request declined" shows after actor declines
- [ ] Banners update in real-time

### Re-opening Declined Requests
- [ ] Producer can type in input after being declined
- [ ] Sending new message resets actorRejected to false
- [ ] Sending new message resets actorAccepted to false
- [ ] Actor sees new request after producer re-sends
- [ ] Room status updates correctly in real-time

### Block Restrictions
- [ ] Input disabled when user is blocked
- [ ] Input enabled when request is only declined (not blocked)
- [ ] Block status updates in real-time
- [ ] Clear error message shown when blocked

## Migration Notes

### Backward Compatibility
- ✅ Existing rooms continue to work
- ✅ Old messages display correctly with date grouping
- ✅ No database migration required
- ✅ All existing features preserved

### Performance Considerations
- Date grouping computed signal is efficient (only recalculates when messages change)
- Room metadata observation is lightweight (single document)
- Block status check is cached per room

## Deployment Steps

1. Deploy updated `chat.service.ts`
2. Deploy updated `chat.component.ts`
3. Test in staging environment
4. Monitor for any issues
5. Deploy to production

## Known Limitations

1. Date separators use client timezone (intentional for UX)
2. Block status check happens on room open (not continuously monitored)
3. Status banners only show for current active conversation

## Future Enhancements

1. Add animation when date separators appear
2. Show "typing..." indicator in status area
3. Add sound notification for status changes
4. Persist collapsed/expanded state of date groups
