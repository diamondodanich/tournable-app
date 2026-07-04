-- Player photos: avatar shown wherever a player's name appears.
alter table public.players
  add column if not exists photo_url text;
