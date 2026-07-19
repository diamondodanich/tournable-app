-- =============================================
-- 036: Исключение внутренних аккаунтов из аналитики
-- =============================================
-- Свои и тестовые аккаунты искажают метрики пре-запуска: активация 100 %,
-- MRR из ручных выдач Pro через админ-переключатель и т.п.
-- Помеченные profiles.is_internal полностью исключаются из product_metrics()
-- и recent_users(). Пометить новый тестовый аккаунт:
--   update profiles set is_internal = true
--   where id = (select id from auth.users where email = 'test@example.com');

alter table profiles
  add column if not exists is_internal boolean not null default false;

-- Помечаем аккаунты, существующие на 2026-07-19 (владелец + тестовые)
update profiles set is_internal = true
where id in (
  select id from auth.users
  where email in (
    'askardancho2003@gmail.com',
    'ilgeriustaz@gmail.com',
    'qairullassylmurat@gmail.com',
    'yerlen89@gmail.com'
  )
);

-- =============================================
-- product_metrics() — та же логика, что в 034, но с фильтром is_internal
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
  -- Только внешние пользователи
  real_p as (
    select * from profiles where not is_internal
  ),
  -- Живые турниры внешних пользователей
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
    'matches_played_7d', (
      select count(*) from fixtures fx
      join live_t t on t.id = fx.tournament_id
      where fx.played and not fx.is_bye and fx.created_at >= now() - interval '7 days'
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

-- =============================================
-- recent_users() — тот же фильтр
-- =============================================
create or replace function public.recent_users(limit_count integer default 50)
returns table (
  user_id          uuid,
  email            text,
  signed_up_at     timestamptz,
  plan             text,
  tournaments      bigint,
  matches_played   bigint,
  last_activity_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role   text := coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '');
  uid        uuid := auth.uid();
  is_admin_c boolean := false;
begin
  if uid is not null then
    select coalesce(p.is_admin, false) into is_admin_c from profiles p where p.id = uid;
  end if;

  if jwt_role <> 'service_role' and not is_admin_c then
    raise exception 'Недостаточно прав' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.created_at,
    p.plan,
    coalesce(t.cnt, 0),
    coalesce(t.played, 0),
    greatest(p.created_at, coalesce(t.last_at, p.created_at))
  from profiles p
  join auth.users u on u.id = p.id
  left join lateral (
    select
      count(*)                          as cnt,
      max(tr.created_at)                as last_at,
      coalesce(sum(fx.played_count), 0) as played
    from tournaments tr
    left join lateral (
      select count(*) as played_count
      from fixtures f
      where f.tournament_id = tr.id and f.played and not f.is_bye
    ) fx on true
    where tr.user_id = p.id and tr.deleted_at is null
  ) t on true
  where not p.is_internal
  order by p.created_at desc
  limit least(greatest(limit_count, 1), 200);
end;
$$;

revoke all on function public.product_metrics() from public;
grant execute on function public.product_metrics() to authenticated, service_role;
revoke all on function public.recent_users(integer) from public;
grant execute on function public.recent_users(integer) to authenticated, service_role;
