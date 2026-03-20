-- Profile Picture System (preset + moderated custom uploads)
-- Run in Supabase SQL Editor.

begin;

alter table public.profiles
  add column if not exists selected_preset_avatar text,
  add column if not exists avatar_custom_status text not null default 'none'
    check (avatar_custom_status in ('none','pending','approved','rejected'));

create table if not exists public.profile_picture_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_path text not null,
  approved_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_picture_submissions_user_idx on public.profile_picture_submissions(user_id, created_at desc);
create index if not exists profile_picture_submissions_status_idx on public.profile_picture_submissions(status, created_at desc);

alter table public.profile_picture_submissions enable row level security;

-- Users can view their own submission history
create policy "users read own picture submissions"
on public.profile_picture_submissions for select
to authenticated
using (user_id = auth.uid());

-- Users can create their own submissions
create policy "users create own picture submissions"
on public.profile_picture_submissions for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending');

-- Admin can read and update moderation queue
create policy "admins read all picture submissions"
on public.profile_picture_submissions for select
to authenticated
using (public.is_admin_user());

create policy "admins update picture submissions"
on public.profile_picture_submissions for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- Allow admins to update any profile row (needed for approve/reject)
drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- Keep updated_at fresh
create or replace function public.touch_profile_picture_submission_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profile_picture_submissions_updated_at on public.profile_picture_submissions;
create trigger trg_profile_picture_submissions_updated_at
before update on public.profile_picture_submissions
for each row execute function public.touch_profile_picture_submission_updated_at();

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-pictures',
  'profile-pictures',
  true,
  2097152,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Users can upload only into pending/<their-user-id>/...
drop policy if exists "users upload pending profile pictures" on storage.objects;
create policy "users upload pending profile pictures"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pictures'
  and split_part(name, '/', 1) = 'pending'
  and split_part(name, '/', 2) = auth.uid()::text
);

-- Users can view own pending + everyone can view approved (public bucket)
drop policy if exists "users read own pending profile pictures" on storage.objects;
create policy "users read own pending profile pictures"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (
    (split_part(name, '/', 1) = 'pending' and split_part(name, '/', 2) = auth.uid()::text)
    or split_part(name, '/', 1) = 'approved'
  )
);

-- Admin full moderation control in bucket
create policy "admins manage profile pictures"
on storage.objects
for all
to authenticated
using (bucket_id = 'profile-pictures' and public.is_admin_user())
with check (bucket_id = 'profile-pictures' and public.is_admin_user());

commit;
