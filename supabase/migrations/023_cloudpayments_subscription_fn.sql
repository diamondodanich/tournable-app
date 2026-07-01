-- SECURITY DEFINER function so client-session can record a TipTop Pay
-- (CloudPayments-compatible) payment row without a broad INSERT RLS policy.
-- 'cloudpayments' is already an allowed source value (see 011_subscriptions.sql).
create or replace function public.record_cloudpayments_subscription(
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
  values (p_user_id, p_plan, p_expires_at, p_amount_kzt, 'cloudpayments', p_payment_id);
end;
$$;

grant execute on function public.record_cloudpayments_subscription(uuid, text, timestamptz, integer, text)
  to authenticated;
