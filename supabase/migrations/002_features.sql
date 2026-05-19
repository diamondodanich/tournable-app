-- =============================================
-- TOURNABLE — Phase 6 features migration
-- Run this in Supabase SQL Editor
-- =============================================

-- 3.4: Rename scorers → match_events (if scorers exists), add type/minute
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'scorers') then
    alter table scorers rename to match_events;
  end if;
end $$;

-- Create match_events from scratch if neither table exists yet
create table if not exists match_events (
  id uuid default gen_random_uuid() primary key,
  fixture_id uuid references fixtures(id) on delete cascade not null,
  team_id uuid references teams(id) on delete cascade not null,
  player_name text not null default '',
  type text not null default 'goal',
  minute integer,
  created_at timestamptz default now() not null
);

alter table match_events add column if not exists type text not null default 'goal';
alter table match_events add column if not exists minute integer;

-- 3.2: Logo URLs for teams and tournaments
alter table teams add column if not exists logo_url text;
alter table tournaments add column if not exists logo_url text;

-- 3.5: Tournament format
alter table tournaments add column if not exists format text not null default 'round_robin';

-- 3.5: Playoff matches table
create table if not exists playoff_matches (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  round_order integer not null,    -- 1=Final, 2=SF, 4=QF, 8=R16 …
  match_order integer not null,    -- position within the round
  home_team_id uuid references teams(id) on delete set null,
  away_team_id uuid references teams(id) on delete set null,
  home_score integer,
  away_score integer,
  winner_id uuid references teams(id) on delete set null,
  winner_to_match uuid references playoff_matches(id) on delete set null,
  winner_slot text,               -- 'home' | 'away'
  created_at timestamptz default now() not null
);

-- 3.3: Live scoreboard table
create table if not exists live_games (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null unique,
  home_team_id uuid references teams(id) on delete set null,
  away_team_id uuid references teams(id) on delete set null,
  home_score integer not null default 0,
  away_score integer not null default 0,
  period text not null default '1st',
  timer_running boolean not null default false,
  accumulated_secs integer not null default 0,
  started_at timestamptz,
  created_at timestamptz default now() not null
);

-- 3.6: Tournament members (collaboration)
create table if not exists tournament_members (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'viewer',   -- 'editor' | 'viewer'
  status text not null default 'pending', -- 'pending' | 'accepted'
  invite_token text unique,
  created_at timestamptz default now() not null
);

-- =============================================
-- Storage bucket for logos
-- =============================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "logos_auth_insert" on storage.objects;
create policy "logos_auth_insert" on storage.objects
  for insert with check (bucket_id = 'logos' and auth.role() = 'authenticated');

drop policy if exists "logos_auth_update" on storage.objects;
create policy "logos_auth_update" on storage.objects
  for update using (bucket_id = 'logos' and auth.role() = 'authenticated');

drop policy if exists "logos_auth_delete" on storage.objects;
create policy "logos_auth_delete" on storage.objects
  for delete using (bucket_id = 'logos' and auth.role() = 'authenticated');

-- =============================================
-- RLS for new tables
-- =============================================

alter table playoff_matches enable row level security;
alter table live_games enable row level security;
alter table tournament_members enable row level security;

-- Playoff matches: owner + members
drop policy if exists "playoff_select" on playoff_matches;
create policy "playoff_select" on playoff_matches for select using (
  exists (select 1 from tournaments where id = playoff_matches.tournament_id)
);
drop policy if exists "playoff_insert" on playoff_matches;
create policy "playoff_insert" on playoff_matches for insert with check (
  exists (select 1 from tournaments where id = playoff_matches.tournament_id and user_id = auth.uid())
);
drop policy if exists "playoff_update" on playoff_matches;
create policy "playoff_update" on playoff_matches for update using (
  exists (select 1 from tournaments where id = playoff_matches.tournament_id and user_id = auth.uid())
  or exists (select 1 from tournament_members where tournament_id = playoff_matches.tournament_id and user_id = auth.uid() and role = 'editor' and status = 'accepted')
);
drop policy if exists "playoff_delete" on playoff_matches;
create policy "playoff_delete" on playoff_matches for delete using (
  exists (select 1 from tournaments where id = playoff_matches.tournament_id and user_id = auth.uid())
);

-- Live games: public read, owner + editors write
drop policy if exists "live_select" on live_games;
create policy "live_select" on live_games for select using (true);
drop policy if exists "live_insert" on live_games;
create policy "live_insert" on live_games for insert with check (
  exists (select 1 from tournaments where id = live_games.tournament_id and user_id = auth.uid())
);
drop policy if exists "live_update" on live_games;
create policy "live_update" on live_games for update using (
  exists (select 1 from tournaments where id = live_games.tournament_id and user_id = auth.uid())
  or exists (select 1 from tournament_members where tournament_id = live_games.tournament_id and user_id = auth.uid() and role = 'editor' and status = 'accepted')
);
drop policy if exists "live_delete" on live_games;
create policy "live_delete" on live_games for delete using (
  exists (select 1 from tournaments where id = live_games.tournament_id and user_id = auth.uid())
);

-- Tournament members: owner full control, members see own row
drop policy if exists "members_select" on tournament_members;
create policy "members_select" on tournament_members for select using (
  user_id = auth.uid()
  or exists (select 1 from tournaments where id = tournament_members.tournament_id and user_id = auth.uid())
);
drop policy if exists "members_insert" on tournament_members;
create policy "members_insert" on tournament_members for insert with check (
  exists (select 1 from tournaments where id = tournament_members.tournament_id and user_id = auth.uid())
);
drop policy if exists "members_update" on tournament_members;
create policy "members_update" on tournament_members for update using (
  user_id = auth.uid()
  or exists (select 1 from tournaments where id = tournament_members.tournament_id and user_id = auth.uid())
);
drop policy if exists "members_delete" on tournament_members;
create policy "members_delete" on tournament_members for delete using (
  exists (select 1 from tournaments where id = tournament_members.tournament_id and user_id = auth.uid())
);

-- Allow anyone to read invite by token (needed for accept flow)
drop policy if exists "members_invite_read" on tournament_members;
create policy "members_invite_read" on tournament_members for select using (invite_token is not null);

-- Update RLS policies to allow editors to update fixtures and match_events
drop policy if exists "fixtures_update" on fixtures;
create policy "fixtures_update" on fixtures for update using (
  exists (select 1 from tournaments where id = fixtures.tournament_id and user_id = auth.uid())
  or exists (select 1 from tournament_members where tournament_id = fixtures.tournament_id and user_id = auth.uid() and role = 'editor' and status = 'accepted')
);

drop policy if exists "scorers_update" on match_events;
drop policy if exists "scorers_insert" on match_events;
drop policy if exists "scorers_delete" on match_events;
drop policy if exists "scorers_select" on match_events;

drop policy if exists "match_events_select" on match_events;
create policy "match_events_select" on match_events for select using (
  exists (
    select 1 from fixtures join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = match_events.fixture_id
  )
);
drop policy if exists "match_events_insert" on match_events;
create policy "match_events_insert" on match_events for insert with check (
  exists (
    select 1 from fixtures join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = match_events.fixture_id
    and (tournaments.user_id = auth.uid()
      or exists (select 1 from tournament_members where tournament_id = tournaments.id and user_id = auth.uid() and role = 'editor' and status = 'accepted'))
  )
);
drop policy if exists "match_events_update" on match_events;
create policy "match_events_update" on match_events for update using (
  exists (
    select 1 from fixtures join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = match_events.fixture_id
    and (tournaments.user_id = auth.uid()
      or exists (select 1 from tournament_members where tournament_id = tournaments.id and user_id = auth.uid() and role = 'editor' and status = 'accepted'))
  )
);
drop policy if exists "match_events_delete" on match_events;
create policy "match_events_delete" on match_events for delete using (
  exists (
    select 1 from fixtures join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = match_events.fixture_id
    and (tournaments.user_id = auth.uid()
      or exists (select 1 from tournament_members where tournament_id = tournaments.id and user_id = auth.uid() and role = 'editor' and status = 'accepted'))
  )
);
