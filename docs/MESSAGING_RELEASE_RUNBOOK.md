# Messaging Redesign — Release Runbook (Step 6)

## Goal
Ship the new `/messages` experience safely with rollback options and clear verification points.

## Pre-Release Gate
- [ ] Latest `main` is green in CI/build
- [ ] Supabase SQL already applied:
  - `profiles.last_seen_at`
  - `public.touch_last_seen()`
  - required RLS policies
- [ ] Test account A + B available for messaging checks
- [ ] Browser cache hard-refresh done before QA pass

## Staging Validation Checklist
### A) Routing + Navigation
- [ ] Navbar shows **Messages** link on desktop
- [ ] Mobile menu shows **Messages** link
- [ ] `/messages` loads for authenticated users
- [ ] Unauthenticated users see sign-in guard text

### B) Conversation List
- [ ] Conversation list renders with avatars, preview, timestamps
- [ ] Search filters by username/preview
- [ ] Unread-only toggle works
- [ ] Keyboard navigation works (Arrow Up/Down, Enter/Space)

### C) Thread View
- [ ] Selecting a conversation opens thread
- [ ] Sending text message works
- [ ] Failed send restores draft text
- [ ] Message grouping appears for consecutive same-sender messages
- [ ] "Load older messages" fetches older page

### D) Presence + Status
- [ ] Online indicator shows when last_seen within 3 min
- [ ] Offline label shows "Last seen Xm ago"
- [ ] Heartbeat updates every ~2 min and on tab focus

### E) Mobile UX
- [ ] List → thread transition works
- [ ] Back button returns to conversation list
- [ ] Composer usable without layout overlap

### F) Attachment Guardrails
- [ ] Allowed types accepted: JPG/PNG/WEBP/PDF/TXT
- [ ] >2MB files blocked with error
- [ ] Selected file name appears before send

## Production Rollout
1. Merge latest messaging commits to `main`
2. Trigger production deploy (GitHub Actions / hosting pipeline)
3. Run smoke tests (below) within 10 minutes of deploy
4. Monitor console/Supabase logs for errors for first 30 minutes

## Post-Launch Smoke Tests (Fast Pass)
- [ ] User A sends DM to User B in `/messages`
- [ ] User B receives message in active thread
- [ ] Unread badge decreases after opening thread
- [ ] Presence reflects online/offline correctly
- [ ] Pagination still loads older messages
- [ ] Mobile pass on at least one phone-sized viewport

## Rollback Plan
If critical breakage occurs:
1. Revert to previous known-good commit in `main`
2. Redeploy
3. Keep `/inbox` as operational fallback while fixing `/messages`

## Metrics to watch first 24h
- message send failures
- thread load errors
- profile/presence query failures
- client console errors in `/messages`
