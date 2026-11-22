-- Keeps profiles.approved in sync with registrations, and enables live updates.
-- Run once in the Supabase SQL editor. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Approval is now computed by the database
--    (previously only the admin's browser updated it, so a change made from SQL
--     or the Supabase dashboard left the participant showing "pending").
-- ---------------------------------------------------------------------------

create or replace function public.sync_profile_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new."userId", old."userId");
  if target is null then
    return null;
  end if;

  update profiles p
     set approved = exists (
           select 1 from registrations r
            where r."userId" = target
              and r.status = 'approved'
         )
   where p.id = target;

  return null;
end;
$$;

drop trigger if exists registrations_sync_approval_ins on registrations;
create trigger registrations_sync_approval_ins
after insert or delete on registrations
for each row execute function public.sync_profile_approval();

drop trigger if exists registrations_sync_approval_upd on registrations;
create trigger registrations_sync_approval_upd
after update of status on registrations
for each row execute function public.sync_profile_approval();

-- Bring existing rows in line with the rule above.
update profiles p
   set approved = exists (
         select 1 from registrations r
          where r."userId" = p.id
            and r.status = 'approved'
       );

-- ---------------------------------------------------------------------------
-- 2. Realtime: let the browser subscribe to changes on these tables.
-- ---------------------------------------------------------------------------

do $$
begin
  begin
    alter publication supabase_realtime add table registrations;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table profiles;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Confirm.
-- ---------------------------------------------------------------------------

select tgname as trigger_name
from pg_trigger
where tgrelid = 'public.registrations'::regclass
  and not tgisinternal;
