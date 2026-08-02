-- =============================================
-- TOURNABLE — починка матчей с пустой стороной, не помеченных как bye
-- =============================================
-- generateRoundRobin дополняет нечётный список команд значением null и в
-- нечётных турах меняет местами хозяев и гостей. Из-за этого null мог оказаться
-- в позиции home, а обе функции-построителя (buildRoundRobinFixtures и
-- buildGroupsFixtures) проверяли только away. Такие матчи попадали в БД как
-- обычные: home_team_id = null, is_bye = false.
--
-- Код исправлен, эта миграция приводит в порядок уже записанные строки:
-- матч с любой пустой стороной — это техническая победа, реальная команда
-- должна лежать в home_team_id, away_team_id остаётся пустым.
--
-- Затронуто на момент написания: 32 строки в 8 турнирах, ни одна не помечена
-- сыгранной, поэтому турнирные таблицы не пострадали.

-- Сыгранные строки не трогаем: там может быть введённый счёт, и молча
-- превращать такой матч в техническую победу нельзя.
update public.fixtures
set
  is_bye       = true,
  home_team_id = coalesce(home_team_id, away_team_id),
  away_team_id = null
where is_bye = false
  and played = false
  and (home_team_id is null or away_team_id is null);

-- Диагностика: если остались сыгранные матчи с пустой стороной, их надо
-- разобрать вручную — запрос ниже показывает такие строки.
--
--   select id, tournament_id, home_team_id, away_team_id, home_score, away_score
--   from public.fixtures
--   where is_bye = false and played = true
--     and (home_team_id is null or away_team_id is null);
