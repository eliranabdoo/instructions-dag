-- Run this in Supabase Dashboard → SQL Editor

create table if not exists dags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null default 'Untitled DAG',
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table dags enable row level security;

-- Users can only read their own DAGs
create policy "select own dags" on dags
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Users can insert their own DAGs
create policy "insert own dags" on dags
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Users can update their own DAGs
create policy "update own dags" on dags
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Users can delete their own DAGs
create policy "delete own dags" on dags
  for delete to authenticated
  using ((select auth.uid()) = user_id);
