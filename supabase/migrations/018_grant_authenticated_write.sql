-- =============================================
-- Fix: explicit GRANT write access to authenticated role
-- Tables created via migrations may not inherit default privileges.
-- This is the definitive fix for "permission denied for table X" errors.
-- =============================================

-- Core game tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fixtures         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.live_games       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.match_events     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.playoff_matches  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tournament_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tournaments      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teams            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles         TO authenticated;

-- Read-only for anon (public pages)
GRANT SELECT ON TABLE public.fixtures         TO anon;
GRANT SELECT ON TABLE public.live_games       TO anon;
GRANT SELECT ON TABLE public.match_events     TO anon;
GRANT SELECT ON TABLE public.playoff_matches  TO anon;
GRANT SELECT ON TABLE public.tournaments      TO anon;
GRANT SELECT ON TABLE public.teams            TO anon;

-- Ensure future tables also get grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
