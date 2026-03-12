-- Phase 6: Custom badge naming per squad assignment
-- Run in Supabase SQL Editor

begin;

alter table public.member_badges
  add column if not exists custom_label text,
  add column if not exists custom_description text;

-- Optional sanity guard (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'member_badges_custom_label_len'
  ) then
    alter table public.member_badges
      add constraint member_badges_custom_label_len
      check (custom_label is null or char_length(custom_label) between 1 and 40);
  end if;
end $$;

commit;
