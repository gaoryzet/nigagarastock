create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  profile_color text not null default '#176d6b',
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text not null,
  color text not null default '#176d6b',
  type text not null check (type in ('single', 'complex')),
  category text not null check (category in ('illustration', 'branding', 'order', 'etc')),
  start_date date not null,
  end_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  phase text not null,
  title text not null,
  client_name text not null,
  content text default '',
  start_date date not null,
  end_date date not null,
  category text not null check (category in ('illustration', 'branding', 'order', 'etc')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  assignee_user_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table app_users enable row level security;
alter table projects enable row level security;
alter table schedules enable row level security;

drop policy if exists "public read app_users" on app_users;
drop policy if exists "public insert app_users" on app_users;
drop policy if exists "public update app_users" on app_users;
drop policy if exists "public delete app_users" on app_users;

drop policy if exists "public read projects" on projects;
drop policy if exists "public insert projects" on projects;
drop policy if exists "public update projects" on projects;
drop policy if exists "public delete projects" on projects;

drop policy if exists "public read schedules" on schedules;
drop policy if exists "public insert schedules" on schedules;
drop policy if exists "public update schedules" on schedules;
drop policy if exists "public delete schedules" on schedules;

create policy "public read app_users" on app_users for select to anon using (true);
create policy "public insert app_users" on app_users for insert to anon with check (true);
create policy "public update app_users" on app_users for update to anon using (true) with check (true);
create policy "public delete app_users" on app_users for delete to anon using (true);

create policy "public read projects" on projects for select to anon using (true);
create policy "public insert projects" on projects for insert to anon with check (true);
create policy "public update projects" on projects for update to anon using (true) with check (true);
create policy "public delete projects" on projects for delete to anon using (true);

create policy "public read schedules" on schedules for select to anon using (true);
create policy "public insert schedules" on schedules for insert to anon with check (true);
create policy "public update schedules" on schedules for update to anon using (true) with check (true);
create policy "public delete schedules" on schedules for delete to anon using (true);
