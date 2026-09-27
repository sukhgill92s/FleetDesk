-- Trip/load number (e.g. dispatch trip number), optional, entered by driver or owner.
alter table public.trips
  add column if not exists trip_number text;
