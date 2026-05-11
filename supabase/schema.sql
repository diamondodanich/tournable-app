-- =============================================
-- TOURNABLE — схема базы данных
-- =============================================

-- Турниры
create table tournaments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  num_rounds integer default 2 not null,
  generated boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Команды
create table teams (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null
);

-- Матчи
create table fixtures (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  matchday integer not null,
  round integer not null,
  cycle_round integer not null,
  home_team_id uuid references teams(id) on delete set null,
  away_team_id uuid references teams(id) on delete set null,
  home_score integer,
  away_score integer,
  played boolean default false not null,
  is_bye boolean default false not null,
  created_at timestamptz default now() not null
);

-- Бомбардиры
create table scorers (
  id uuid default gen_random_uuid() primary key,
  fixture_id uuid references fixtures(id) on delete cascade not null,
  team_id uuid references teams(id) on delete cascade not null,
  player_name text not null,
  created_at timestamptz default now() not null
);

-- =============================================
-- ROW LEVEL SECURITY (каждый видит только своё)
-- =============================================

alter table tournaments enable row level security;
alter table teams enable row level security;
alter table fixtures enable row level security;
alter table scorers enable row level security;

-- Турниры: пользователь управляет только своими
create policy "tournaments_select" on tournaments for select using (auth.uid() = user_id);
create policy "tournaments_insert" on tournaments for insert with check (auth.uid() = user_id);
create policy "tournaments_update" on tournaments for update using (auth.uid() = user_id);
create policy "tournaments_delete" on tournaments for delete using (auth.uid() = user_id);

-- Команды: доступ через турнир
create policy "teams_select" on teams for select using (
  exists (select 1 from tournaments where tournaments.id = teams.tournament_id and tournaments.user_id = auth.uid())
);
create policy "teams_insert" on teams for insert with check (
  exists (select 1 from tournaments where tournaments.id = teams.tournament_id and tournaments.user_id = auth.uid())
);
create policy "teams_update" on teams for update using (
  exists (select 1 from tournaments where tournaments.id = teams.tournament_id and tournaments.user_id = auth.uid())
);
create policy "teams_delete" on teams for delete using (
  exists (select 1 from tournaments where tournaments.id = teams.tournament_id and tournaments.user_id = auth.uid())
);

-- Матчи: доступ через турнир
create policy "fixtures_select" on fixtures for select using (
  exists (select 1 from tournaments where tournaments.id = fixtures.tournament_id and tournaments.user_id = auth.uid())
);
create policy "fixtures_insert" on fixtures for insert with check (
  exists (select 1 from tournaments where tournaments.id = fixtures.tournament_id and tournaments.user_id = auth.uid())
);
create policy "fixtures_update" on fixtures for update using (
  exists (select 1 from tournaments where tournaments.id = fixtures.tournament_id and tournaments.user_id = auth.uid())
);
create policy "fixtures_delete" on fixtures for delete using (
  exists (select 1 from tournaments where tournaments.id = fixtures.tournament_id and tournaments.user_id = auth.uid())
);

-- Бомбардиры: доступ через матч → турнир
create policy "scorers_select" on scorers for select using (
  exists (
    select 1 from fixtures
    join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = scorers.fixture_id and tournaments.user_id = auth.uid()
  )
);
create policy "scorers_insert" on scorers for insert with check (
  exists (
    select 1 from fixtures
    join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = scorers.fixture_id and tournaments.user_id = auth.uid()
  )
);
create policy "scorers_update" on scorers for update using (
  exists (
    select 1 from fixtures
    join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = scorers.fixture_id and tournaments.user_id = auth.uid()
  )
);
create policy "scorers_delete" on scorers for delete using (
  exists (
    select 1 from fixtures
    join tournaments on tournaments.id = fixtures.tournament_id
    where fixtures.id = scorers.fixture_id and tournaments.user_id = auth.uid()
  )
);

-- =============================================
-- ПУБЛИЧНЫЙ ДОСТУП для share-ссылок
-- =============================================

create policy "tournaments_public_select" on tournaments for select using (true);
create policy "teams_public_select" on teams for select using (true);
create policy "fixtures_public_select" on fixtures for select using (true);
create policy "scorers_public_select" on scorers for select using (true);

-- =============================================
-- АВТООБНОВЛЕНИЕ updated_at
-- =============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tournaments_updated_at
  before update on tournaments
  for each row execute function update_updated_at();
