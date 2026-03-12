# Badge System — Phase 3 (Display)

_Date: 2026-03-12_

## Implemented

Badges now render in key user-facing surfaces:

1. **Squad Profile roster** (`SquadProfile.jsx`)
   - Shows member badges under each member row.
   - Uses compact badge chips (up to 3 shown).

2. **User Profile squad list** (`UserProfile.jsx`)
   - Shows public active badges per squad row.

3. **My Profile squad list** (`Profile.jsx`)
   - Shows active badges for current user per squad row.

## New component

- `client/src/components/BadgeChip.jsx`
  - shared visual chip for badge label + category color mapping
  - supports compact mode

## Data sources

- `fetchSquadMemberBadges(squadId)` for squad roster display
- direct `member_badges` queries in profile pages for per-squad display

## Notes

- Current display limit is 3 badges per row for readability.
- Next enhancement can add hover tooltip for full descriptions from `badge_catalog`.
