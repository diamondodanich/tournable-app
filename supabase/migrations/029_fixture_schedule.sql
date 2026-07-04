-- Match scheduling (Calendar feature): optional date/time per fixture.
alter table public.fixtures
  add column if not exists scheduled_at timestamptz;
