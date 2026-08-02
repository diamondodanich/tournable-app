-- Championship (league) cover banner — same model as tournaments.cover_url:
-- either "theme:<id>" (gradient preset from src/lib/cover-themes.ts) or a public
-- storage URL of an uploaded image.
alter table public.leagues
  add column if not exists cover_url text;
