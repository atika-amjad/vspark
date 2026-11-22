-- Remove the leftover signup trigger from the previous schema attempt.
-- That trigger inserts into public.profiles using old column names (full_name),
-- so every new signup fails with "Database error saving new user".
--
-- Profiles are created by the app itself (src/components/RegistrationForm.tsx),
-- so this trigger is no longer needed.

-- 1. Show what is currently attached (for reference).
select t.tgname           as trigger_name,
       p.proname          as function_name,
       pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c      on c.oid = t.tgrelid
join pg_namespace n  on n.oid = c.relnamespace
left join pg_proc p  on p.oid = t.tgfoid
where c.relname = 'users'
  and n.nspname = 'auth'
  and not t.tgisinternal;

-- 2. Drop every non-internal trigger on auth.users.
do $$
declare
  r record;
begin
  for r in
    select t.tgname
    from pg_trigger t
    join pg_class c     on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'users'
      and n.nspname = 'auth'
      and not t.tgisinternal
  loop
    execute format('drop trigger %I on auth.users', r.tgname);
    raise notice 'dropped trigger: %', r.tgname;
  end loop;
end $$;

-- 3. Confirm nothing is left.
select count(*) as remaining_signup_triggers
from pg_trigger t
join pg_class c     on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where c.relname = 'users'
  and n.nspname = 'auth'
  and not t.tgisinternal;
