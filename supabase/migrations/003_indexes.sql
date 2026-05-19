-- =============================================
-- TOURNABLE — Performance indexes
-- Run this in Supabase SQL Editor
-- =============================================

-- Fixtures: главный запрос страницы турнира (tournament_id + matchday)
create index if not exists idx_fixtures_tournament_matchday
  on fixtures(tournament_id, matchday);

-- Fixtures: фильтр сыгранных матчей (standings, scorers calculation)
create index if not exists idx_fixtures_tournament_played
  on fixtures(tournament_id, played);

-- Match events: lookup событий по матчу
create index if not exists idx_match_events_fixture
  on match_events(fixture_id);

-- Tournament members: RLS policy checks (самый частый join в RLS)
create index if not exists idx_tournament_members_user
  on tournament_members(user_id, status);

create index if not exists idx_tournament_members_tournament
  on tournament_members(tournament_id, user_id, role, status);

-- Playoff matches: bracket query
create index if not exists idx_playoff_tournament_order
  on playoff_matches(tournament_id, round_order, match_order);

-- Teams: lookup по турниру
create index if not exists idx_teams_tournament
  on teams(tournament_id);
