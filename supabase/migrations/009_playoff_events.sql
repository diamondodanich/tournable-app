-- =============================================
-- TOURNABLE — Playoff match events support
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Make fixture_id nullable on match_events (playoff events have no fixture)
alter table match_events alter column fixture_id drop not null;

-- 2. Add playoff_match_id to match_events
alter table match_events
  add column if not exists playoff_match_id uuid references playoff_matches(id) on delete cascade;

-- 3. Add playoff_match_id to live_games (so finish knows which playoff match to update)
alter table live_games
  add column if not exists playoff_match_id uuid references playoff_matches(id) on delete set null;

-- 4. Update match_events INSERT policy to also allow playoff path
drop policy if exists "match_events_insert" on match_events;
create policy "match_events_insert" on match_events for insert with check (
  -- fixture path (round-robin)
  (fixture_id is not null and exists (
    select 1 from fixtures join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = match_events.fixture_id
      and (tournaments.user_id = auth.uid()
        or exists (select 1 from tournament_members
                   where tournament_id = tournaments.id and user_id = auth.uid()
                     and role = 'editor' and status = 'accepted'))
  ))
  or
  -- playoff path
  (playoff_match_id is not null and exists (
    select 1 from playoff_matches join tournaments on tournaments.id = playoff_matches.tournament_id
    where playoff_matches.id = match_events.playoff_match_id
      and (tournaments.user_id = auth.uid()
        or exists (select 1 from tournament_members
                   where tournament_id = tournaments.id and user_id = auth.uid()
                     and role = 'editor' and status = 'accepted'))
  ))
);

-- 5. Update match_events UPDATE policy
drop policy if exists "match_events_update" on match_events;
create policy "match_events_update" on match_events for update using (
  (fixture_id is not null and exists (
    select 1 from fixtures join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = match_events.fixture_id
      and (tournaments.user_id = auth.uid()
        or exists (select 1 from tournament_members
                   where tournament_id = tournaments.id and user_id = auth.uid()
                     and role = 'editor' and status = 'accepted'))
  ))
  or
  (playoff_match_id is not null and exists (
    select 1 from playoff_matches join tournaments on tournaments.id = playoff_matches.tournament_id
    where playoff_matches.id = match_events.playoff_match_id
      and (tournaments.user_id = auth.uid()
        or exists (select 1 from tournament_members
                   where tournament_id = tournaments.id and user_id = auth.uid()
                     and role = 'editor' and status = 'accepted'))
  ))
);

-- 6. Update match_events DELETE policy
drop policy if exists "match_events_delete" on match_events;
create policy "match_events_delete" on match_events for delete using (
  (fixture_id is not null and exists (
    select 1 from fixtures join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = match_events.fixture_id
      and (tournaments.user_id = auth.uid()
        or exists (select 1 from tournament_members
                   where tournament_id = tournaments.id and user_id = auth.uid()
                     and role = 'editor' and status = 'accepted'))
  ))
  or
  (playoff_match_id is not null and exists (
    select 1 from playoff_matches join tournaments on tournaments.id = playoff_matches.tournament_id
    where playoff_matches.id = match_events.playoff_match_id
      and (tournaments.user_id = auth.uid()
        or exists (select 1 from tournament_members
                   where tournament_id = tournaments.id and user_id = auth.uid()
                     and role = 'editor' and status = 'accepted'))
  ))
);

-- Note: SELECT is already covered by match_events_public_read (using true) from migration 008
