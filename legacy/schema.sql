-- ============================================================
-- SHADOW OS — BACKEND DATABASE SCHEMA (Supabase / PostgreSQL)
-- ============================================================
-- Run this ONCE in Supabase → SQL Editor → New Query → paste → Run.
-- It creates every table your dashboard needs.
-- ============================================================

-- ---------- SOCIAL ACCOUNTS ----------
-- One row per platform account. The sync functions UPDATE followers/views.
create table if not exists socials (
  id           text primary key,          -- e.g. 'tiktok_shadowglobal'
  platform     text not null,             -- 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'snapchat'
  handle       text,                       -- '@shadowglobal'
  external_id  text,                       -- platform user/channel id (for API calls)
  followers    bigint default 0,
  views        bigint default 0,
  growth       numeric default 0,          -- % vs last sync
  source       text default 'manual',      -- 'manual' | 'api'
  last_synced  timestamptz,
  updated_at   timestamptz default now()
);

-- ---------- BUSINESSES / INCOME ----------
-- Stripe sync UPDATES revenue/sales for rows where source = 'stripe'.
create table if not exists businesses (
  id           text primary key,          -- e.g. 'shadow_global'
  name         text not null,
  emoji        text default '💼',
  revenue      numeric default 0,          -- in whole £ (Stripe amounts are converted)
  sales        bigint default 0,
  source       text default 'manual',      -- 'manual' | 'stripe'
  stripe_key_ref text,                      -- which secret to use (name only, NOT the key itself)
  last_synced  timestamptz,
  updated_at   timestamptz default now()
);

-- ---------- GOALS ----------
create table if not exists goals (
  id           text primary key,
  name         text not null,
  current      numeric default 0,
  target       numeric default 0,
  auto_source  text,                        -- optional: 'followers_total' | 'revenue_total' to auto-fill 'current'
  updated_at   timestamptz default now()
);

-- ---------- TASKS (daily) ----------
create table if not exists tasks (
  id           text primary key,
  title        text not null,
  done         boolean default false,
  due_date     date default current_date,
  priority     text default 'normal',       -- 'high' | 'normal' | 'low'
  created_at   timestamptz default now()
);

-- ---------- REVENUE HISTORY (for the chart) ----------
-- One row per day; refresh writes the day's total revenue.
create table if not exists revenue_history (
  day          date primary key,
  revenue      numeric default 0
);

-- ---------- SETTINGS (single row) ----------
create table if not exists settings (
  id           int primary key default 1,
  owner_name   text default 'Shadow',
  updated_at   timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into settings (id, owner_name) values (1, 'Shadow') on conflict (id) do nothing;

-- ============================================================
-- SEED (your starting rows — edit freely)
-- ============================================================
insert into socials (id, platform, handle, source) values
  ('tiktok_shadowglobal',   'tiktok',    '@shadowglobal', 'manual'),
  ('instagram_mrglobalai',  'instagram', '@mrglobalai',   'manual'),
  ('youtube_shadowglobal',  'youtube',   '@shadowglobal', 'manual')
on conflict (id) do nothing;

insert into businesses (id, name, emoji, source) values
  ('shadow_global', 'Shadow Global', '🖤', 'stripe'),
  ('capo_empire',   'Capo Empire',   '👕', 'manual')
on conflict (id) do nothing;

insert into goals (id, name, current, target) values
  ('goal_1k',   'First £1,000 month', 0, 1000),
  ('goal_10k',  '10,000 followers',   0, 10000)
on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- This is a personal, single-user dashboard. The serverless functions
-- use the SERVICE ROLE key (full access, server-side only).
-- The dashboard reads via a read-only endpoint you control.
-- We keep RLS ON and grant access only through the service role.

alter table socials          enable row level security;
alter table businesses       enable row level security;
alter table goals            enable row level security;
alter table tasks            enable row level security;
alter table revenue_history  enable row level security;
alter table settings         enable row level security;

-- No public policies = no anonymous access. The service role bypasses RLS,
-- so your server functions still work. This keeps your data private.

-- Done. Your tables are ready.
