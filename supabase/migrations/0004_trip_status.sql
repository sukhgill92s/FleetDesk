-- Driver acceptance flow: trips added by the owner start as 'pending'
-- and must be accepted by the driver. Trips logged by the driver
-- themselves are 'accepted' right away.
alter table public.trips
  add column if not exists status text not null default 'accepted';
