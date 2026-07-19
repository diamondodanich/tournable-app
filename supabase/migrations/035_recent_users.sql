-- =============================================
-- 035: Список последних пользователей для админ-дашборда
-- =============================================
-- Отдаёт e-mail из auth.users (недоступен через обычный клиент) вместе с
-- активностью по каждому пользователю. Гейт прав — тот же, что в 034:
-- только profiles.is_admin = true либо service_role.

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
      count(*)                              as cnt,
      max(tr.created_at)                    as last_at,
      coalesce(sum(fx.played_count), 0)     as played
    from tournaments tr
    left join lateral (
      select count(*) as played_count
      from fixtures f
      where f.tournament_id = tr.id and f.played and not f.is_bye
    ) fx on true
    where tr.user_id = p.id and tr.deleted_at is null
  ) t on true
  order by p.created_at desc
  limit least(greatest(limit_count, 1), 200);
end;
$$;

revoke all on function public.recent_users(integer) from public;
grant execute on function public.recent_users(integer) to authenticated, service_role;
