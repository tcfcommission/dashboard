-- TCF Command Centre v2 — production foundation
-- Additive migration: existing TCF website/store tables are left untouched.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'TCF',
  timezone text not null default 'Europe/London',
  base_currency text not null default 'GBP' check (char_length(base_currency) = 3),
  access_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.socials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('tiktok','instagram','youtube','x','snapchat','linkedin','facebook','other')),
  handle text not null default '',
  profile_url text,
  followers bigint not null default 0 check (followers >= 0),
  views bigint not null default 0 check (views >= 0),
  engagement_rate numeric(8,3) not null default 0,
  growth numeric(10,3) not null default 0,
  source text not null default 'manual' check (source in ('manual','api')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, platform, handle)
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '◆',
  source text not null default 'manual' check (source in ('manual','stripe','bank','custom')),
  currency text not null default 'GBP' check (char_length(currency) = 3),
  external_account_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  current_value numeric not null default 0,
  target_value numeric not null check (target_value > 0),
  unit text not null default 'number',
  due_date date,
  status text not null default 'active' check (status in ('active','completed','paused')),
  auto_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  details text,
  status text not null default 'todo' check (status in ('todo','doing','done')),
  priority text not null default 'normal' check (priority in ('high','normal','low')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  label text not null,
  status text not null default 'disconnected' check (status in ('disconnected','connected','attention','syncing')),
  account_reference text,
  config jsonb not null default '{}'::jsonb,
  sync_frequency_minutes integer not null default 1440 check (sync_frequency_minutes >= 15),
  is_enabled boolean not null default false,
  last_synced_at timestamptz,
  next_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider, label)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  provider text not null,
  external_id text,
  description text not null default '',
  transaction_type text not null default 'income' check (transaction_type in ('income','expense','refund','transfer')),
  gross_amount numeric(14,2) not null default 0,
  fee_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  currency text not null default 'GBP' check (char_length(currency) = 3),
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, provider, external_id)
);

create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_kind text not null,
  source_id text not null default 'all',
  metric_date date not null,
  revenue numeric(14,2) not null default 0,
  sales bigint not null default 0,
  followers bigint not null default 0,
  views bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, source_kind, source_id, metric_date)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid references public.integrations(id) on delete set null,
  provider text not null,
  status text not null default 'running' check (status in ('running','success','failed','skipped')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary jsonb,
  error_message text
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  action_type text not null,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default false,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_due_idx on public.tasks(user_id, due_date, status);
create index if not exists businesses_user_idx on public.businesses(user_id);
create index if not exists goals_user_idx on public.goals(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, occurred_at desc);
create index if not exists transactions_business_id_idx on public.transactions(business_id);
create index if not exists metrics_user_date_idx on public.daily_metrics(user_id, metric_date desc);
create index if not exists integrations_due_idx on public.integrations(is_enabled, next_sync_at);
create index if not exists sync_runs_user_started_idx on public.sync_runs(user_id, started_at desc);
create index if not exists sync_runs_integration_id_idx on public.sync_runs(integration_id);
create index if not exists automation_rules_user_idx on public.automation_rules(user_id);

create or replace function public.set_tcf_command_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_tcf_command_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'TCF'))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.set_tcf_command_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_tcf_command_user() from public, anon, authenticated;

drop trigger if exists on_tcf_command_user_created on auth.users;
create trigger on_tcf_command_user_created after insert on auth.users
for each row execute procedure public.handle_tcf_command_user();

insert into public.profiles(id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', 'TCF') from auth.users
on conflict (id) do nothing;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','socials','businesses','goals','tasks','integrations','daily_metrics','automation_rules']
  loop
    execute format('drop trigger if exists set_%s_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%s_updated_at before update on public.%I for each row execute procedure public.set_tcf_command_updated_at()', table_name, table_name);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.socials enable row level security;
alter table public.businesses enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;
alter table public.integrations enable row level security;
alter table public.transactions enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.sync_runs enable row level security;
alter table public.automation_rules enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
drop policy if exists "socials_owner_all" on public.socials;
drop policy if exists "businesses_owner_all" on public.businesses;
drop policy if exists "goals_owner_all" on public.goals;
drop policy if exists "tasks_owner_all" on public.tasks;
drop policy if exists "integrations_owner_all" on public.integrations;
drop policy if exists "transactions_owner_all" on public.transactions;
drop policy if exists "metrics_owner_all" on public.daily_metrics;
drop policy if exists "sync_runs_owner_read" on public.sync_runs;
drop policy if exists "automation_owner_all" on public.automation_rules;
drop policy if exists "profiles_owner_select" on public.profiles;
drop policy if exists "profiles_owner_update" on public.profiles;

create policy "profiles_owner_select" on public.profiles for select to authenticated
using (id = (select auth.uid()) and access_enabled);
create policy "profiles_owner_update" on public.profiles for update to authenticated
using (id = (select auth.uid()) and access_enabled)
with check (id = (select auth.uid()) and access_enabled);

create policy "socials_owner_all" on public.socials for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));
create policy "businesses_owner_all" on public.businesses for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));
create policy "goals_owner_all" on public.goals for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));
create policy "tasks_owner_all" on public.tasks for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));
create policy "integrations_owner_all" on public.integrations for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));
create policy "transactions_owner_all" on public.transactions for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));
create policy "metrics_owner_all" on public.daily_metrics for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));
create policy "sync_runs_owner_read" on public.sync_runs for select to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));
create policy "automation_owner_all" on public.automation_rules for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and access_enabled));

revoke all on public.profiles, public.socials, public.businesses, public.goals, public.tasks, public.integrations, public.transactions, public.daily_metrics, public.sync_runs, public.automation_rules from anon;
grant select on public.profiles to authenticated;
grant update(display_name, timezone, base_currency) on public.profiles to authenticated;
grant select, insert, update, delete on public.socials, public.businesses, public.goals, public.tasks, public.integrations, public.transactions, public.daily_metrics, public.automation_rules to authenticated;
grant select on public.sync_runs to authenticated;
grant all on public.profiles, public.socials, public.businesses, public.goals, public.tasks, public.integrations, public.transactions, public.daily_metrics, public.sync_runs, public.automation_rules to service_role;
