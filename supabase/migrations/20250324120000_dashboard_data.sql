-- 工作管理儀表板：每位使用者一筆 JSON 資料
-- 使用方式：Supabase Dashboard → SQL Editor → 貼上執行
-- 並至 Authentication → Providers → 啟用「Anonymous」登入

create table if not exists public.dashboard_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.dashboard_data is 'App state per authenticated user (anonymous or signed-in)';

alter table public.dashboard_data enable row level security;

drop policy if exists "dashboard_data_select_own" on public.dashboard_data;
drop policy if exists "dashboard_data_insert_own" on public.dashboard_data;
drop policy if exists "dashboard_data_update_own" on public.dashboard_data;

create policy "dashboard_data_select_own"
  on public.dashboard_data
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "dashboard_data_insert_own"
  on public.dashboard_data
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "dashboard_data_update_own"
  on public.dashboard_data
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
