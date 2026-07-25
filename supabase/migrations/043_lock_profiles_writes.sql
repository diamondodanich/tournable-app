-- =============================================
-- TOURNABLE — запрет пользовательской записи в profiles
-- =============================================
-- Политика из миграции 010 давала владельцу строки полный доступ:
--   for all using (auth.uid() = id) with check (auth.uid() = id)
-- В profiles при этом нет ни одного поля, которое пользователь вправе менять:
-- имя, телефон, страна и город живут в auth.users.user_metadata (см.
-- updateAccountProfile в actions/auth.ts). В таблице только plan,
-- plan_expires_at, is_admin и is_internal.
--
-- То есть любой авторизованный пользователь мог из браузера — anon-ключ и его
-- JWT там есть — выполнить
--   supabase.from('profiles').update({ plan: 'pro', plan_expires_at: null,
--                                      is_admin: true }).eq('id', <свой id>)
-- и выдать себе бессрочный Pro вместе с правами администратора, вообще не
-- касаясь server actions. Ровно та дыра, которую закрыли в платежах, только
-- через другую дверь.
--
-- Чинится не в коде, а здесь: пользователю оставляем чтение своей строки,
-- запись — только webhook'ам (service_role) и SECURITY DEFINER функциям ниже.

drop policy if exists "profiles_owner" on public.profiles;

drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);

-- Политик INSERT/UPDATE/DELETE нет намеренно. Триггер handle_new_user (010)
-- создаёт строку через SECURITY DEFINER и под запрет не попадает.
revoke insert, update, delete on table public.profiles from authenticated;
grant  select                 on table public.profiles to   authenticated;

-- =============================================
-- Админская смена плана
-- =============================================
-- Раньше это делал activatePro, у которого не было вообще никакой проверки
-- прав, а activateEnterprise проверял is_admin в коде — но всё равно не мог
-- записать чужую строку из-за RLS. Теперь проверка одна и на стороне БД,
-- а SECURITY DEFINER позволяет админу менять план другому пользователю.
create or replace function public.admin_set_plan(
  p_user_id    uuid,
  p_plan       text,
  p_expires_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception 'Forbidden';
  end if;

  if p_plan not in ('free', 'pro', 'enterprise') then
    raise exception 'Unknown plan %', p_plan;
  end if;

  update profiles
  set plan            = p_plan,
      plan_expires_at = case when p_plan = 'free' then null else p_expires_at end,
      updated_at      = now()
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_plan(uuid, text, timestamptz) to authenticated;

-- =============================================
-- Отказ от собственной подписки
-- =============================================
-- Понижение самому себе безопасно и прав не требует, но записать строку
-- пользователь больше не может — поэтому через функцию.
create or replace function public.downgrade_own_plan()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Forbidden';
  end if;

  update profiles
  set plan = 'free', plan_expires_at = null, updated_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.downgrade_own_plan() to authenticated;
