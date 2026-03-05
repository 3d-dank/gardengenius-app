-- LawnGenius Supabase Schema
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/jdwmimhnrfsvgafxdcph/editor

-- profiles table
create table profiles (
  id uuid references auth.users primary key,
  created_at timestamptz default now(),
  device_id text,
  grass_type text,
  zip_code text,
  scan_count int default 0
);

-- scans table
create table scans (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references profiles(id),
  device_id text not null,
  image_url text,
  problem text,
  severity text,
  confidence int,
  description text,
  treatment text,
  timing text,
  latitude float,
  longitude float,
  zip_code text,
  grass_type text,
  soil_temp float,
  uv_index float,
  raw_response jsonb
);

-- Enable Row Level Security (recommended)
alter table scans enable row level security;
alter table profiles enable row level security;

-- Allow anonymous inserts to scans (device-ID based, no auth required)
create policy "Allow anonymous scan inserts"
  on scans for insert
  with check (true);

-- Allow reads only for matching device_id (optional - tighten later)
create policy "Allow scan reads by device"
  on scans for select
  using (true);

-- ---------------------------------------------------------------------------
-- affiliate_clicks table — tracks Amazon affiliate link taps
-- ---------------------------------------------------------------------------
create table affiliate_clicks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  device_id text,
  product_asin text,
  product_name text,
  diagnosis text,
  app_version text
);

-- Enable RLS on affiliate_clicks
alter table affiliate_clicks enable row level security;

-- Allow anonymous inserts (device-ID based, no auth required)
create policy "Allow anonymous affiliate click inserts"
  on affiliate_clicks for insert
  with check (true);
