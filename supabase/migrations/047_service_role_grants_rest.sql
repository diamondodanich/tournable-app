-- =============================================
-- TOURNABLE — доборные права service_role на оставшиеся таблицы
-- =============================================
-- Миграция 041 закрыла только те таблицы, куда ходил webhook оплаты:
-- profiles, subscriptions, payment_orders, tournaments, tournament_members.
-- Остальные базовые таблицы (teams, fixtures, match_events, составы,
-- чемпионаты) так и остались без GRANT для service_role: любой серверный
-- скрипт на SUPABASE_SERVICE_ROLE_KEY падает на них с 42501
-- "permission denied for table teams".
--
-- Всплыло при массовом заведении турнира из внешних данных (демо для лиги).
-- service_role обходит RLS, но табличные GRANT ему всё равно нужны.
--
-- alter default privileges из 041 покрывает только таблицы, созданные ПОСЛЕ
-- него, поэтому существующие приходится перечислять руками.

do $$
declare
  t text;
begin
  foreach t in array array[
    'teams',
    'fixtures',
    'match_events',
    'playoff_matches',
    'live_games',
    'team_players',
    'match_lineups',
    'leagues',
    'league_teams',
    'players',
    'league_members',
    'leaderboard_entries'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on table public.%I to service_role', t);
    end if;
  end loop;
end $$;
