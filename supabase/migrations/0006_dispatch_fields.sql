-- Dispatch import fields: rate, weight and commodity captured from
-- broker/company WhatsApp messages. All optional; existing rows unaffected.
alter table public.trips
  add column if not exists rate_cad numeric check (rate_cad is null or rate_cad >= 0),
  add column if not exists weight_kg numeric check (weight_kg is null or weight_kg >= 0),
  add column if not exists commodity text;
