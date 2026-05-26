-- 012_sport.sql
-- Adds sport type to tournaments

alter table tournaments
  add column if not exists sport text not null default 'football';
