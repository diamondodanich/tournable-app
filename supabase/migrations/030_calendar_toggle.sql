-- Championship-level toggle for the Calendar feature (per-match dates/times).
alter table public.leagues
  add column if not exists calendar_enabled boolean not null default false;
