# Profile Picture System

## Public profile pictures (moderated-only)

Preset/default profile pictures are disabled.

New rule:
- No profile picture is shown by default.
- Users must upload a custom image.
- Upload remains hidden until approved by admin.

## Custom uploads (Supabase Storage)

Bucket:
- `profile-pictures`

Paths:
- Pending user uploads: `pending/<user_id>/<filename>`
- Approved public uploads: `approved/<user_id>/<filename>`

## Approval model

User flow:
- User uploads custom image.
- Upload creates `profile_picture_submissions` row with `status=pending`.
- No picture is shown publicly while pending.

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
2. Otherwise show no profile picture.
