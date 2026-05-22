-- Per-employer billing rates: hourly labor, per diem (per worker per day), travel time hourly.
-- These supersede bill_rate_multiplier when set (multiplier kept as fallback).

alter table public.employers
  add column if not exists hourly_bill_rate numeric,
  add column if not exists per_diem_rate numeric,
  add column if not exists travel_time_rate numeric;
