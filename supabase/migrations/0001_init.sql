create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(255) unique not null,
  full_name varchar(120),
  kyc_status varchar(30) default 'unverified',
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type varchar(20) not null,
  category varchar(60) not null,
  amount numeric(18, 2) not null,
  currency varchar(10) default 'IDR',
  occurred_on date not null,
  note text,
  source varchar(20) default 'manual',
  created_at timestamptz default now()
);

create index if not exists idx_transactions_user_date on public.transactions(user_id, occurred_on desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period varchar(20) not null,
  category varchar(60) not null,
  limit_amount numeric(18, 2) not null,
  currency varchar(10) default 'IDR',
  created_at timestamptz default now()
);

create index if not exists idx_budgets_user_period on public.budgets(user_id, period);

create table if not exists public.investment_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_symbol varchar(30) not null,
  side varchar(10) not null,
  quantity numeric(18, 8) not null,
  price numeric(18, 2) not null,
  fee numeric(18, 2) default 0,
  traded_on date not null,
  created_at timestamptz default now()
);

create index if not exists idx_investments_user_date on public.investment_trades(user_id, traded_on desc);

create table if not exists public.qris_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(18, 2) not null,
  currency varchar(10) default 'IDR',
  merchant_name varchar(120),
  status varchar(20) default 'pending',
  gateway_ref varchar(120),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_qris_user_created on public.qris_payments(user_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  action varchar(80) not null,
  risk_level varchar(10) default 'low',
  ip varchar(64),
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_user_created on public.audit_logs(user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_qris_payments_touch on public.qris_payments;
create trigger trg_qris_payments_touch
before update on public.qris_payments
for each row
execute function public.touch_updated_at();

alter table public.user_profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.investment_trades enable row level security;
alter table public.qris_payments enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
on public.transactions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
on public.transactions
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own"
on public.budgets
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own"
on public.budgets
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own"
on public.budgets
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own"
on public.budgets
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "investment_trades_select_own" on public.investment_trades;
create policy "investment_trades_select_own"
on public.investment_trades
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "investment_trades_insert_own" on public.investment_trades;
create policy "investment_trades_insert_own"
on public.investment_trades
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "investment_trades_update_own" on public.investment_trades;
create policy "investment_trades_update_own"
on public.investment_trades
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "investment_trades_delete_own" on public.investment_trades;
create policy "investment_trades_delete_own"
on public.investment_trades
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "qris_payments_select_own" on public.qris_payments;
create policy "qris_payments_select_own"
on public.qris_payments
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "qris_payments_insert_own" on public.qris_payments;
create policy "qris_payments_insert_own"
on public.qris_payments
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "qris_payments_update_own" on public.qris_payments;
create policy "qris_payments_update_own"
on public.qris_payments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "audit_logs_insert_own" on public.audit_logs;
create policy "audit_logs_insert_own"
on public.audit_logs
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "audit_logs_select_own" on public.audit_logs;
create policy "audit_logs_select_own"
on public.audit_logs
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_compliance_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'role') = 'compliance_admin', false);
$$;

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
on public.audit_logs
for select
to authenticated
using (public.is_compliance_admin());

