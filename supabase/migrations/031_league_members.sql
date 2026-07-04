-- Championship (league) co-editors — mirrors tournament_members so a championship
-- owner can invite editors/viewers for the WHOLE championship (all seasons).
create table if not exists public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor','viewer')),
  status text not null default 'pending' check (status in ('pending','accepted')),
  invite_token uuid,
  invited_email text,
  created_at timestamptz not null default now()
);

create index if not exists league_members_league_id_idx on public.league_members(league_id);
create index if not exists league_members_user_id_idx on public.league_members(user_id);
create index if not exists league_members_token_idx on public.league_members(invite_token);

alter table public.league_members enable row level security;

-- League owner: full control over their championship's members.
drop policy if exists "owner_all_league_members" on public.league_members;
create policy "owner_all_league_members" on public.league_members
  for all to authenticated
  using (exists (select 1 from public.leagues l where l.id = league_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.leagues l where l.id = league_id and l.owner_id = auth.uid()));

-- A member can read their own membership row.
drop policy if exists "member_read_own_league" on public.league_members;
create policy "member_read_own_league" on public.league_members
  for select to authenticated
  using (user_id = auth.uid());

-- Any authenticated user can read a pending invite (needed to accept by token).
drop policy if exists "read_pending_league_invite" on public.league_members;
create policy "read_pending_league_invite" on public.league_members
  for select to authenticated
  using (status = 'pending');

-- Accept invite: the authenticated user claims a pending invite for themselves.
drop policy if exists "accept_league_invite" on public.league_members;
create policy "accept_league_invite" on public.league_members
  for update to authenticated
  using (status = 'pending')
  with check (user_id = auth.uid());

grant select, insert, update, delete on table public.league_members to authenticated;
