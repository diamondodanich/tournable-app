-- =============================================
-- TOURNABLE — Link live_games to fixtures
-- Run this in Supabase SQL Editor
-- =============================================

alter table live_games
  add column if not exists fixture_id uuid references fixtures(id) on delete set null;
