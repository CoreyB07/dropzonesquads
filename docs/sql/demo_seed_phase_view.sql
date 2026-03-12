-- DropZoneSquads Demo Seed (safe-ish, no auth.users writes)
-- Purpose: create visual demo data so UI/card/badge flows can be previewed.
-- Scope: uses EXISTING rows in public.profiles (first several users found).
--
-- Run in Supabase SQL Editor.

begin;

-- 0) Ensure badge catalog exists (Phase 1 should already do this)
-- If missing, this seed still runs but badge assignments may be skipped.

-- 1) Pick existing profile ids for demo actors
with demo_users as (
  select id, username, platform
  from public.profiles
  order by created_at asc nulls last
  limit 8
),
creator as (
  select id from demo_users limit 1
),
u2 as (
  select id from demo_users offset 1 limit 1
),
u3 as (
  select id from demo_users offset 2 limit 1
),
u4 as (
  select id from demo_users offset 3 limit 1
),
u5 as (
  select id from demo_users offset 4 limit 1
),
u6 as (
  select id from demo_users offset 5 limit 1
),
inserted_squads as (
  insert into public.squads (
    name,
    game_mode,
    platform,
    skill_level,
    audience,
    comms,
    max_players,
    accepting_players,
    description,
    tags,
    creator_id,
    created_at,
    updated_at
  )
  select * from (
    select
      '[DEMO] Night Raid Stack'::text as name,
      'Battle Royale'::text as game_mode,
      'Crossplay'::text as platform,
      'Competitive'::text as skill_level,
      'Open to All'::text as audience,
      'Discord'::text as comms,
      4::int as max_players,
      true as accepting_players,
      'Demo card: coordinated pushes, comms-heavy play.'::text as description,
      array['demo','ranked','night']::text[] as tags,
      (select id from creator) as creator_id,
      now() - interval '3 days' as created_at,
      now() - interval '2 days' as updated_at
    union all
    select
      '[DEMO] Chill Rebirth Crew',
      'Resurgence',
      'PlayStation',
      'Casual',
      'Open to All',
      'Game',
      4,
      true,
      'Demo card: chill games, no rage, good vibes.',
      array['demo','casual','rebirth']::text[],
      (select id from creator),
      now() - interval '2 days',
      now() - interval '1 day'
    union all
    select
      '[DEMO] Full Tactical Unit',
      'Battle Royale',
      'PC',
      'Advanced',
      'Invite Only',
      'Discord',
      4,
      false,
      'Demo card: full squad (tests full/closed state).',
      array['demo','full','tactical']::text[],
      (select id from creator),
      now() - interval '1 day',
      now() - interval '1 hour'
  ) s
  where (select id from creator) is not null
  on conflict do nothing
  returning id, name
)
select count(*) as squads_seeded from inserted_squads;

-- 2) Add creator + members to demo squads
insert into public.squad_members (squad_id, user_id, role)
select s.id, p.id,
  case
    when p.rn = 1 then 'leader'
    when p.rn = 2 then 'co-leader'
    when p.rn = 3 then 'member'
    when p.rn = 4 then 'member'
    else 'recruit'
  end as role
from (
  select id, row_number() over (order by created_at asc nulls last) rn
  from public.profiles
  limit 5
) p
join public.squads s on s.name like '[DEMO] %'
on conflict do nothing;

-- 3) Demo join requests (pending + accepted/rejected cases)
insert into public.squad_applications (squad_id, applicant_id, role, discord, status, created_at)
select s.id, p.id, 'Slayer', 'demo_user#' || substr(p.id::text,1,4),
  case
    when s.name like '%Night Raid%' then 'pending'
    when s.name like '%Chill Rebirth%' then 'accepted'
    else 'rejected'
  end,
  now() - interval '6 hours'
from public.squads s
join lateral (
  select id from public.profiles
  where id <> s.creator_id
  order by created_at asc nulls last
  limit 1
) p on true
where s.name like '[DEMO] %'
on conflict do nothing;

-- 4) Demo notifications (for Inbox preview)
insert into public.notifications (recipient_id, actor_id, type, payload, created_at)
select
  s.creator_id,
  a.applicant_id,
  'squad_join_request',
  jsonb_build_object(
    'squad_id', s.id,
    'squad_name', s.name,
    'demo', true
  ),
  now() - interval '2 hours'
from public.squad_applications a
join public.squads s on s.id = a.squad_id
where s.name like '[DEMO] %'
on conflict do nothing;

-- 5) Badge assignments for demo members (if badge catalog exists)
insert into public.member_badges (squad_id, user_id, badge_id, assigned_by, is_public)
select sm.squad_id, sm.user_id,
  case sm.role
    when 'leader' then 'leader-core'
    when 'co-leader' then 'shot-caller'
    when 'member' then 'veteran'
    else 'inactive'
  end as badge_id,
  s.creator_id,
  true
from public.squad_members sm
join public.squads s on s.id = sm.squad_id
where s.name like '[DEMO] %'
  and exists (select 1 from public.badge_catalog bc where bc.id =
    case sm.role
      when 'leader' then 'leader-core'
      when 'co-leader' then 'shot-caller'
      when 'member' then 'veteran'
      else 'inactive'
    end
  )
on conflict do nothing;

insert into public.member_badges (squad_id, user_id, badge_id, assigned_by, is_public)
select sm.squad_id, sm.user_id,
  case
    when sm.role in ('leader','co-leader') then 'loot-goblin'
    else 'revive-magnet'
  end as badge_id,
  s.creator_id,
  true
from public.squad_members sm
join public.squads s on s.id = sm.squad_id
where s.name like '[DEMO] %'
  and exists (select 1 from public.badge_catalog bc where bc.id in ('loot-goblin','revive-magnet'))
on conflict do nothing;

commit;
