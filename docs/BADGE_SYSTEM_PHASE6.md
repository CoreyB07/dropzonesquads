# Badge System — Phase 6 (Custom Badge Names)

_Date: 2026-03-12_

## What this adds

Leaders can now give **custom names** to assigned badges per member (per squad assignment), while still keeping badge category and icon behavior.

Examples:
- `Shot Caller` -> `Late-Night IGL`
- `At Risk` -> `Needs Comms Discipline`

## Schema migration required

Run:
- `docs/sql/phase6_custom_badge_labels.sql`

This adds to `member_badges`:
- `custom_label`
- `custom_description`

## UI updates

### Manage Squad
- Each badge selector (Serious/Funny/Status) now has:
  - badge dropdown
  - custom name input (optional)
- Custom names are saved with the assignment.

### Display surfaces
- Squad roster, User Profile, and My Profile now prefer:
  - `custom_label` if present
  - else fallback to catalog label

## Notes

- Custom labels are assignment-specific (not global catalog edits).
- Keeps moderation safe and squad-local while allowing creativity.
