# DropZoneSquads — Work Status Handoff

Last updated: 2026-03-11 23:48 CDT

## What we completed

### Infrastructure / platform
- Created and switched app to a **new Supabase project**.
- Updated local env to new values:
  - `VITE_SUPABASE_URL=https://imdkaqhnnmgzgiykmxnz.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=...`
- Updated GitHub Actions secrets guidance and triggered deploy commit.
- Auth URL config guidance completed for:
  - `http://localhost:5173`
  - `https://www.dropzonesquads.com`
  - `https://dropzonesquads.com`

### Project docs / planning
- Added canonical requirements doc:
  - `PROJECT_VISION_AND_REQUIREMENTS.md`
- Added execution checklist:
  - `IMPLEMENTATION_CHECKLIST.md`
- Updated README references to planning docs.

### Database schema (Supabase)
- Rebuilt `supabase/schema.sql` from scratch around the new model:
  - private Activision ID sharing rules
  - `friendships`
  - `squad_applications`
  - unified `conversations`, `conversation_participants`, `messages`, `notifications`
  - RLS across key tables
  - retention triggers
  - legacy table drops (`direct_messages`, `community_messages`, `squad_comments`)
- Fixed SQL compatibility issues during rollout:
  - policy syntax
  - policy ordering dependencies
- Schema successfully applied in new Supabase project.

### Frontend migration (Step 2 + 2B)
- Migrated messaging to unified `messages` / `conversations` model.
- Updated notification writes to `recipient_id`, `actor_id`, `type`, `payload`.
- Removed `activisionIdPublic` usage and switched to:
  - `shareActivisionIdWithFriends`
  - `shareActivisionIdWithSquads`
- Removed community/squad-comment direction from UI.
- Removed demo/mock execution paths and deleted `client/src/utils/mockData.js`.
- Added friend request actions on user profiles:
  - send
  - accept
  - cancel/decline
- Added secure Activision display via RPC:
  - `get_shared_activision_id(...)`
- Added Inbox notifications section with read/unread handling.
- Added squad application notifications (request / accepted / rejected).
- Multiple successful `npm run build` validations.

## Current blocker / why site looks wrong
- GitHub Pages custom domain was changed to **`www.dropzonesquads.com`**.
- GitHub Pages shows: HTTPS unavailable because cert not issued yet.
- While cert/domain propagate, site can serve older/partial behavior (including `/auth` route issues).

## Next steps (after break)

### 1) Finish domain + HTTPS stabilization
1. GitHub → Settings → Pages:
   - Source = **GitHub Actions**
   - Custom domain = `www.dropzonesquads.com`
2. DNS:
   - `www` CNAME → `coreyb07.github.io`
3. Wait for certificate issuance.
4. Enable **Enforce HTTPS** once available.

### 2) Re-verify deployment is current
- Ensure latest workflow run is green on `main`.
- Hard refresh and test:
  - `/`
  - `/auth?mode=login`

### 3) Optional recommended patch
- Add GitHub Pages SPA fallback (`404.html`) so direct routes like `/auth` don’t 404 on refresh.

### 4) Run QA script (A/B accounts)
- Friend request lifecycle
- Squad join request lifecycle
- DM + squad chat unread behavior
- Notification rendering + mark-read
- Activision ID visibility policy checks

## Notes
- Latest pushed branch includes all core schema + frontend migration work.
- If routes still 404 after HTTPS is active, prioritize SPA fallback patch next.
