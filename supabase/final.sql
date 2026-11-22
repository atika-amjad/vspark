-- VSpark: complete database setup (results link, activity log, team members, triggers, realtime).
-- Paste this whole file into the Supabase SQL editor and press Run. Idempotent - safe to re-run.
-- VSpark: results linkage, admin activity log, approval trigger and realtime.
-- Run this ONCE in the Supabase SQL editor. It is idempotent, so re-running is safe.

-- ===========================================================================
-- 1. Results: link a result to a participant by registration number
-- ===========================================================================

alter table results add column if not exists "regNo" text not null default '';
create index if not exists results_regno_idx on results ("regNo");

-- ===========================================================================
-- 2. Approval is computed by the database
-- ===========================================================================

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

update profiles p
   set approved = exists (
         select 1 from registrations r
          where r."userId" = p.id and r.status = 'approved'
       );

-- ===========================================================================
-- 3. Admin activity log
-- ===========================================================================

create table if not exists activity_log (
  id          uuid primary key default gen_random_uuid(),
  actor       uuid,
  "actorEmail" text not null default '',
  action      text not null,
  entity      text not null,
  "entityId"  text not null default '',
  label       text not null default '',
  "createdAt" timestamptz not null default now()
);

create index if not exists activity_log_created_idx on activity_log ("createdAt" desc);

alter table activity_log enable row level security;

drop policy if exists activity_log_admin_read on activity_log;
create policy activity_log_admin_read on activity_log
  for select using (public.is_admin());

drop policy if exists activity_log_admin_insert on activity_log;
create policy activity_log_admin_insert on activity_log
  for insert with check (public.is_admin());

-- Generic logger: records who changed what, for registrations and all content tables.
create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_mail text := '';
  act text;
  payload jsonb;
  eid text := '';
  lbl text := '';
begin
  if actor_id is not null then
    select p.email into actor_mail from profiles p where p.id = actor_id;
  end if;

  if tg_op = 'DELETE' then
    payload := to_jsonb(old);
  else
    payload := to_jsonb(new);
  end if;

  if tg_op = 'INSERT' then
    act := tg_table_name || '.created';
  elsif tg_op = 'UPDATE' then
    act := tg_table_name || '.updated';
  else
    act := tg_table_name || '.deleted';
  end if;

  if tg_table_name = 'registrations' then
    if tg_op = 'UPDATE' then
      act := 'registration.' || coalesce(payload ->> 'status', 'updated');
    end if;
    eid := coalesce(payload ->> 'id', '');
    lbl := coalesce(payload ->> 'fullName', payload ->> 'email', '');
  else
    eid := coalesce(payload ->> 'id', '');
    lbl := coalesce(payload ->> 'title', payload ->> 'competition', payload ->> 'name', '');
  end if;

  insert into activity_log (actor, "actorEmail", action, entity, "entityId", label)
  values (actor_id, coalesce(actor_mail, ''), act, tg_table_name, eid, left(lbl, 120));

  return null;
end;
$$;

drop trigger if exists registrations_activity on registrations;
create trigger registrations_activity
after insert or update or delete on registrations
for each row execute function public.log_activity();

drop trigger if exists competitions_activity on competitions;
create trigger competitions_activity
after insert or update or delete on competitions
for each row execute function public.log_activity();

drop trigger if exists events_activity on events;
create trigger events_activity
after insert or update or delete on events
for each row execute function public.log_activity();

drop trigger if exists blogs_activity on blogs;
create trigger blogs_activity
after insert or update or delete on blogs
for each row execute function public.log_activity();

drop trigger if exists results_activity on results;
create trigger results_activity
after insert or update or delete on results
for each row execute function public.log_activity();

-- ===========================================================================
-- 4. Realtime for the tables the dashboards watch
-- ===========================================================================

do $$
begin
  begin
    alter publication supabase_realtime add table registrations;
  exception when duplicate_object then null; when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table profiles;
  exception when duplicate_object then null; when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table activity_log;
  exception when duplicate_object then null; when undefined_object then null;
  end;
end $$;

-- ===========================================================================
-- 5. Confirm
-- ===========================================================================

select 'results.regNo' as check, count(*) as found
from information_schema.columns
where table_schema = 'public' and table_name = 'results' and column_name = 'regNo'
union all
select 'activity_log', count(*) from information_schema.tables
where table_schema = 'public' and table_name = 'activity_log'
union all
select 'triggers', count(*) from pg_trigger
where tgrelid in ('public.registrations'::regclass, 'public.competitions'::regclass,
                  'public.events'::regclass, 'public.blogs'::regclass, 'public.results'::regclass)
  and not tgisinternal;


-- VSpark: team members chosen from registered users.
-- The LIMIT is set by the admin on the competition ("maxTeamSize").
-- The participant only picks teammates from the registered-user directory.
-- Run once in the Supabase SQL editor. Idempotent.

-- ---------------------------------------------------------------------------
-- 1. Admin-controlled limit per competition (1 = individual)
-- ---------------------------------------------------------------------------

alter table competitions add column if not exists "maxTeamSize" integer not null default 1;

-- ---------------------------------------------------------------------------
-- 2. Team members (real accounts, not free text)
-- ---------------------------------------------------------------------------

create table if not exists team_members (
  id               uuid primary key default gen_random_uuid(),
  "registrationId" uuid not null references registrations (id) on delete cascade,
  "userId"         uuid not null references auth.users (id) on delete cascade,
  "fullName"       text not null default '',
  email            text not null default '',
  "createdAt"      text not null default '',
  unique ("registrationId", "userId")
);

create index if not exists team_members_reg_idx on team_members ("registrationId");
create index if not exists team_members_user_idx on team_members ("userId");

alter table team_members enable row level security;

-- True when the signed-in user owns the registration.
create or replace function public.owns_registration(reg uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from registrations r
     where r.id = reg and r."userId" = auth.uid()
  );
$$;

drop policy if exists team_members_read on team_members;
create policy team_members_read on team_members
  for select using (
    public.is_admin()
    or public.owns_registration("registrationId")
    or "userId" = auth.uid()
  );

drop policy if exists team_members_write on team_members;
create policy team_members_write on team_members
  for all using (public.is_admin() or public.owns_registration("registrationId"))
  with check (public.is_admin() or public.owns_registration("registrationId"));

-- ---------------------------------------------------------------------------
-- 3. Directory of registered users, so a participant can pick teammates.
--    Exposes only id / name / email — nothing else from profiles.
-- ---------------------------------------------------------------------------

create or replace view public.member_directory as
  select p.id, p."fullName", p.email
    from profiles p;

grant select on public.member_directory to authenticated;
revoke all on public.member_directory from anon;

-- ---------------------------------------------------------------------------
-- 4. Confirm
-- ---------------------------------------------------------------------------

select 'team_members' as check, count(*) as found
from information_schema.tables
where table_schema = 'public' and table_name = 'team_members'
union all
select 'member_directory', count(*)
from information_schema.views
where table_schema = 'public' and table_name = 'member_directory'
union all
select 'competitions.maxTeamSize', count(*)
from information_schema.columns
where table_schema = 'public' and table_name = 'competitions' and column_name = 'maxTeamSize';

