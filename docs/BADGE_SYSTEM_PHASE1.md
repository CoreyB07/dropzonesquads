# Badge System — Phase 1 (Schema)

This phase introduces backend schema only (no UI yet).

## Added

- `public.badge_catalog`
  - stores badge definitions
  - categories: `serious`, `funny`, `status`

- `public.member_badges`
  - stores squad member badge assignments
  - supports temporary/expiring badges (`expires_at`)
  - supports visibility toggle (`is_public`)

## Included in SQL

File: `docs/sql/phase1_member_badges.sql`

- table creation + indexes
- catalog seed data (serious/funny/status badges)
- RLS policies:
  - read active catalog
  - read squad badges (member/public/admin)
  - manage badges (leader/co-leader/creator/admin)

## How to run

1. Open Supabase SQL Editor.
2. Paste `docs/sql/phase1_member_badges.sql`.
3. Run once.

## Next phase (Phase 2)

- Add Manage Squad badge assignment UI:
  - pick 1 serious + 1 funny badge per member
  - optional status badge with expiry/reason
- Show badges on:
  - squad member list
  - user profile cards
  - squad profile roster
