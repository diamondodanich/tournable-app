-- Allow 'freedompay' as a valid source value
alter table subscriptions
  drop constraint if exists subscriptions_source_check;

alter table subscriptions
  add constraint subscriptions_source_check
  check (source in ('manual', 'kaspi', 'cloudpayments', 'freedompay'));

-- SECURITY DEFINER function so client-session can record a payment row
-- without needing a broad INSERT RLS policy on subscriptions.
create or replace function public.record_freedompay_subscription(
  p_user_id    uuid,
  p_plan       text,
  p_expires_at timestamptz,
  p_amount_kzt integer,
  p_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only allow a user to record their own subscription
  if auth.uid() <> p_user_id then
    raise exception 'Forbidden';
  end if;

  insert into subscriptions (user_id, plan, expires_at, amount_kzt, source, external_id)
  values (p_user_id, p_plan, p_expires_at, p_amount_kzt, 'freedompay', p_payment_id);
end;
$$;

grant execute on function public.record_freedompay_subscription(uuid, text, timestamptz, integer, text)
  to authenticated;
