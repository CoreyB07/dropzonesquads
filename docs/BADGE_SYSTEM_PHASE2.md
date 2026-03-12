# Badge System — Phase 2 (Manage Squad UI)

_Date: 2026-03-12_

## Implemented

Manage Squad now supports badge assignment per member:

- 1 Serious badge (optional)
- 1 Funny badge (optional)
- 1 Status badge (optional)

Selections are staged in UI and saved when leaders click **Review and Confirm**.

## Tech Notes

Added `client/src/utils/badgeApi.js` with:
- `fetchBadgeCatalog()`
- `fetchSquadMemberBadges(squadId)`
- `saveMemberBadgeSelection(...)`

Updated `ManageSquad.jsx` to:
- load badge catalog + existing member badges
- render badge selectors per member
- persist selections on confirm save

## Assumptions

- Phase 1 SQL already applied (`badge_catalog`, `member_badges`, RLS policies).
- Leader/co-leader/creator permissions enforced by DB policies.

## Next (Phase 3)

- Render badges on squad roster and user profile cards.
- Add optional expiry/reason controls for status badges.
- Add tiny badge legend/tooltips for meaning.
