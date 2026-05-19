-- =============================================
-- TOURNABLE — Fixture status (state machine)
-- Run this in Supabase SQL Editor
-- =============================================

-- Add status column to fixtures
alter table fixtures
  add column if not exists status text not null default 'scheduled';

-- Backfill: played=true → finished
update fixtures set status = 'finished' where played = true;

-- Index for status filter
create index if not exists idx_fixtures_status
  on fixtures(tournament_id, status);
