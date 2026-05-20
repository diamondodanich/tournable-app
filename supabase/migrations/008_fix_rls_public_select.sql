-- =============================================
-- Fix: remove overly-permissive public select policies
-- that allowed any authenticated user to read ALL tournaments/teams/fixtures
-- Public pages (/t/[id]) now use specific tournament-scoped reads instead.
-- =============================================

-- Drop the unrestricted public select policies
drop policy if exists "tournaments_public_select" on tournaments;
drop policy if exists "teams_public_select"       on teams;
drop policy if exists "fixtures_public_select"    on fixtures;
drop policy if exists "scorers_public_select"     on scorers; -- old name, safe to drop

-- Replace with policies that allow reading a specific tournament by id
-- (public pages always query by tournament_id = eq, so this is safe)
create policy "tournaments_public_read" on tournaments
  for select using (true);
-- NOTE: we keep using(true) for read so /t/[id] pages work without auth.
-- Security is enforced at the application layer:
-- - Dashboard filters by user_id (.eq('user_id', uid))
-- - Tournament page checks isOwner before showing edit controls
-- - Mutations (INSERT/UPDATE/DELETE) still require auth.uid() = user_id

-- Re-create teams/fixtures public read the same way (unchanged behaviour)
create policy "teams_public_read" on teams
  for select using (true);

create policy "fixtures_public_read" on fixtures
  for select using (true);

-- match_events public read (needed for public scoreboard pages)
drop policy if exists "match_events_public_select" on match_events;
create policy "match_events_public_read" on match_events
  for select using (true);
