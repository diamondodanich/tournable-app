-- Best-of-N playoff series (e.g. best-of-3/5/7 for basketball, volleyball, hockey, esports).
-- We reuse playoff_matches.home_score / away_score as GAMES WON in the series when best_of > 1.
-- winner_id is set to whoever reaches ceil(best_of / 2) wins (single game when best_of = 1).

alter table public.playoff_matches
  add column if not exists best_of integer not null default 1;

alter table public.tournaments
  add column if not exists playoff_best_of integer not null default 1;
