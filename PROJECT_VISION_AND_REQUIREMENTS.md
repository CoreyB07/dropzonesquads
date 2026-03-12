# DropZoneSquads — Product Vision & Requirements (Canonical)

Last updated: 2026-03-11
Owner intent source: direct project guidance from Corey

## 1) Product Purpose
DropZoneSquads exists to help Call of Duty Warzone players find teammates, build squads, and stay connected.

## 2) Access Model (Guest vs Member)
- Guests can browse the website and view public squad listings.
- Membership/sign-in is required for interactive features:
  - Send friend requests
  - Send squad join requests
  - Use squad chat
  - Use direct messages
  - Receive notifications

## 3) Privacy Requirements (Activision ID)
Activision IDs must be protected from public scraping/spam.

### Rules
- `activision_id` is stored privately.
- It is **not** publicly visible on listings/search pages.
- Sharing is controlled by user toggles only:
  - `share_activision_id_with_friends`
  - `share_activision_id_with_squads`
- `activision_id_public` is deprecated and should be removed.

### Visibility Logic
A user’s Activision ID is visible only when:
1. viewer is the owner, or
2. viewer is an accepted friend **and** target enabled friend sharing, or
3. viewer shares a squad with target **and** target enabled squad sharing.

## 4) Social Graph + Membership Flows
### Friendships
- statuses: `pending`, `accepted`, `blocked`
- users can send request, accept request, block user, and unfriend/remove relationship.

### Squad Join Requests
- users can request to join squads.
- squad leaders/managers can accept/reject.

## 5) Messaging Model
Use one unified messaging system.

### Required tables/components
- `conversations` (`direct` or `squad`)
- `conversation_participants`
- `messages`
- `notifications`

### Allowed Messaging
- Direct Messages allowed only when users are:
  - accepted friends, or
  - members of at least one shared squad.
- Squad chat allowed only for squad members.

## 6) Notifications (Required)
Notifications should exist for:
- friend request received
- friend request accepted
- squad join request received (to squad managers)
- squad join request accepted/rejected (to applicant)
- new direct message
- new squad chat message

## 7) Removed / Out of Scope Features
- Community chat (global chat) is removed.
- Squad profile comments are removed.

## 8) Retention Rules
- Keep latest 100 squad chat messages per squad conversation.
- Keep latest 20 direct messages per direct conversation.
- Keep latest 100 notifications per user.

## 9) Security / Data Access Rules
- Never expose raw `profiles.activision_id` in public client queries.
- Use secure RPC/function for shared Activision ID retrieval.
- Enforce RLS for all messaging and notification reads/writes.
- Non-members cannot read squad conversations.
- Unrelated users cannot DM each other.

## 10) UX Intent
- Browsing should feel open and easy without login.
- Interactive actions should gently prompt sign-in.
- Activision ID should remain private by default.
- Where shared, prefer masked display + copy action.

## 11) Canonical Source Note
If any older markdown file conflicts with this document, this file is the source of truth.
