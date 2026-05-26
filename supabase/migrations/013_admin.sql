-- 013_admin.sql
-- Adds admin flag to profiles

alter table profiles
  add column if not exists is_admin boolean not null default false;

-- Mark askardancho2003@gmail.com as admin
update public.profiles
set is_admin = true
where id = (
  select id from auth.users where email = 'askardancho2003@gmail.com'
);
