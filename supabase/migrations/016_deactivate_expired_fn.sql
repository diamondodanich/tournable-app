-- Called by Vercel Cron daily to downgrade expired Pro accounts
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
    plan = 'pro'
    and plan_expires_at is not null
    and plan_expires_at < now();

  get diagnostics v_count = row_count;
  return json_build_object('deactivated', v_count);
end;
$$;

-- Allow cron to call without auth (reads no user data, only updates expired rows)
grant execute on function public.deactivate_expired_subscriptions() to anon, authenticated;
