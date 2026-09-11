-- Examon Academic Planner cloud persistence schema
-- Run this inside Supabase SQL Editor.

create table if not exists public.planner_store (
  store_key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.planner_store enable row level security;

-- Simple shared-workspace policy for the anon public key.
-- This app is an internal tool; anyone with the site URL and anon key can read/write this single workspace.
-- For stricter production access, add Supabase Auth and user/team based policies.

drop policy if exists "planner_store_select" on public.planner_store;
drop policy if exists "planner_store_insert" on public.planner_store;
drop policy if exists "planner_store_update" on public.planner_store;

create policy "planner_store_select"
  on public.planner_store for select
  to anon
  using (true);

create policy "planner_store_insert"
  on public.planner_store for insert
  to anon
  with check (true);

create policy "planner_store_update"
  on public.planner_store for update
  to anon
  using (true)
  with check (true);
