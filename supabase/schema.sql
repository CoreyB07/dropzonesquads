-- DropZoneSquads Supabase schema (clean rebuild)
-- Target: new Supabase project
-- Run this whole file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ======================================
-- Utility functions
-- ======================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ======================================
-- PROFILES
-- ======================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  platform text not null default 'Crossplay',
  activision_id text not null default '',
  share_activision_id_with_friends boolean not null default false,
  share_activision_id_with_squads boolean not null default false,
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  supporter boolean not null default false,
  is_supporter boolean not null default false,
  supporter_since timestamptz,
  is_admin boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- cleanup legacy column if it exists
alter table public.profiles drop column if exists activision_id_public;

create unique index if not exists profiles_email_unique_idx on public.profiles (lower(email));
create index if not exists profiles_username_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- policies
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can read all profiles"
on public.profiles for select
to authenticated
using (public.is_admin_user());

grant select, insert, update on public.profiles to authenticated;

-- auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_username text;
  meta_platform text;
  meta_activision_id text;
  meta_marketing_opt_in boolean;
  meta_marketing_opt_in_at timestamptz;
begin
  meta_username := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1), 'Operator');
  meta_platform := coalesce(nullif(trim(new.raw_user_meta_data->>'platform'), ''), 'Crossplay');
  meta_activision_id := coalesce(nullif(trim(new.raw_user_meta_data->>'activision_id'), ''), '');
  meta_marketing_opt_in := coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false);
  meta_marketing_opt_in_at := case when meta_marketing_opt_in then now() else null end;

  insert into public.profiles (
    id, email, username, platform, activision_id,
    share_activision_id_with_friends, share_activision_id_with_squads,
    marketing_opt_in, marketing_opt_in_at
  ) values (
    new.id, new.email, meta_username, meta_platform, meta_activision_id,
    false, false,
    meta_marketing_opt_in, meta_marketing_opt_in_at
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ======================================
-- MARKETING SUBSCRIBERS
-- ======================================
create table if not exists public.marketing_subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  username text,
  source text not null default 'signup_form',
  consent_text text not null,
  consented_at timestamptz not null default now(),
  subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists marketing_subscribers_email_idx
on public.marketing_subscribers (lower(email));

alter table public.marketing_subscribers enable row level security;

create policy "Public can insert subscribers"
on public.marketing_subscribers for insert
to anon, authenticated
with check (length(trim(coalesce(email, ''))) > 3 and subscribed = true);

create policy "Admins can read subscribers"
on public.marketing_subscribers for select
to authenticated
using (public.is_admin_user());

grant insert on public.marketing_subscribers to anon, authenticated;
grant select on public.marketing_subscribers to authenticated;

drop trigger if exists trg_marketing_subscribers_updated_at on public.marketing_subscribers;
create trigger trg_marketing_subscribers_updated_at
before update on public.marketing_subscribers
for each row execute function public.set_updated_at();

-- ======================================
-- SQUADS + MEMBERSHIP
-- ======================================
create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  game_mode text not null,
  platform text not null,
  mic_required boolean not null default true,
  skill_level text not null,
  audience text not null default 'Open to All',
  comms text not null default 'Game',
  description text,
  max_players integer not null default 4,
  player_count integer not null default 1,
  accepting_players boolean not null default true,
  tags text[] not null default '{}',
  listing_type text not null default 'squad_looking_for_players',
  chat_conversation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.squads enable row level security;

create policy "Public read squads"
on public.squads for select
to anon, authenticated
using (true);

create policy "Authenticated insert squads"
on public.squads for insert
to authenticated
with check (creator_id = auth.uid());

create policy "Squad managers can update squads"
on public.squads for update
to authenticated
using (
  creator_id = auth.uid()
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squads.id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
)
with check (
  creator_id = auth.uid()
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squads.id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
);

grant select on public.squads to anon, authenticated;
grant insert, update on public.squads to authenticated;

drop trigger if exists trg_squads_updated_at on public.squads;
create trigger trg_squads_updated_at
before update on public.squads
for each row execute function public.set_updated_at();

create table if not exists public.squad_members (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (squad_id, user_id)
);

create index if not exists squad_members_user_idx on public.squad_members (user_id);
create index if not exists squad_members_squad_idx on public.squad_members (squad_id);

alter table public.squad_members enable row level security;

create policy "Authenticated users can read squad members"
on public.squad_members for select
to authenticated
using (true);

create policy "Squad managers can insert members"
on public.squad_members for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (select 1 from public.squads s where s.id = squad_id and s.creator_id = auth.uid())
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squad_members.squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
);

create policy "Squad managers can update members"
on public.squad_members for update
to authenticated
using (
  exists (select 1 from public.squads s where s.id = squad_id and s.creator_id = auth.uid())
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squad_members.squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
)
with check (
  exists (select 1 from public.squads s where s.id = squad_id and s.creator_id = auth.uid())
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squad_members.squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
);

create policy "Squad managers can delete members"
on public.squad_members for delete
to authenticated
using (
  exists (select 1 from public.squads s where s.id = squad_id and s.creator_id = auth.uid())
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squad_members.squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
);

grant select, insert, update, delete on public.squad_members to authenticated;

create table if not exists public.squad_applications (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  discord text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists squad_applications_unique_pending_idx
on public.squad_applications (squad_id, applicant_id)
where status = 'pending';

create index if not exists squad_applications_squad_status_idx on public.squad_applications (squad_id, status);
create index if not exists squad_applications_applicant_status_idx on public.squad_applications (applicant_id, status);

alter table public.squad_applications enable row level security;

create policy "Applicants can insert their own applications"
on public.squad_applications for insert
to authenticated
with check (applicant_id = auth.uid());

create policy "Applicants can view their applications"
on public.squad_applications for select
to authenticated
using (applicant_id = auth.uid());

create policy "Squad managers can view squad applications"
on public.squad_applications for select
to authenticated
using (
  exists (
    select 1 from public.squads s
    where s.id = squad_id and s.creator_id = auth.uid()
  )
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
);

create policy "Squad managers can update squad applications"
on public.squad_applications for update
to authenticated
using (
  exists (
    select 1 from public.squads s
    where s.id = squad_id and s.creator_id = auth.uid()
  )
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
)
with check (
  exists (
    select 1 from public.squads s
    where s.id = squad_id and s.creator_id = auth.uid()
  )
  or exists (
    select 1 from public.squad_members sm
    where sm.squad_id = squad_id
      and sm.user_id = auth.uid()
      and sm.role in ('leader', 'co-leader')
  )
);

grant select, insert, update on public.squad_applications to authenticated;

drop trigger if exists trg_squad_applications_updated_at on public.squad_applications;
create trigger trg_squad_applications_updated_at
before update on public.squad_applications
for each row execute function public.set_updated_at();

-- ======================================
-- FRIENDSHIPS
-- ======================================
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_distinct_users check (requester_id <> addressee_id)
);

create unique index if not exists friendships_user_pair_idx
on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists friendships_requester_idx on public.friendships (requester_id, status);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);

alter table public.friendships enable row level security;

create policy "Users can read their own friendships"
on public.friendships for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can create friendship requests"
on public.friendships for insert
to authenticated
with check (auth.uid() = requester_id and status = 'pending' and requester_id <> addressee_id);

create policy "Friend participants can update"
on public.friendships for update
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id)
with check (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Friend participants can delete"
on public.friendships for delete
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

grant select, insert, update, delete on public.friendships to authenticated;

drop trigger if exists trg_friendships_updated_at on public.friendships;
create trigger trg_friendships_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();

create or replace function public.prevent_friendship_party_changes()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id or new.addressee_id <> old.addressee_id then
    raise exception 'Friendship participants cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_friendships_lock_participants on public.friendships;
create trigger trg_friendships_lock_participants
before update on public.friendships
for each row execute function public.prevent_friendship_party_changes();

-- ======================================
-- MESSAGING (UNIFIED)
-- ======================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'squad')),
  squad_id uuid unique references public.squads(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint squad_conversation_shape check (
    (type = 'squad' and squad_id is not null)
    or
    (type = 'direct' and squad_id is null)
  )
);

create index if not exists conversations_type_idx on public.conversations (type, created_at desc);

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (conversation_id, user_id)
);

create index if not exists convo_participants_user_idx on public.conversation_participants (user_id, conversation_id);
create index if not exists convo_participants_convo_idx on public.conversation_participants (conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index if not exists messages_sender_idx on public.messages (sender_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx on public.notifications (recipient_id, read_at) where read_at is null;

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- helper checks
create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.friendships
    where status = 'accepted'
      and (
        (requester_id = user_a and addressee_id = user_b)
        or
        (requester_id = user_b and addressee_id = user_a)
      )
  );
$$;

create or replace function public.share_any_squad(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.squad_members me
    join public.squad_members them on them.squad_id = me.squad_id
    where me.user_id = user_a and them.user_id = user_b
  );
$$;

create or replace function public.can_dm(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select user_a <> user_b and (public.are_friends(user_a, user_b) or public.share_any_squad(user_a, user_b));
$$;

create or replace function public.is_conversation_participant(target_conversation_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = target_conversation_id
      and cp.user_id = target_user_id
  );
$$;

create or replace function public.get_shared_activision_id(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_activision_id text;
  target_share_with_friends boolean;
  target_share_with_squads boolean;
begin
  if auth.uid() = target_user_id then
    select activision_id into target_activision_id from public.profiles where id = target_user_id;
    return target_activision_id;
  end if;

  if auth.uid() is null then
    return null;
  end if;

  select activision_id, share_activision_id_with_friends, share_activision_id_with_squads
  into target_activision_id, target_share_with_friends, target_share_with_squads
  from public.profiles
  where id = target_user_id;

  if target_activision_id is null then
    return null;
  end if;

  if target_share_with_friends and public.are_friends(auth.uid(), target_user_id) then
    return target_activision_id;
  end if;

  if target_share_with_squads and public.share_any_squad(auth.uid(), target_user_id) then
    return target_activision_id;
  end if;

  return null;
end;
$$;

-- conversation creation helper for DMs (avoids duplicates)
create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing_id uuid;
  conv_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_dm(me, other_user_id) then
    raise exception 'DM not allowed for these users';
  end if;

  select c.id
  into existing_id
  from public.conversations c
  join public.conversation_participants cp1 on cp1.conversation_id = c.id and cp1.user_id = me
  join public.conversation_participants cp2 on cp2.conversation_id = c.id and cp2.user_id = other_user_id
  where c.type = 'direct'
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.conversations (type, created_by)
  values ('direct', me)
  returning id into conv_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (conv_id, me), (conv_id, other_user_id);

  return conv_id;
end;
$$;

-- conversation RLS
create policy "Participants can read conversations"
on public.conversations for select
to authenticated
using (public.is_conversation_participant(id, auth.uid()));

create policy "Authenticated users can create conversations"
on public.conversations for insert
to authenticated
with check (created_by = auth.uid());

create policy "Participants can update conversations"
on public.conversations for update
to authenticated
using (public.is_conversation_participant(id, auth.uid()))
with check (public.is_conversation_participant(id, auth.uid()));

-- participant RLS
create policy "Users can read participant rows in own conversations"
on public.conversation_participants for select
to authenticated
using (public.is_conversation_participant(conversation_id, auth.uid()));

create policy "Users can insert self as participant"
on public.conversation_participants for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin_user());

create policy "Users can update own participant row"
on public.conversation_participants for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- messages RLS
create policy "Participants can read messages"
on public.messages for select
to authenticated
using (public.is_conversation_participant(conversation_id, auth.uid()));

create policy "Participants can send messages"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id, auth.uid())
);

grant select, insert, update on public.conversations to authenticated;
grant select, insert, update on public.conversation_participants to authenticated;
grant select, insert on public.messages to authenticated;

-- notifications RLS
create policy "Users can read own notifications"
on public.notifications for select
to authenticated
using (recipient_id = auth.uid());

create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

-- allow inserts from authenticated users; app logic must ensure correct recipient
create policy "Authenticated users can insert notifications"
on public.notifications for insert
to authenticated
with check (auth.uid() is not null);

grant select, insert, update on public.notifications to authenticated;

-- ======================================
-- retention cleanup
-- squad chat: keep 100 per squad conversation
-- direct chat: keep 20 per direct conversation
-- notifications: keep 100 per recipient
-- ======================================
create or replace function public.trim_messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ctype text;
  max_keep int;
begin
  select type into ctype from public.conversations where id = new.conversation_id;
  max_keep := case when ctype = 'squad' then 100 else 20 end;

  delete from public.messages m
  where m.conversation_id = new.conversation_id
    and m.id not in (
      select id
      from public.messages
      where conversation_id = new.conversation_id
      order by created_at desc
      limit max_keep
    );

  return new;
end;
$$;

drop trigger if exists trg_trim_messages_after_insert on public.messages;
create trigger trg_trim_messages_after_insert
after insert on public.messages
for each row execute function public.trim_messages_after_insert();

create or replace function public.trim_notifications_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications n
  where n.recipient_id = new.recipient_id
    and n.id not in (
      select id
      from public.notifications
      where recipient_id = new.recipient_id
      order by created_at desc
      limit 100
    );

  return new;
end;
$$;

drop trigger if exists trg_trim_notifications_after_insert on public.notifications;
create trigger trg_trim_notifications_after_insert
after insert on public.notifications
for each row execute function public.trim_notifications_after_insert();

-- ======================================
-- squad conversation + participant sync helpers
-- ======================================
create or replace function public.ensure_squad_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
begin
  if new.chat_conversation_id is null then
    insert into public.conversations (type, squad_id, created_by)
    values ('squad', new.id, new.creator_id)
    returning id into conv_id;

    new.chat_conversation_id := conv_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ensure_squad_conversation on public.squads;
create trigger trg_ensure_squad_conversation
before insert on public.squads
for each row execute function public.ensure_squad_conversation();

create or replace function public.sync_squad_member_conversation_participants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
begin
  select chat_conversation_id into conv_id
  from public.squads
  where id = coalesce(new.squad_id, old.squad_id);

  if conv_id is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    insert into public.conversation_participants (conversation_id, user_id)
    values (conv_id, new.user_id)
    on conflict (conversation_id, user_id) do nothing;
    return new;
  elsif tg_op = 'DELETE' then
    delete from public.conversation_participants
    where conversation_id = conv_id and user_id = old.user_id;
    return old;
  else
    return coalesce(new, old);
  end if;
end;
$$;

drop trigger if exists trg_sync_squad_member_conversation_insert on public.squad_members;
create trigger trg_sync_squad_member_conversation_insert
after insert on public.squad_members
for each row execute function public.sync_squad_member_conversation_participants();

drop trigger if exists trg_sync_squad_member_conversation_delete on public.squad_members;
create trigger trg_sync_squad_member_conversation_delete
after delete on public.squad_members
for each row execute function public.sync_squad_member_conversation_participants();

-- keep conversation.updated_at fresh when messages arrive
create or replace function public.bump_conversation_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_conversation_updated_at on public.messages;
create trigger trg_bump_conversation_updated_at
after insert on public.messages
for each row execute function public.bump_conversation_updated_at();

-- ======================================
-- Remove deprecated/legacy tables if present
-- ======================================
drop table if exists public.community_messages cascade;
drop table if exists public.direct_messages cascade;
drop table if exists public.squad_comments cascade;
