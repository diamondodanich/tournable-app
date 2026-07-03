-- Championship season periodicity: drives automatic, logically-continuing season
-- names (Seasonal 2025/2026, Yearly 2026, Monthly, Quarterly, Weekly, Daily).
alter table public.leagues
  add column if not exists season_period text not null default 'seasonal';
