-- Examon Academic Planner cloud persistence schema
-- Run this inside Supabase SQL Editor.
-- This enables one shared workspace row for all browsers/devices.

create table if not exists public.planner_store (
  store_key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.planner_store enable row level security;

-- Make sure the browser anon key can use the table.
grant usage on schema public to anon;
grant select, insert, update, delete on public.planner_store to anon;

-- Simple shared-workspace policy for the anon public key.
-- This app is an internal tool; anyone with the site URL and anon key can read/write this single workspace.
-- For stricter production access, add Supabase Auth and user/team based policies.

drop policy if exists "planner_store_select" on public.planner_store;
drop policy if exists "planner_store_insert" on public.planner_store;
drop policy if exists "planner_store_update" on public.planner_store;
drop policy if exists "planner_store_delete" on public.planner_store;
drop policy if exists "planner_store_all" on public.planner_store;

create policy "planner_store_all"
  on public.planner_store
  for all
  to anon
  using (true)
  with check (true);

insert into public.planner_store (store_key, data, updated_at)
values ('examon-main-workspace', '{}'::jsonb, now())
on conflict (store_key) do nothing;
