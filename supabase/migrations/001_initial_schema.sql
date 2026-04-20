create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  initial_cash numeric not null default 10000000,
  status text not null default 'ACTIVE',
  end_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists league_participants (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  nickname text not null,
  cash_balance numeric not null default 10000000,
  created_at timestamptz not null default now(),
  unique (league_id, nickname)
);

create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references league_participants(id) on delete cascade,
  symbol text not null,
  stock_name text not null,
  market text not null,
  quantity numeric not null,
  buy_price numeric not null,
  created_at timestamptz not null default now(),
  unique (participant_id, symbol)
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references league_participants(id) on delete cascade,
  type text not null,
  symbol text not null,
  stock_name text not null,
  price numeric not null,
  quantity numeric not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

alter table leagues enable row level security;
alter table league_participants enable row level security;
alter table holdings enable row level security;
alter table transactions enable row level security;

-- MVP policy: public read/write for link-based no-login play.
-- For a real service, replace these with proper auth or invite-token policies.
drop policy if exists "public read leagues" on leagues;
drop policy if exists "public insert leagues" on leagues;
drop policy if exists "public update leagues" on leagues;
drop policy if exists "public read participants" on league_participants;
drop policy if exists "public insert participants" on league_participants;
drop policy if exists "public update participants" on league_participants;
drop policy if exists "public read holdings" on holdings;
drop policy if exists "public insert holdings" on holdings;
drop policy if exists "public update holdings" on holdings;
drop policy if exists "public delete holdings" on holdings;
drop policy if exists "public read transactions" on transactions;
drop policy if exists "public insert transactions" on transactions;

create policy "public read leagues" on leagues for select using (true);
create policy "public insert leagues" on leagues for insert with check (true);
create policy "public update leagues" on leagues for update using (true);

create policy "public read participants" on league_participants for select using (true);
create policy "public insert participants" on league_participants for insert with check (true);
create policy "public update participants" on league_participants for update using (true);

create policy "public read holdings" on holdings for select using (true);
create policy "public insert holdings" on holdings for insert with check (true);
create policy "public update holdings" on holdings for update using (true);
create policy "public delete holdings" on holdings for delete using (true);

create policy "public read transactions" on transactions for select using (true);
create policy "public insert transactions" on transactions for insert with check (true);
