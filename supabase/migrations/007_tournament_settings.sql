-- 007_tournament_settings.sql
-- Adds configurable match & scoring rules to tournaments
-- Run in Supabase SQL Editor

alter table tournaments
  add column if not exists match_periods      int  not null default 2,
  add column if not exists extra_time         bool not null default false,
  add column if not exists match_duration_mins int not null default 45,
  add column if not exists points_win         int  not null default 3,
  add column if not exists points_draw        int  not null default 1,
  add column if not exists points_loss        int  not null default 0;
