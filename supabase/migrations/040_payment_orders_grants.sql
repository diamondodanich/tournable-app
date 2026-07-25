-- =============================================
-- TOURNABLE — права на payment_orders
-- =============================================
-- Миграция 039 создала таблицу, но не выдала табличные привилегии ролям
-- Supabase. Миграция 018 раздаёт дефолтные привилегии только authenticated и
-- anon, а webhook ходит под service_role — он в тот список не попал.
-- Итог на проде: 42501 "permission denied for table payment_orders", колбэк
-- FreedomPay падал на поиске заказа.
--
-- Важно: service_role обходит RLS, но табличные GRANT ему всё равно нужны.

grant select, insert, update, delete on table public.payment_orders to service_role;

-- Пользователю нужно ровно два права: создать свой заказ и читать его статус.
-- UPDATE/DELETE не выдаём — статус 'paid' должен оставаться неподделываемым.
grant select, insert on table public.payment_orders to authenticated;
revoke update, delete on table public.payment_orders from authenticated;

-- Заказы приватные, анониму доступа нет.
revoke all on table public.payment_orders from anon;
