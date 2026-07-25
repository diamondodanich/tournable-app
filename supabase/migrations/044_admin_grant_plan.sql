-- =============================================
-- TOURNABLE — выдача плана админом с записью платежа
-- =============================================
-- Заменяет admin_set_plan из 043. Причина: продажи через менеджера (WhatsApp)
-- идут мимо шлюза, и если при ручной выдаче не писать строку в subscriptions,
-- выручка от них не попадёт в метрики — MRR в product_metrics() считается
-- как раз по subscriptions.amount_kzt, а не по profiles.plan.
--
-- p_months = null → бессрочная выдача (для своих и тестовых аккаунтов).
-- p_amount_kzt = null → строку в subscriptions не пишем (это не продажа).

drop function if exists public.admin_set_plan(uuid, text, timestamptz);

create or replace function public.admin_grant_plan(
  p_user_id    uuid,
  p_plan       text,
  p_months     integer default null,
  p_amount_kzt integer default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current timestamptz;
  v_base    timestamptz;
  v_expires timestamptz;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception 'Forbidden';
  end if;

  if p_plan not in ('free', 'pro', 'enterprise') then
    raise exception 'Unknown plan %', p_plan;
  end if;

  select plan_expires_at into v_current from profiles where id = p_user_id;

  -- Продлеваем от текущей даты окончания, если она ещё не прошла: тот же
  -- принцип, что в webhook FreedomPay, иначе выдача съедает остаток
  -- оплаченного периода.
  if p_plan = 'free' or p_months is null then
    v_expires := null;
  else
    v_base    := greatest(coalesce(v_current, now()), now());
    v_expires := v_base + (p_months || ' months')::interval;
  end if;

  update profiles
  set plan            = p_plan,
      plan_expires_at = v_expires,
      updated_at      = now()
  where id = p_user_id;

  if p_plan <> 'free' and p_amount_kzt is not null then
    insert into subscriptions (user_id, plan, expires_at, amount_kzt, source)
    values (p_user_id, p_plan, v_expires, p_amount_kzt, 'manual');
  end if;

  return v_expires;
end;
$$;

grant execute on function public.admin_grant_plan(uuid, text, integer, integer) to authenticated;
