-- Add invited_email to tournament_members so the owner can see who was invited
ALTER TABLE public.tournament_members ADD COLUMN IF NOT EXISTS invited_email text;
