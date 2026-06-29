-- =============================================
-- Enterprise feature: squad rosters + match lineups
-- team_players: roster of players attached to a tournament team
-- match_lineups: selected players for a specific fixture (starters + subs)
-- =============================================

-- ── Roster: players per tournament team ──────────────────────────────────────
create table if not exists public.team_players (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  name        text not null,
  number      int,
  position    text not null default 'other',  -- goalkeeper | defender | midfielder | forward | other
  photo_url   text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_team_players_team on public.team_players(team_id);

-- ── Lineups: which players play in a given fixture ───────────────────────────
create table if not exists public.match_lineups (
  id          uuid primary key default gen_random_uuid(),
  fixture_id  uuid not null references public.fixtures(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  player_id   uuid not null references public.team_players(id) on delete cascade,
  role        text not null default 'starter',  -- starter | sub
  slot        int,                              -- ordering within formation
  created_at  timestamptz not null default now(),
  unique (fixture_id, player_id)
);
create index if not exists idx_match_lineups_fixture on public.match_lineups(fixture_id);
create index if not exists idx_match_lineups_team    on public.match_lineups(team_id);

-- ── Grants (match project convention: broad grants + server-action ownership) ─
grant select, insert, update, delete on table public.team_players  to authenticated;
grant select, insert, update, delete on table public.match_lineups to authenticated;
grant select on table public.team_players  to anon;
grant select on table public.match_lineups to anon;

-- ── RLS: public read, authenticated write (ownership enforced in actions) ─────
alter table public.team_players  enable row level security;
alter table public.match_lineups enable row level security;

drop policy if exists "team_players public read"   on public.team_players;
drop policy if exists "team_players auth write"     on public.team_players;
drop policy if exists "match_lineups public read"   on public.match_lineups;
drop policy if exists "match_lineups auth write"    on public.match_lineups;

create policy "team_players public read"  on public.team_players  for select using (true);
create policy "team_players auth write"   on public.team_players  for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "match_lineups public read" on public.match_lineups for select using (true);
create policy "match_lineups auth write"  on public.match_lineups for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
