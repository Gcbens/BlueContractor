-- Phase 1: core schema, roles, and RLS for BlueContractor
-- Run this against your Supabase project via the SQL editor or `supabase db push`.

-- ============================================================================
-- Roles (profiles table)
-- ============================================================================

create type user_role as enum ('user', 'admin', 'owner');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed the initial owner once that account exists in auth.users.
-- Safe to re-run: no-op if the account doesn't exist yet or is already 'owner'.
update public.profiles
set role = 'owner'
where id = (select id from auth.users where email = 'gvolmar82@gmail.com');

-- Helper used by RLS policies below. SECURITY DEFINER + fixed search_path avoids
-- recursive RLS evaluation on profiles itself.
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- Shared updated_at trigger
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- customers
-- ============================================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  city text,
  state text,
  zip text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_user_id_idx on public.customers(user_id);

create trigger set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ============================================================================
-- estimates
-- ============================================================================

create type estimate_status as enum ('draft', 'completed', 'sent', 'accepted', 'declined');
create type property_type_enum as enum ('residential', 'commercial', 'industrial', 'other');
create type difficulty_enum as enum ('easy', 'moderate', 'hard', 'extreme');

create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  status estimate_status not null default 'draft',
  job_type text not null,
  job_description text,
  property_type property_type_enum not null default 'residential',
  difficulty difficulty_enum not null default 'moderate',
  square_footage numeric not null default 0,
  linear_feet numeric not null default 0,
  num_floors numeric not null default 1,
  has_stairs boolean not null default false,
  walking_distance numeric not null default 0,
  distance_from_truck numeric not null default 0,
  weight numeric not null default 0,
  dimensions text,
  travel_miles numeric not null default 0,
  cost_per_mile numeric not null default 0.67,
  num_workers numeric not null default 2,
  hourly_rate numeric not null default 50,
  estimated_hours numeric not null default 4,
  travel_time numeric not null default 0.5,
  setup_time numeric not null default 0.5,
  cleanup_time numeric not null default 0.5,
  labor_cost numeric not null default 0,
  materials jsonb not null default '[]'::jsonb,
  material_cost numeric not null default 0,
  material_selling_price numeric not null default 0,
  equipment_rental numeric not null default 0,
  fuel_cost numeric not null default 0,
  consumables numeric not null default 0,
  tool_wear numeric not null default 0,
  equipment_cost numeric not null default 0,
  travel_cost numeric not null default 0,
  hidden_costs numeric not null default 0,
  overhead_pct numeric not null default 0,
  overhead_cost numeric not null default 0,
  contingency_pct numeric not null default 0,
  contingency_cost numeric not null default 0,
  tax_rate numeric not null default 8,
  taxes numeric not null default 0,
  gross_profit numeric not null default 0,
  net_profit numeric not null default 0,
  minimum_price numeric not null default 0,
  recommended_price numeric not null default 0,
  premium_price numeric not null default 0,
  profit_margin numeric not null default 0,
  hourly_profit numeric not null default 0,
  market_low numeric not null default 0,
  market_typical numeric not null default 0,
  market_high numeric not null default 0,
  market_notes text,
  profit_score numeric not null default 0,
  notes text,
  photo_urls jsonb not null default '[]'::jsonb,
  ai_suggestions jsonb not null default '[]'::jsonb,
  ai_photo_analysis jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- "Similar jobs" are sorted by `-created_date` convention; the equivalent
-- column here is `created_at`.
create index estimates_user_id_idx on public.estimates(user_id);
create index estimates_customer_id_idx on public.estimates(customer_id);
create index estimates_job_type_idx on public.estimates(job_type);
create index estimates_created_at_idx on public.estimates(created_at desc);

create trigger set_updated_at
  before update on public.estimates
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.estimates enable row level security;

-- profiles: a user reads their own row; admin/owner can read all rows.
create policy "profiles_select_own_or_staff" on public.profiles
  for select
  using (id = auth.uid() or public.current_user_role() in ('admin', 'owner'));

-- profiles: only the owner may change roles (including their own, and including
-- inserting into another user's row is not applicable since rows are auto-created).
create policy "profiles_update_owner_only" on public.profiles
  for update
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- customers: owner-of-row access, plus admin/owner staff bypass for read/update/delete.
-- insert stays restricted to the requesting user (admins create data as themselves).
create policy "customers_select_own_or_staff" on public.customers
  for select
  using (user_id = auth.uid() or public.current_user_role() in ('admin', 'owner'));

create policy "customers_insert_own" on public.customers
  for insert
  with check (user_id = auth.uid());

create policy "customers_update_own_or_staff" on public.customers
  for update
  using (user_id = auth.uid() or public.current_user_role() in ('admin', 'owner'));

create policy "customers_delete_own_or_staff" on public.customers
  for delete
  using (user_id = auth.uid() or public.current_user_role() in ('admin', 'owner'));

-- estimates: same pattern as customers.
create policy "estimates_select_own_or_staff" on public.estimates
  for select
  using (user_id = auth.uid() or public.current_user_role() in ('admin', 'owner'));

create policy "estimates_insert_own" on public.estimates
  for insert
  with check (user_id = auth.uid());

create policy "estimates_update_own_or_staff" on public.estimates
  for update
  using (user_id = auth.uid() or public.current_user_role() in ('admin', 'owner'));

create policy "estimates_delete_own_or_staff" on public.estimates
  for delete
  using (user_id = auth.uid() or public.current_user_role() in ('admin', 'owner'));
