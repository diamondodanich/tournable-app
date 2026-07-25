-- =============================================
-- TOURNABLE — payment_orders: доверенная активация платных планов
-- =============================================
-- До этой миграции план выдавал клиентский server action сразу после того, как
-- FreedomPay SDK вернул success. Эндпоинт server action доступен из браузера и
-- факт оплаты не проверял — любой залогиненный пользователь мог выдать себе Pro.
--
-- Теперь заказ создаётся ДО оплаты в статусе 'pending', а перевести его в 'paid'
-- и выдать план может только webhook провайдера: он ходит с service_role в обход
-- RLS и проверяет MD5-подпись FreedomPay. Пользователю оставлен только SELECT —
-- чтобы страница успеха опрашивала статус своего заказа.

create table if not exists public.payment_orders (
  order_id    text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  plan        text        not null check (plan in ('pro', 'enterprise')),
  period      text        not null check (period in ('monthly', 'annual')),
  amount_kzt  integer     not null,
  provider    text        not null default 'freedompay'
                          check (provider in ('freedompay', 'cloudpayments')),
  status      text        not null default 'pending'
                          check (status in ('pending', 'paid', 'failed')),
  -- Язык интерфейса на момент оплаты — webhook шлёт письмо об активации и
  -- cookie прочитать уже не может.
  lang        text        not null default 'ru' check (lang in ('ru', 'kz', 'en')),
  payment_id  text,
  fail_reason text,
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);

create index if not exists payment_orders_user_id_idx
  on public.payment_orders (user_id, created_at desc);

-- =============================================
-- RLS
-- =============================================
alter table public.payment_orders enable row level security;

-- Читать — только свои заказы (поллинг статуса на /checkout/success).
drop policy if exists payment_orders_owner_select on public.payment_orders;
create policy payment_orders_owner_select on public.payment_orders
  for select using (auth.uid() = user_id);

-- Создавать — только свой заказ и только в статусе 'pending'.
drop policy if exists payment_orders_owner_insert on public.payment_orders;
create policy payment_orders_owner_insert on public.payment_orders
  for insert with check (auth.uid() = user_id and status = 'pending');

-- UPDATE/DELETE политик нет намеренно: под RLS они запрещены всем, кроме
-- service_role. Именно это делает статус 'paid' неподделываемым из браузера.
-- Миграция 018 раздаёт будущим таблицам права по умолчанию, поэтому отзываем явно.
revoke update, delete on table public.payment_orders from authenticated;
revoke all    on table public.payment_orders from anon;
