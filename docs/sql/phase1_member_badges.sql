-- DropZoneSquads Phase 1: Member Badge Schema
-- Date: 2026-03-12
-- Run in Supabase SQL Editor.

begin;

-- 1) Badge catalogs
create table if not exists public.badge_catalog (
  id text primary key,
  label text not null,
  description text,
  category text not null check (category in ('serious','funny','status')),
  color_token text,
  icon text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) One row per member->badge assignment
create table if not exists public.member_badges (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badge_catalog(id) on delete restrict,
  reason text,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  is_public boolean not null default true
);

-- 3) Prevent duplicate active assignment of same badge for same member in a squad
create unique index if not exists uq_member_badges_unique_assignment
  on public.member_badges (squad_id, user_id, badge_id)
  where expires_at is null;

-- 4) Performance indexes
create index if not exists idx_member_badges_member on public.member_badges (user_id, squad_id);
create index if not exists idx_member_badges_squad on public.member_badges (squad_id);
create index if not exists idx_member_badges_expires on public.member_badges (expires_at);

-- 5) Seed badge catalog (serious + funny + status)
insert into public.badge_catalog (id, label, description, category, color_token, icon)
values
  ('leader-core', 'Leader Core', 'Primary squad leader.', 'serious', 'red', 'shield'),
  ('co-lead', 'Co-Lead', 'Trusted secondary leader.', 'serious', 'orange', 'shield-half'),
  ('shot-caller', 'Shot Caller', 'Makes strong callouts and rotations.', 'serious', 'yellow', 'megaphone'),
  ('clutch', 'Clutch', 'Consistently wins high-pressure moments.', 'serious', 'green', 'swords'),
  ('veteran', 'Veteran', 'Reliable long-term squad member.', 'serious', 'blue', 'award'),

  ('loot-goblin', 'Loot Goblin', 'Always first to the good loot.', 'funny', 'purple', 'backpack'),
  ('gulag-enjoyer', 'Gulag Enjoyer', 'Spends a little too much time in Gulag.', 'funny', 'indigo', 'skull'),
  ('hot-mic', 'Hot Mic', 'Mic discipline... in progress.', 'funny', 'pink', 'mic'),
  ('late-drop-legend', 'Late Drop Legend', 'Still dropping while team is already fighting.', 'funny', 'teal', 'clock'),
  ('revive-magnet', 'Revive Magnet', 'Frequently needs revives but keeps morale high.', 'funny', 'cyan', 'heart-pulse'),

  ('at-risk', 'At Risk', 'Member is currently at risk of removal.', 'status', 'amber', 'alert-triangle'),
  ('probation', 'Probation', 'Temporary review period before final decision.', 'status', 'amber', 'hourglass'),
  ('inactive', 'Inactive', 'Low recent participation.', 'status', 'gray', 'moon')
on conflict (id) do update
set
  label = excluded.label,
  description = excluded.description,
  category = excluded.category,
  color_token = excluded.color_token,
  icon = excluded.icon,
  active = true,
  updated_at = now();

-- 6) Keep updated_at fresh
create or replace function public.set_updated_at_badge_catalog()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_badge_catalog_updated_at on public.badge_catalog;
create trigger trg_badge_catalog_updated_at
before update on public.badge_catalog
for each row execute procedure public.set_updated_at_badge_catalog();

-- 7) RLS
alter table public.badge_catalog enable row level security;
alter table public.member_badges enable row level security;

-- Everyone authenticated can read active catalog
drop policy if exists "badge_catalog_read_authenticated" on public.badge_catalog;
create policy "badge_catalog_read_authenticated"
on public.badge_catalog
for select
to authenticated
using (active = true or is_admin_user());

-- Members can read squad badges if they are in that squad, or if badge is public
drop policy if exists "member_badges_read" on public.member_badges;
create policy "member_badges_read"
on public.member_badges
for select
to authenticated
using (
  is_admin_user()
  or is_public = true
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = member_badges.squad_id
      and sm.user_id = auth.uid()
  )
  or exists (
    select 1 from public.squads s
    where s.id = member_badges.squad_id
      and s.creator_id = auth.uid()
  )
);

-- Leaders/co-leaders/creators can assign or update badges
drop policy if exists "member_badges_manage" on public.member_badges;
create policy "member_badges_manage"
on public.member_badges
for all
to authenticated
using (
  is_admin_user()
  or exists (
    select 1 from public.squads s
    where s.id = member_badges.squad_id
      and s.creator_id = auth.uid()
  )
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = member_badges.squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader','co-leader')
  )
)
with check (
  is_admin_user()
  or exists (
    select 1 from public.squads s
    where s.id = member_badges.squad_id
      and s.creator_id = auth.uid()
  )
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = member_badges.squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader','co-leader')
  )
);

commit;
