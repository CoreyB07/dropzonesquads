# DropZoneSquads Messaging Redesign Plan

## 0) Project Setup / Alignment
- [x] Confirm stack (Vite + React + Tailwind + Supabase)
- [x] Identify current messaging routes/components
- [x] Define MVP scope: regular messaging (no typing/presence channels)
- [x] Confirm online indicator approach (2-min heartbeat, 3-min online window)

## 1) UX + Spec Lock
- [x] Finalize desktop layout (conversation list + thread view)
- [x] Finalize mobile behavior (stacked list/thread flow baseline)
- [x] Define system states (loading/empty/error/offline/no-results)
- [x] Finalize component map:
  - [x] `ConversationList`
  - [x] `ConversationListItem`
  - [x] `ThreadView`
  - [x] `MessageBubble`
  - [x] `MessageComposer`
  - [x] `OnlineStatusBadge`

## 2) Frontend Foundation (Step 1 started)
- [x] Create scaffold route: `/messages`
- [x] Add two-pane shell (list + thread)
- [x] Add mock data render path for rapid iteration
- [x] Add local send interaction for shell validation
- [ ] Hook route into main nav

## 3) Core Messaging Behavior (In Progress)
- [x] Wire conversations from Supabase
- [x] Wire messages by active conversation (latest 50)
- [x] Add cursor pagination for older messages
- [x] Implement send flow + draft recovery on error
- [x] Add read/unread updates (local read state integration)
- [x] Add message timestamps and bubble structure
- [x] Add conversation search + unread filter
- [x] Add grouped bubble spacing by sender

## 4) Online Status (Supabase Free Tier)
- [x] Backend SQL prepared/applied (`profiles.last_seen_at`, RPC `touch_last_seen`)
- [x] Build client heartbeat utility (every 2 minutes + on tab focus)
- [x] Fetch `last_seen_at` with conversation participants
- [x] Frontend rule: online if `now - last_seen_at <= 3 minutes`
- [x] Show "Last seen Xm ago" when offline

## 5) Performance / Free Tier Guardrails
- [x] Cursor-style pagination for messages (load older)
- [x] Restrict realtime to active thread events only
- [x] Avoid global message subscriptions
- [x] Keep attachment limits conservative in MVP (2MB + limited file types)

## 6) Accessibility + QA
- [ ] Keyboard navigation and focus order
- [ ] Contrast + readable status text
- [x] Empty/loading/error state pass
- [x] Mobile pass baseline (list/thread toggle)

## 7) Release
- [ ] Staging validation
- [ ] Production deploy
- [ ] Post-launch bug sweep
