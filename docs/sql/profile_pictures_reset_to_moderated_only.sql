-- Reset existing profile pictures so nobody has a public avatar until approved.
-- Run once in Supabase SQL Editor.

begin;

-- Remove all current avatar references and preset selections.
update public.profiles
set
  avatar_url = null,
  selected_preset_avatar = null,
  avatar_custom_status = 'none';

-- Optional cleanup: remove historical submissions so queue starts clean.
-- Comment these out if you want to keep history.
delete from public.profile_picture_submissions;

delete from storage.objects
where bucket_id = 'profile-pictures';

commit;
