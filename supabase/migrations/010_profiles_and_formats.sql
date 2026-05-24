-- =============================================
-- TOURNABLE — Profiles table & groups/playoff format columns
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. profiles table
-- =============================================
create table if not exists profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  plan            text not null default 'free' check (plan in ('free', 'pro')),
  plan_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table profiles enable row level security;

-- Single owner-only policy (all operations)
drop policy if exists "profiles_owner" on profiles;
create policy "profiles_owner" on profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- 2. teams — group_name column for groups_playoff format
-- =============================================
alter table teams
  add column if not exists group_name text;

-- =============================================
-- 3. tournaments — groups_count and teams_advance columns
-- =============================================
alter table tournaments
  add column if not exists groups_count  integer default 4,
  add column if not exists teams_advance integer default 2;

-- =============================================
-- 4. Index on profiles(plan) for fast plan checks
-- =============================================
create index if not exists profiles_plan_idx on profiles (plan);
