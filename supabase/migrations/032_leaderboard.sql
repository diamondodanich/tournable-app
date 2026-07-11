-- Leaderboard / points format: participants ranked by points accumulated across
-- rounds/events, with no head-to-head fixtures (races, battle royale, athletics,
-- chess "arena", etc.). One row per participant per round.

create table if not exists public.leaderboard_entries (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id       uuid not null references public.teams(id) on delete cascade,
  round         integer not null default 1,
  points        numeric not null default 0,
  created_at    timestamptz not null default now(),
  unique (tournament_id, team_id, round)
);

create index if not exists leaderboard_entries_tournament_idx
  on public.leaderboard_entries (tournament_id);

alter table public.leaderboard_entries enable row level security;

-- Public read (public tournament pages), owner/editor write via existing grants.
drop policy if exists leaderboard_select on public.leaderboard_entries;
create policy leaderboard_select on public.leaderboard_entries
  for select using (true);

drop policy if exists leaderboard_write on public.leaderboard_entries;
create policy leaderboard_write on public.leaderboard_entries
  for all to authenticated using (true) with check (true);
