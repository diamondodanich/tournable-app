-- 014_soft_delete_tournaments.sql
-- Soft delete: tournaments get deleted_at timestamp instead of hard delete.
-- Free plan limit now counts ACTIVE (non-deleted) tournaments only.

alter table tournaments
  add column if not exists deleted_at timestamptz default null;

create index if not exists tournaments_deleted_at_idx
  on tournaments (user_id, deleted_at)
  where deleted_at is null;
