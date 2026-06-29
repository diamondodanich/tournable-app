-- =============================================
-- Allow 'enterprise' plan everywhere + fix subscriptions source check
-- Root cause of: new row for relation "profiles" violates check constraint "profiles_plan_check"
-- =============================================

-- profiles.plan — add 'enterprise'
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'pro', 'enterprise'));

-- subscriptions.plan — add 'enterprise'
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('free', 'pro', 'enterprise'));

-- subscriptions.source — add 'freedompay' (code already writes it)
alter table public.subscriptions drop constraint if exists subscriptions_source_check;
alter table public.subscriptions
  add constraint subscriptions_source_check check (source in ('manual', 'kaspi', 'cloudpayments', 'freedompay'));
