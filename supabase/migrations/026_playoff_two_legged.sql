-- Two-legged playoff ties (aggregate over a fixed number of games), as an
-- alternative to best-of-N series. When two_legged = true, home_score / away_score
-- hold the AGGREGATE score across the tie and the higher aggregate wins.
-- Mutually exclusive with best_of (> 1): the wizard sets one or the other.

alter table public.tournaments
  add column if not exists playoff_two_legged boolean not null default false;

alter table public.playoff_matches
  add column if not exists two_legged boolean not null default false;
