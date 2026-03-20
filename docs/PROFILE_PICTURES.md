# Profile Picture System

## Preset profile pictures (repo-managed)

Store preset images in:

- Base preset set: `client/public/profile-pictures/presets/`
  - `nature/`
  - `operators/`
  - `gear/`
  - `emblems/`
  - `abstract/`
  - `rank/`
- Your custom preset upload folder: `client/public/profile-pictures/presets-custom/`
  - `operators/`, `masks/`, `emblems/`, `abstract/`, `nature/`, `gear/`, `rank/`
  - includes guide file: `client/public/profile-pictures/presets-custom/README.md`

Manifest lives at:

- `client/src/constants/presetProfilePictures.js`

To add new preset images:
1. Drop image file into appropriate category folder.
2. Add a manifest entry with `id`, `label`, `category`, and `src`.
3. Rebuild/deploy frontend.

## Custom uploads (Supabase Storage)

Bucket:
- `profile-pictures`

Paths:
- Pending user uploads: `pending/<user_id>/<filename>`
- Approved public uploads: `approved/<user_id>/<filename>`

## Approval model

User flow:
- User picks preset picture instantly (no moderation).
- User custom upload creates `profile_picture_submissions` row with `status=pending`.
- Preset stays active while pending.

Admin flow:
- Admin reviews queue in `/admin`.
- Approve:
  - move storage object pending -> approved
  - mark submission approved
  - update profile `avatar_url` to approved public URL
  - set `avatar_custom_status='approved'`
- Reject:
  - mark submission rejected (+ optional reason)
  - keep current displayed profile picture unchanged

## Display logic

1. If approved custom exists (`avatar_custom_status='approved'` and `avatar_url` points to approved path), show it.
2. Otherwise show selected preset picture (`selected_preset_avatar` + preset `src`).
