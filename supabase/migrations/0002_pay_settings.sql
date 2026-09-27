-- FleetDesk: pay periods + pay types (pilot v2)
-- Run once in the Supabase SQL Editor AFTER 0001_fleetdesk.sql.
--
-- * profiles.pay_period: 'weekly' | 'biweekly' | 'monthly' (company setting)
-- * drivers.pay_type: 'per_mile' | 'hourly', plus hourly_rate_cad
-- * trips.hours: hours worked on a trip (used for hourly drivers)

alter table public.profiles
  add column pay_period text not null default 'weekly'
  check (pay_period in ('weekly', 'biweekly', 'monthly'));

alter table public.drivers
  add column pay_type text not null default 'per_mile'
  check (pay_type in ('per_mile', 'hourly'));

alter table public.drivers
  add column hourly_rate_cad numeric
  check (hourly_rate_cad is null or hourly_rate_cad >= 0);

alter table public.trips
  add column hours numeric
  check (hours is null or hours > 0);
