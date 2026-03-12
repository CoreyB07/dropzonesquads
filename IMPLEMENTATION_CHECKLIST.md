# DropZoneSquads — Implementation Checklist

Use this checklist as the execution plan before coding.

## Phase 0 — Pre-flight
- [ ] Confirm Supabase project + env keys are valid in local + production
- [ ] Create DB backup/snapshot before schema migration
- [ ] Create a migration branch (example: `feat/messaging-unification`)
- [ ] Confirm canonical requirements doc: `PROJECT_VISION_AND_REQUIREMENTS.md`

## Phase 1 — Schema & Security (Supabase first)
- [ ] Remove `activision_id_public` from schema and app usage
- [ ] Finalize `conversations` table with `type IN ('direct','squad')`
- [ ] Finalize `conversation_participants`
- [ ] Finalize unified `messages`
- [ ] Finalize unified `notifications`
- [ ] Add helper functions:
  - [ ] can users DM?
  - [ ] is user in squad conversation?
  - [ ] can viewer read target Activision ID?
- [ ] Add/verify indexes for inbox and unread performance
- [ ] Enforce strict RLS on all new/updated tables
- [ ] Add uniqueness guard for duplicate squad applications

## Phase 2 — Messaging/Notification backend behavior
- [ ] Create/reuse direct conversation when DM starts
- [ ] Create squad conversation when squad is created
- [ ] Add participants when squad membership changes
- [ ] Insert notifications for friend request events
- [ ] Insert notifications for squad join request events
- [ ] Insert notifications for DM and squad chat events
- [ ] Add cleanup jobs for retention rules (100/20/100)

## Phase 3 — Frontend migration
- [ ] Remove all `direct_messages` usage
- [ ] Replace with unified `messages`
- [ ] Update Inbox to read unified conversation/message model
- [ ] Update Navbar unread count to unified model
- [ ] Update DirectMessage page to new model
- [ ] Update SquadChat page to new model
- [ ] Remove squad comments UI/logic from SquadProfile
- [ ] Remove community chat remnants from pages and nav

## Phase 4 — Profile privacy UX
- [ ] Remove `activisionIdPublic` UI/state from Profile/AuthContext/Onboarding
- [ ] Keep only 2 toggles:
  - [ ] share with friends
  - [ ] share with squads
- [ ] Ensure client uses secure function for Activision ID sharing
- [ ] Verify no public endpoint leaks raw Activision IDs

## Phase 5 — QA matrix
- [ ] Guest can browse; guest cannot send requests/messages
- [ ] Signed-in user can send friend request
- [ ] Friend request lifecycle: pending/accepted/blocked
- [ ] Squad join request lifecycle works
- [ ] Accepted friends can DM
- [ ] Shared squad users can DM
- [ ] Unrelated users cannot DM
- [ ] Squad members can read/send squad chat
- [ ] Non-members cannot access squad chat
- [ ] Notifications route to correct user only
- [ ] Retention cleanup works at target limits
- [ ] Activision ID visible only when policy allows

## Phase 6 — Cleanup & release
- [ ] Remove dead code from old mixed chat system
- [ ] Update README with final architecture and rules
- [ ] Add short "operator notes" for next developer
- [ ] Merge to main after QA pass
