-- DropZoneSquads Demo Seed Cleanup
-- Removes data created by demo_seed_phase_view.sql
--
-- Run in Supabase SQL Editor.

begin;

-- Remove demo notifications
delete from public.notifications
where payload ? 'demo'
  and (payload->>'demo')::text = 'true';

-- Remove demo applications
delete from public.squad_applications a
using public.squads s
where a.squad_id = s.id
  and s.name like '[DEMO] %';

-- Remove demo badge assignments tied to demo squads
delete from public.member_badges mb
using public.squads s
where mb.squad_id = s.id
  and s.name like '[DEMO] %';

-- Remove demo memberships
delete from public.squad_members sm
using public.squads s
where sm.squad_id = s.id
  and s.name like '[DEMO] %';

-- Remove demo squads
delete from public.squads
where name like '[DEMO] %';

commit;
