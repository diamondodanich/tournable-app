-- =============================================
-- TOURNABLE — права service_role на таблицы, куда ходит серверный код
-- =============================================
-- Давняя дыра, всплывшая при первом реальном тесте webhook FreedomPay:
-- миграция 018 раздала табличные привилегии только authenticated и anon.
-- Роль service_role туда не попала, поэтому весь код на SUPABASE_SERVICE_ROLE_KEY
-- падал с 42501 "permission denied for table profiles" — включая активацию
-- платного плана. Раньше это не замечали: приём карт был выключен, а cron'ы
-- ходят через SECURITY DEFINER функции и прав таблиц не требуют.
--
-- service_role обходит RLS, но табличные GRANT ему всё равно необходимы.

grant select, insert, update, delete on table public.profiles           to service_role;
grant select, insert, update, delete on table public.subscriptions      to service_role;
grant select, insert, update, delete on table public.payment_orders     to service_role;
grant select, insert, update, delete on table public.tournaments        to service_role;
grant select, insert, update, delete on table public.tournament_members to service_role;

-- Функции, которые дёргают cron-роуты под service_role.
grant execute on function public.deactivate_expired_subscriptions() to service_role;
grant execute on function public.product_metrics()                  to service_role;

-- Чтобы следующая новая таблица не повторила эту историю.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
