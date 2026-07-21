-- =============================================
-- 037: Временной ряд для графиков на /admin/metrics
-- =============================================
-- Отдаёт по одной строке на КАЖДЫЙ день периода, включая дни без событий
-- (generate_series + left join) — иначе график схлопывает пустые дни и врёт
-- о темпе роста. Внутренние аккаунты исключены так же, как в 036.

create or replace function public.metrics_timeseries(days integer default 30)
returns table (
  day               date,
  signups           bigint,
  tournaments       bigint,
  cum_signups       bigint,
  cum_tournaments   bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role   text := coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '');
  uid        uuid := auth.uid();
  is_admin_c boolean := false;
  span       integer := least(greatest(coalesce(days, 30), 1), 365);
  from_day   date;
begin
  if uid is not null then
    select coalesce(p.is_admin, false) into is_admin_c from profiles p where p.id = uid;
  end if;

  if jwt_role <> 'service_role' and not is_admin_c then
    raise exception 'Недостаточно прав' using errcode = '42501';
  end if;

  from_day := (current_date - (span - 1));

  return query
  with
  real_p as (
    select * from profiles where not is_internal
  ),
  live_t as (
    select t.* from tournaments t
    join real_p p on p.id = t.user_id
    where t.deleted_at is null
  ),
  cal as (
    select generate_series(from_day, current_date, interval '1 day')::date as d
  ),
  s_day as (
    select created_at::date as d, count(*) as n
    from real_p where created_at::date >= from_day group by 1
  ),
  t_day as (
    select created_at::date as d, count(*) as n
    from live_t where created_at::date >= from_day group by 1
  ),
  -- Накопленный итог на начало периода, чтобы кумулятивная линия
  -- не начиналась с нуля при уже существующей базе пользователей
  base as (
    select
      (select count(*) from real_p where created_at::date < from_day) as s0,
      (select count(*) from live_t where created_at::date < from_day) as t0
  )
  select
    cal.d,
    coalesce(s_day.n, 0),
    coalesce(t_day.n, 0),
    (select s0 from base) + sum(coalesce(s_day.n, 0)) over (order by cal.d),
    (select t0 from base) + sum(coalesce(t_day.n, 0)) over (order by cal.d)
  from cal
  left join s_day on s_day.d = cal.d
  left join t_day on t_day.d = cal.d
  order by cal.d;
end;
$$;

revoke all on function public.metrics_timeseries(integer) from public;
grant execute on function public.metrics_timeseries(integer) to authenticated, service_role;
