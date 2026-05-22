-- Per-employer cost rates (what Vertex pays out) alongside bill rates (what the employer pays Vertex).
-- Margin per category = bill_rate - cost_rate.

alter table public.employers
  add column if not exists hourly_pay_rate numeric,
  add column if not exists per_diem_cost numeric,
  add column if not exists travel_time_cost numeric;
