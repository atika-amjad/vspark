-- VSpark migration + schema (idempotent - safe to re-run).
-- Step 1 preserves the previous attempt's tables (no-ops if already renamed).
-- Step 2 creates this app's schema and policies.

alter table if exists competitions              rename to competitions_legacy;
alter table if exists profiles                  rename to profiles_legacy;
alter table if exists competition_registrations rename to competition_registrations_legacy;
-- VSpark — Supabase schema
-- Replaces Firestore. Column names are quoted CamelCase so they match the
-- existing TypeScript interfaces in src/lib/types.ts exactly.
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- gen_random_uuid() is built into Postgres 13+, so no extension is required.
-- Every statement is idempotent, so it is safe to re-run.

-- ---------------------------------------------------------------------------
-- Content tables (public read, admin write)
-- ---------------------------------------------------------------------------

create table if not exists competitions (
  id          text primary key,
  title       text not null,
  category    text not null default '',
  description text not null default '',
  fee         numeric not null default 0,
  prize       text not null default '',
  "teamSize"  text not null default '',
  venue       text not null default ''
);

create table if not exists events (
  id          text primary key,
  title       text not null,
  description text not null default '',
  date        text not null default '',
  time        text not null default '',
  venue       text not null default ''
);

create table if not exists blogs (
  id       text primary key,
  title    text not null,
  category text not null default 'Blog Post',
  excerpt  text not null default '',
  content  text not null default '',
  author   text not null default '',
  date     text not null default ''
);

create table if not exists results (
  id          text primary key,
  year        text not null default '',
  competition text not null default '',
  position    text not null default '',
  winner      text not null default '',
  university  text not null default ''
);

-- ---------------------------------------------------------------------------
-- User tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  "fullName"  text not null default '',
  role        text not null default 'participant',
  approved    boolean not null default false,
  "createdAt" text not null default ''
);

-- Presence of a row here = admin
create table if not exists admins (
  "userId"    uuid primary key references auth.users (id) on delete cascade,
  "createdAt" text not null default ''
);

create table if not exists registrations (
  id                  uuid primary key default gen_random_uuid(),
  "userId"            uuid not null references auth.users (id) on delete cascade,
  "fullName"          text not null,
  phone               text not null,
  email               text not null,
  university          text not null,
  department          text not null,
  "regNo"             text not null,
  "competitionIds"    text[] not null default '{}',
  "competitionTitles" text[] not null default '{}',
  "totalAmount"       numeric not null default 0,
  "transactionId"     text not null default '',
  "proofPath"         text not null default '',
  "proofName"         text not null default '',
  status              text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  "adminNote"         text not null default '',
  "createdAt"         text not null default '',
  "updatedAt"         text not null default ''
);

create index if not exists registrations_user_idx on registrations ("userId");
create index if not exists registrations_status_idx on registrations (status);

-- ---------------------------------------------------------------------------
-- Admin helper. SECURITY DEFINER so policies can read `admins` without
-- triggering infinite recursion.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from admins a where a."userId" = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table competitions  enable row level security;
alter table events        enable row level security;
alter table blogs         enable row level security;
alter table results       enable row level security;
alter table profiles      enable row level security;
alter table admins        enable row level security;
alter table registrations enable row level security;

-- Public content: anyone may read, only admins may write.
drop policy if exists competitions_read on competitions;
create policy competitions_read on competitions for select using (true);
drop policy if exists competitions_write on competitions;
create policy competitions_write on competitions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists events_read on events;
create policy events_read on events for select using (true);
drop policy if exists events_write on events;
create policy events_write on events for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists blogs_read on blogs;
create policy blogs_read on blogs for select using (true);
drop policy if exists blogs_write on blogs;
create policy blogs_write on blogs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists results_read on results;
create policy results_read on results for select using (true);
drop policy if exists results_write on results;
create policy results_write on results for all using (public.is_admin()) with check (public.is_admin());

-- admins: a user may read only their own row; rows are inserted with the
-- secret key (scripts/make-admin.mjs), never from the browser.
drop policy if exists admins_read_own on admins;
create policy admins_read_own on admins for select using ("userId" = auth.uid());

-- profiles
drop policy if exists profiles_read_own_or_admin on profiles;
create policy profiles_read_own_or_admin on profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles
  for insert with check (id = auth.uid() and role = 'participant' and approved = false);

drop policy if exists profiles_update_admin on profiles;
create policy profiles_update_admin on profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- registrations
drop policy if exists registrations_read_own_or_admin on registrations;
create policy registrations_read_own_or_admin on registrations
  for select using ("userId" = auth.uid() or public.is_admin());

-- The first registration happens during sign-up (no profile row yet);
-- later ones require an approved profile.
drop policy if exists registrations_insert_own on registrations;
create policy registrations_insert_own on registrations
  for insert with check (
    "userId" = auth.uid()
    and status = 'pending'
    and "adminNote" = ''
    and (
      not exists (select 1 from profiles p where p.id = auth.uid())
      or exists (select 1 from profiles p where p.id = auth.uid() and p.approved = true)
    )
    and ("proofPath" = '' or "proofPath" like auth.uid()::text || '/%')
  );

drop policy if exists registrations_update_own_pending on registrations;
create policy registrations_update_own_pending on registrations
  for update using (
    public.is_admin() or ("userId" = auth.uid() and status = 'pending')
  ) with check (
    public.is_admin()
    or (
      "userId" = auth.uid()
      and status = 'pending'
      and "adminNote" = ''
      and ("proofPath" = '' or "proofPath" like auth.uid()::text || '/%')
    )
  );

drop policy if exists registrations_delete_own on registrations;
create policy registrations_delete_own on registrations
  for delete using (
    public.is_admin() or ("userId" = auth.uid() and status in ('pending', 'rejected'))
  );

-- ---------------------------------------------------------------------------
-- Storage: private bucket for payment proofs. All access goes through the
-- server using the secret key, which bypasses RLS.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

