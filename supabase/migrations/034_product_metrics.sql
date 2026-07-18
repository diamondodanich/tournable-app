-- =============================================
-- 034: Продуктовые метрики для админ-дашборда
-- =============================================
-- Одна SECURITY DEFINER функция, считающая все ключевые метрики за один запрос.
-- SECURITY DEFINER нужен, чтобы обойти RLS (метрики агрегируются по всем
-- пользователям). Доступ строго ограничен: только profiles.is_admin = true
-- либо service_role (для крона с ежедневным дайджестом).

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
  -- ── Проверка прав ────────────────────────────────────────────────────────
  if uid is not null then
    select coalesce(p.is_admin, false) into is_admin_c from profiles p where p.id = uid;
  end if;

  if jwt_role <> 'service_role' and not is_admin_c then
    raise exception 'Недостаточно прав' using errcode = '42501';
  end if;

  -- ── Сбор метрик ──────────────────────────────────────────────────────────
  with
  -- Живые турниры (без учёта корзины)
  live_t as (
    select * from tournaments where deleted_at is null
  ),
  -- Первый турнир каждого пользователя
  first_t as (
    select user_id, min(created_at) as first_at, count(*) as t_count
    from live_t group by user_id
  ),
  -- Часы от регистрации до создания первого турнира
  ttfv as (
    select extract(epoch from (f.first_at - p.created_at)) / 3600.0 as hours
    from first_t f join profiles p on p.id = f.user_id
    where f.first_at >= p.created_at
  ),
  -- Прогресс каждого турнира по сыгранным матчам (bye не считаем)
  t_progress as (
    select
      fx.tournament_id,
      count(*) filter (where not fx.is_bye)                    as total,
      count(*) filter (where not fx.is_bye and fx.played)      as done
    from fixtures fx
    join live_t t on t.id = fx.tournament_id
    group by fx.tournament_id
  ),
  -- Активные платные подписки, нормализованные в месячную выручку
  active_subs as (
    select
      s.amount_kzt,
      greatest(extract(epoch from (s.expires_at - s.started_at)) / 86400.0, 1) as days
    from subscriptions s
    where s.expires_at > now()
      and s.amount_kzt is not null
      and s.amount_kzt > 0
  )
  select jsonb_build_object(
    -- ── Привлечение ────────────────────────────────────────────────────────
    'signups_today',  (select count(*) from profiles where created_at >= date_trunc('day', now())),
    'signups_7d',     (select count(*) from profiles where created_at >= now() - interval '7 days'),
    'signups_30d',    (select count(*) from profiles where created_at >= now() - interval '30 days'),
    'signups_total',  (select count(*) from profiles),

    -- ── Активация ──────────────────────────────────────────────────────────
    'activated',      (select count(*) from first_t),
    'activation_rate', (
      select case when count(*) = 0 then 0
             else round(100.0 * (select count(*) from first_t) / count(*), 1) end
      from profiles
    ),
    'median_hours_to_first', (
      select round(percentile_cont(0.5) within group (order by hours)::numeric, 1) from ttfv
    ),

    -- ── Возврат ────────────────────────────────────────────────────────────
    'returning',      (select count(*) from first_t where t_count >= 2),
    'return_rate', (
      select case when count(*) = 0 then 0
             else round(100.0 * count(*) filter (where t_count >= 2) / count(*), 1) end
      from first_t
    ),

    -- ── Использование ──────────────────────────────────────────────────────
    'tournaments_total', (select count(*) from live_t),
    'tournaments_7d',    (select count(*) from live_t where created_at >= now() - interval '7 days'),
    'avg_teams', (
      select round(coalesce(avg(c), 0), 1) from (
        select count(*) as c from teams tm
        join live_t t on t.id = tm.tournament_id
        group by tm.tournament_id
      ) x
    ),
    'matches_played_7d', (
      select count(*) from fixtures fx
      join live_t t on t.id = fx.tournament_id
      where fx.played and not fx.is_bye and fx.created_at >= now() - interval '7 days'
    ),
    -- Доведён до конца: все матчи сыграны
    'completed_tournaments', (select count(*) from t_progress where total > 0 and done = total),
    'completion_rate', (
      select case when count(*) filter (where total > 0) = 0 then 0
             else round(100.0 * count(*) filter (where total > 0 and done = total)
                        / count(*) filter (where total > 0), 1) end
      from t_progress
    ),
    -- Турниры, где не сыграно вообще ничего — созданы и брошены
    'abandoned_tournaments', (select count(*) from t_progress where total > 0 and done = 0),

    -- ── Деньги ─────────────────────────────────────────────────────────────
    'pro_active',        (select count(*) from profiles where plan = 'pro'
                          and (plan_expires_at is null or plan_expires_at > now())),
    'enterprise_active', (select count(*) from profiles where plan = 'enterprise'
                          and (plan_expires_at is null or plan_expires_at > now())),
    'mrr_kzt',           (select round(coalesce(sum(amount_kzt * 30.0 / days), 0)) from active_subs),
    'revenue_30d_kzt',   (select coalesce(sum(amount_kzt), 0) from subscriptions
                          where created_at >= now() - interval '30 days'),
    'paying_users',      (select count(distinct user_id) from subscriptions where expires_at > now()),
    'conversion_rate', (
      select case when count(*) = 0 then 0
             else round(100.0 * (select count(distinct user_id) from subscriptions
                                 where expires_at > now()) / count(*), 1) end
      from profiles
    ),

    'generated_at', now()
  ) into result;

  return result;
end;
$$;

revoke all on function public.product_metrics() from public;
grant execute on function public.product_metrics() to authenticated, service_role;
