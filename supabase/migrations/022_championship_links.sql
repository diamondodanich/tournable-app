-- =============================================
-- Championships: link tournament teams to persistent championship (league) teams
-- Enables player/team stats to carry across seasons (Flashscore-style).
-- =============================================

-- Link a tournament team to the persistent championship team it represents
alter table public.teams
  add column if not exists league_team_id uuid references public.league_teams(id) on delete set null;

create index if not exists idx_teams_league_team on public.teams(league_team_id);

-- seasons.name and leagues.logo_url already exist per current types; ensure they're present
alter table public.seasons add column if not exists name text;
alter table public.leagues add column if not exists logo_url text;
