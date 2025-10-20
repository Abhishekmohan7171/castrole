# Chat Feature Documentation

This document explains the chat architecture, data model, read receipts, privacy controls, and how the UI and services work together in `castrole`.

## Overview

- **App structure**
  - UI: `src/app/discover/chat.component.ts`
  - Service: `src/app/services/chat.service.ts`
  - Types: `src/assets/interfaces/interfaces.ts`
  - Settings (privacy): `src/app/discover/settings.component.ts`
- **Transport**: Firebase Firestore collections per room, real-time listeners.
- **Read receipts**: delivered and seen. Seen respects user privacy setting.

## Firestore Data Model

### Collections

- `chatRooms/{roomId}`
  - `participants: string[]`
  - `unreadCount: Record<uid, number>` (when used)
  - `typingUsers: Record<uid, Timestamp>`
  - other room metadata

- `chatRooms/{roomId}/messages/{messageId}` (message document)
  - `chatRoomId: string`
  - `senderId: string`
  - `receiverId: string`
  - `text: string`
  - `timestamp: serverTimestamp()`
  - `read: boolean` (default false)
  - `messageType: 'text' | 'image' | 'file'`
  - `deliveredAt?: Timestamp | null`
  - `readAt?: Timestamp | null`

- `users/{uid}`
  - `currentRole: 'actor' | 'producer' | ...`
  - `readReceipts?: boolean` (default true). When false, the app will not set `readAt` on messages, so senders never see blue ticks from this recipient.

## TypeScript Interfaces

Located in `src/assets/interfaces/interfaces.ts`.

- `ChatMessage`: includes `deliveredAt?: Timestamp | null` and `readAt?: Timestamp | null` for receipts.
- `Message`: UI-mapped item with `status?: 'sent' | 'delivered' | 'seen'`.
- `UserDoc`: includes `readReceipts?: boolean` privacy flag.

## Service Responsibilities (`chat.service.ts`)

- **sendMessage({ roomId, senderId, receiverId, text })**
  - Creates a message with `deliveredAt: null`, `readAt: null`, `read: false`.

- **observeMessages(roomId, limit = 50)**
  - Real-time listener ordered by `timestamp`.
  - Caches via `shareReplay({ bufferSize: 1, refCount: true })`.
  - Persists a copy in `localStorage` for fast first paint.

- **markMessagesAsDelivered(roomId, receiverId)**
  - Marks missing `deliveredAt` with `serverTimestamp()` for all messages where `receiverId` matches the current user. Called when messages arrive to the receiver.

- **markMessagesAsSeen(roomId, receiverId)**
  - Reads the recipient’s `users/{receiverId}` doc and checks `readReceipts`.
  - If `readReceipts !== false`: sets `read = true`, `readAt = serverTimestamp()` (blue tick for the sender), and sets `deliveredAt` if missing.
  - If `readReceipts === false`: only sets `read = true` (clears unread counts) and optionally `deliveredAt` if missing, but does not set `readAt` (no blue tick for the sender).
  - Implementation avoids composite indexes by filtering in code (query by `receiverId` only).

- **markMessagesAsRead(roomId, userId)**
  - Convenience that marks all as read (unread counters) and delegates to `markMessagesAsSeen`.

## UI Responsibilities (`chat.component.ts`)

- Subscribes to `messages$` from `observeMessages()`.
- On new messages, calls `markMessagesAsDelivered()` for the current user.
- When conversation is opened, calls `markMessagesAsRead()` for the current user (which flows into `markMessagesAsSeen()` and respects privacy).
- Maps each `ChatMessage` to a UI `Message` with a status via `getMessageStatus(message)`:
  - `seen` if `readAt` exists
  - `delivered` if `deliveredAt` exists (and no `readAt`)
  - `sent` otherwise

### Read Receipt Icons (in `chat.component.ts` template)

- **Sent**: single gray check ✓
- **Delivered**: double gray checks ✓✓
- **Seen**: double blue checks ✓✓

Icons use Tailwind classes:
- Gray: `text-neutral-400`
- Blue (seen): `text-blue-400`

## Privacy & Settings (`settings.component.ts`)

- Adds a toggle under "privacy & security" for `readReceipts`.
- Writes to `users/{uid}.readReceipts`.
- Behavior:
  - ON (default): opening a conversation sets `readAt` on received messages → senders see blue ticks.
  - OFF: opening a conversation sets `read = true` only (no `readAt`) → senders never see blue ticks for your reads. They still see delivered (double gray) when their device received your messages.

## Real-time Flow

1. Sender calls `sendMessage()` → UI shows optimistic outgoing with status `sent`.
2. Receiver’s listener gets the new message → service calls `markMessagesAsDelivered()` → sender sees `delivered`.
3. Receiver opens the chat → service calls `markMessagesAsSeen()` →
   - If receiver has `readReceipts !== false` → sender sees `seen` (blue ✓✓).
   - If receiver has `readReceipts === false` → sender continues to see `delivered` (gray ✓✓).

## Performance Notes

- `observeMessages()` uses `shareReplay({ bufferSize: 1, refCount: true })` for live updates and proper resubscription.
- Messages are cached in `localStorage` for initial fast load.
- Delivery/seen updates are done in batches via `writeBatch` to reduce writes.

## Troubleshooting

- **No blue ticks appear ever**
  - Ensure the recipient’s `users/{uid}.readReceipts` is true (or unset).
  - Confirm `markMessagesAsSeen()` is called when opening the conversation.
  - Check if message docs are getting `readAt` timestamps.

- **Delivered never appears**
  - Confirm `markMessagesAsDelivered()` executes when messages arrive for the current user and sets `deliveredAt`.

- **Messages show only after reload**
  - Verify `observeMessages()` subscription is active for the room.
  - Ensure no extra caching layer is returning stale data.

- **Old messages don’t flip to blue**
  - Only messages where the recipient opens the conversation while `readReceipts` is enabled will get `readAt`. Old messages won’t retroactively get blue ticks unless the conversation is opened again with read receipts enabled.

## Extending

- Add media message types by extending `messageType` and attaching storage URLs.
- Add pagination with `startAfter` and `limit` for large rooms.
- Hook unread counts into room list badges via `unreadCount[uid]` with batched increments/decrements.

## Security

- Firestore rules should ensure users can only read/write messages in rooms they participate in.
- Avoid shipping console logs in production; use a Logger service gated by env if needed.

## File References

- `src/app/services/chat.service.ts`
- `src/app/discover/chat.component.ts`
- `src/app/discover/settings.component.ts`
- `src/assets/interfaces/interfaces.ts`
