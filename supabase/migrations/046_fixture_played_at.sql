-- =============================================
-- 046: fixtures.played_at — когда матч реально доигран
-- =============================================
-- До этой миграции момента завершения матча в базе не было вообще:
--   * в JSON-LD (SportsEvent.startDate) шло scheduled_at, то есть план, а у
--     матчей без назначенного времени дата отсутствовала совсем;
--   * метрика matches_played_7d считала «сыграно в турнирах, созданных за
--     7 дней», а не «сыграно за 7 дней» — при длинном сезоне это разные числа.
--
-- Историю восстановить неоткуда, поэтому старым сыгранным матчам ставим
-- scheduled_at там, где он был, остальные остаются NULL: пустое значение
-- честнее выдуманного.

alter table fixtures
  add column if not exists played_at timestamptz;

update fixtures
   set played_at = scheduled_at
 where played
   and played_at is null
   and scheduled_at is not null;

-- Метрики и sitemap выбирают по «доиграно недавно» — частичный индекс,
-- потому что незавершённые матчи в этих выборках никогда не участвуют.
create index if not exists idx_fixtures_played_at
  on fixtures (played_at desc)
  where played;

-- =============================================
-- product_metrics() — копия версии из 036, изменена одна строка:
-- matches_played_7d теперь считается по played_at.
-- =============================================
create or replace function public.product_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role   text := coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '');
  uid        uuid := auth.uid();
  is_admin_c boolean := false;
  result     jsonb;
begin
  if uid is not null then
    select coalesce(p.is_admin, false) into is_admin_c from profiles p where p.id = uid;
  end if;

  if jwt_role <> 'service_role' and not is_admin_c then
    raise exception 'Недостаточно прав' using errcode = '42501';
  end if;

  with
  real_p as (
    select * from profiles where not is_internal
  ),
  live_t as (
    select t.* from tournaments t
    join real_p p on p.id = t.user_id
    where t.deleted_at is null
  ),
  first_t as (
    select user_id, min(created_at) as first_at, count(*) as t_count
    from live_t group by user_id
  ),
  ttfv as (
    select extract(epoch from (f.first_at - p.created_at)) / 3600.0 as hours
    from first_t f join real_p p on p.id = f.user_id
    where f.first_at >= p.created_at
  ),
  t_progress as (
    select
      fx.tournament_id,
      count(*) filter (where not fx.is_bye)               as total,
      count(*) filter (where not fx.is_bye and fx.played) as done
    from fixtures fx
    join live_t t on t.id = fx.tournament_id
    group by fx.tournament_id
  ),
  real_subs as (
    select s.* from subscriptions s join real_p p on p.id = s.user_id
  ),
  active_subs as (
    select
      s.amount_kzt,
      greatest(extract(epoch from (s.expires_at - s.started_at)) / 86400.0, 1) as days
    from real_subs s
    where s.expires_at > now() and s.amount_kzt is not null and s.amount_kzt > 0
  )
  select jsonb_build_object(
    'signups_today',  (select count(*) from real_p where created_at >= date_trunc('day', now())),
    'signups_7d',     (select count(*) from real_p where created_at >= now() - interval '7 days'),
    'signups_30d',    (select count(*) from real_p where created_at >= now() - interval '30 days'),
    'signups_total',  (select count(*) from real_p),

    'activated',      (select count(*) from first_t),
    'activation_rate', (
      select case when count(*) = 0 then 0
             else round(100.0 * (select count(*) from first_t) / count(*), 1) end
      from real_p
    ),
    'median_hours_to_first', (
      select round(percentile_cont(0.5) within group (order by hours)::numeric, 1) from ttfv
    ),

    'returning',      (select count(*) from first_t where t_count >= 2),
    'return_rate', (
      select case when count(*) = 0 then 0
             else round(100.0 * count(*) filter (where t_count >= 2) / count(*), 1) end
      from first_t
    ),

    'tournaments_total', (select count(*) from live_t),
    'tournaments_7d',    (select count(*) from live_t where created_at >= now() - interval '7 days'),
    'avg_teams', (
      select round(coalesce(avg(c), 0), 1) from (
        select count(*) as c from teams tm
        join live_t t on t.id = tm.tournament_id
        group by tm.tournament_id
      ) x
    ),
    -- Матчи, доигранные за последние 7 дней. У матчей, завершённых до
    -- миграции 046, played_at пуст — они сюда не попадут.
    'matches_played_7d', (
      select count(*) from fixtures fx
      join live_t t on t.id = fx.tournament_id
      where fx.played and not fx.is_bye and fx.played_at >= now() - interval '7 days'
    ),
    'completed_tournaments', (select count(*) from t_progress where total > 0 and done = total),
    'completion_rate', (
      select case when count(*) filter (where total > 0) = 0 then 0
             else round(100.0 * count(*) filter (where total > 0 and done = total)
                        / count(*) filter (where total > 0), 1) end
      from t_progress
    ),
    'abandoned_tournaments', (select count(*) from t_progress where total > 0 and done = 0),

    'pro_active',        (select count(*) from real_p where plan = 'pro'
                          and (plan_expires_at is null or plan_expires_at > now())),
    'enterprise_active', (select count(*) from real_p where plan = 'enterprise'
                          and (plan_expires_at is null or plan_expires_at > now())),
    'mrr_kzt',           (select round(coalesce(sum(amount_kzt * 30.0 / days), 0)) from active_subs),
    'revenue_30d_kzt',   (select coalesce(sum(amount_kzt), 0) from real_subs
                          where created_at >= now() - interval '30 days'),
    'paying_users',      (select count(distinct user_id) from real_subs where expires_at > now()),
    'conversion_rate', (
      select case when count(*) = 0 then 0
             else round(100.0 * (select count(distinct user_id) from real_subs
                                 where expires_at > now()) / count(*), 1) end
      from real_p
    ),

    'generated_at', now()
  ) into result;

  return result;
end;
$$;
