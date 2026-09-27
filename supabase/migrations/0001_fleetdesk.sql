-- FleetDesk: initial schema (pilot MVP)
-- Run this once in your Supabase project's SQL Editor (all statements together).
--
-- Tables: profiles, drivers, trucks, trips, expenses
-- Storage: private "receipts" bucket for expense receipt photos
-- Access model (one company per owner for the MVP):
--   * Owners (profiles.role = 'owner') read/write everything with their own owner_id.
--   * Drivers read/write only rows linked to their own driver record.
--   * A driver links to their record by "claiming" it with the login email
--     the owner entered, via the claim_driver_record() function.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'driver')),
  company_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users manage only their own profile"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- drivers
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (user_id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text,
  login_email text,
  per_mile_rate_cad numeric not null check (per_mile_rate_cad >= 0),
  created_at timestamptz not null default now()
);

create index drivers_owner_idx on public.drivers (owner_id);
create index drivers_user_idx on public.drivers (user_id);
-- One login email can only match a single unclaimed driver record,
-- so claim_driver_record() can never link a driver to two companies.
create unique index drivers_login_email_unique_idx
  on public.drivers (lower(login_email))
  where user_id is null and login_email is not null;

alter table public.drivers enable row level security;

-- ---------------------------------------------------------------- trucks
create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (user_id) on delete cascade,
  unit_number text not null,
  plate text,
  created_at timestamptz not null default now(),
  constraint trucks_owner_unit_unique unique (owner_id, unit_number)
);

create index trucks_owner_idx on public.trucks (owner_id);

alter table public.trucks enable row level security;

-- ---------------------------------------------------------------- trips
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (user_id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  trip_date date not null,
  from_location text not null,
  to_location text not null,
  miles numeric not null check (miles > 0),
  fuel_litres numeric check (fuel_litres is null or fuel_litres >= 0),
  fuel_cost_cad numeric check (fuel_cost_cad is null or fuel_cost_cad >= 0),
  truck_id uuid references public.trucks (id) on delete set null,
  created_at timestamptz not null default now()
);

create index trips_owner_date_idx on public.trips (owner_id, trip_date desc);
create index trips_driver_date_idx on public.trips (driver_id, trip_date desc);

alter table public.trips enable row level security;

-- ---------------------------------------------------------------- expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (user_id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  expense_date date not null,
  category text not null check (category in ('fuel', 'repair', 'food', 'toll', 'other')),
  amount_cad numeric not null check (amount_cad > 0),
  receipt_path text,
  created_at timestamptz not null default now()
);

create index expenses_owner_date_idx on public.expenses (owner_id, expense_date desc);
create index expenses_driver_date_idx on public.expenses (driver_id, expense_date desc);

alter table public.expenses enable row level security;

-- ------------------------------------------------------- helper functions
-- SECURITY DEFINER so they can read past RLS without recursive policy checks.

create or replace function public.my_driver_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.drivers where user_id = auth.uid() limit 1
$$;

create or replace function public.my_owner_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'owner'
    )
    then auth.uid()
    else (select owner_id from public.drivers where user_id = auth.uid() limit 1)
  end
$$;

-- Lets a signed-in driver link themselves to the driver record their owner
-- created, by matching the login email on their auth JWT. Only sets user_id;
-- no other column can be changed through this path.
create or replace function public.claim_driver_record()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_id uuid;
begin
  if v_email is null then
    return null;
  end if;
  update public.drivers
    set user_id = auth.uid()
    where user_id is null
      and lower(login_email) = v_email
    returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.my_driver_id() to authenticated;
grant execute on function public.my_owner_id() to authenticated;
grant execute on function public.claim_driver_record() to authenticated;

-- ------------------------------------------------------------------- RLS
-- drivers
create policy "Owners manage their drivers"
  on public.drivers
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Drivers read their own record"
  on public.drivers
  for select
  using (user_id = auth.uid());

-- trucks
create policy "Owners manage their trucks"
  on public.trucks
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Drivers view company trucks"
  on public.trucks
  for select
  using (owner_id = public.my_owner_id());

-- trips
create policy "Owners manage company trips"
  on public.trips
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Drivers manage their own trips"
  on public.trips
  for all
  using (driver_id = public.my_driver_id())
  with check (
    driver_id = public.my_driver_id()
    and owner_id = public.my_owner_id()
  );

-- expenses
create policy "Owners manage company expenses"
  on public.expenses
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Drivers manage their own expenses"
  on public.expenses
  for all
  using (driver_id = public.my_driver_id())
  with check (
    driver_id = public.my_driver_id()
    and owner_id = public.my_owner_id()
  );

-- ---------------------------------------------------------------- storage
-- Private bucket. Files are stored at: receipts/{owner_id}/{driver_id}/{file}
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Owners manage company receipts"
  on storage.objects
  for all
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Drivers upload and view company receipts"
  on storage.objects
  for select
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = public.my_owner_id()::text
  );

create policy "Drivers upload company receipts"
  on storage.objects
  for insert
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = public.my_owner_id()::text
  );
