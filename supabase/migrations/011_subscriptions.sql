-- =============================================
-- TOURNABLE — Subscriptions history table
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. subscriptions table — история платежей и активаций
-- =============================================
create table if not exists subscriptions (
  id            uuid            default gen_random_uuid() primary key,
  user_id       uuid            not null references auth.users(id) on delete cascade,
  plan          text            not null check (plan in ('free', 'pro')),
  started_at    timestamptz     not null default now(),
  expires_at    timestamptz,
  amount_kzt    integer,
  source        text            not null default 'manual'
                                check (source in ('manual', 'kaspi', 'cloudpayments')),
  external_id   text,           -- ID транзакции из платёжной системы
  created_at    timestamptz     not null default now()
);

-- =============================================
-- 2. RLS — пользователь видит только свои записи
-- =============================================
alter table subscriptions enable row level security;

drop policy if exists "subscriptions_owner_select" on subscriptions;
create policy "subscriptions_owner_select" on subscriptions
  for select using (auth.uid() = user_id);

-- =============================================
-- 3. Индекс для быстрого поиска по user_id
-- =============================================
create index if not exists subscriptions_user_id_idx on subscriptions (user_id);
create index if not exists subscriptions_created_at_idx on subscriptions (created_at desc);
