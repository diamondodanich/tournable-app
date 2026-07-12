-- Double Elimination support for playoff_matches.
--
-- A DE bracket has three sub-brackets:
--   'WB' — winners (upper) bracket
--   'LB' — losers (lower) bracket
--   'GF' — grand final (single match: WB champion vs LB champion)
--
-- The loser of each WB match "drops" into a specific LB match. Two new columns
-- mirror the existing winner_to_match / winner_slot pair so the same
-- savePlayoffResult routing logic can advance the loser as well.
--
-- All columns are nullable / additive: single-elimination brackets leave
-- `bracket` NULL (treated as 'WB') and never set loser_to_match, so existing
-- tournaments and code paths are completely unaffected.

alter table public.playoff_matches
  add column if not exists bracket        text,
  add column if not exists loser_to_match uuid references public.playoff_matches(id) on delete set null,
  add column if not exists loser_slot     text;

-- Optional guard: bracket must be one of the known values (or NULL for legacy rows).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'playoff_matches_bracket_check'
  ) then
    alter table public.playoff_matches
      add constraint playoff_matches_bracket_check
      check (bracket is null or bracket in ('WB', 'LB', 'GF'));
  end if;
end $$;
