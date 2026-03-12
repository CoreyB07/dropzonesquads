# Demo Data Seeding (Between Phases)

Use these SQL scripts to preview real UI states with realistic data.

## Files

- Seed: `docs/sql/demo_seed_phase_view.sql`
- Cleanup: `docs/sql/demo_seed_cleanup.sql`

## What the seed adds

- Demo squads (names prefixed with `[DEMO]`)
- Demo squad members (using existing `profiles` users)
- Demo squad applications (pending/accepted/rejected)
- Demo notifications (`payload.demo = true`)
- Demo badges (serious + funny + status combinations)

## Important

- This script does **not** create `auth.users`.
- It only uses existing users in `public.profiles`.
- If your profiles table has very few users, some demo rows may be limited.

## How to run

1. Open Supabase SQL Editor
2. Paste and run `docs/sql/demo_seed_phase_view.sql`
3. Test UI
4. When done, run `docs/sql/demo_seed_cleanup.sql`

## Recommended preview checklist

- Home cards: open/full/varied tags
- Squad Profile: member badges + badge modal
- Manage Squad: search/filter + badge assignment
- Inbox: demo join-request notifications
