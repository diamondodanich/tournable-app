-- =============================================
-- TOURNABLE — истечение подписки для ВСЕХ платных планов
-- =============================================
-- Функция из миграции 016 снимала только plan = 'pro'. Enterprise появился
-- позже (021), в условие его не добавили — истёкшая подписка Enterprise
-- оставалась активной бессрочно: оплатил один месяц, пользуешься вечно.
--
-- Заодно возвращаем grant для service_role: cron ходит под ним (см. 041).

create or replace function public.deactivate_expired_subscriptions()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update profiles
  set
    plan            = 'free',
    plan_expires_at = null,
    updated_at      = now()
  where
    plan in ('pro', 'enterprise')
    and plan_expires_at is not null
    and plan_expires_at < now();

  get diagnostics v_count = row_count;
  return json_build_object('deactivated', v_count);
end;
$$;

grant execute on function public.deactivate_expired_subscriptions()
  to anon, authenticated, service_role;
