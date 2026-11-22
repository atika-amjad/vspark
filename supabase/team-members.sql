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
