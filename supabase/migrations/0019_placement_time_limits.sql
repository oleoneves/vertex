-- Time guards admin can set per placement so worker clock-in/out is bounded.
-- max_hours_per_day: refuse clock-in (or warn) if today's hours+new entry > limit
-- earliest_clock_in / latest_clock_out: enforce a daily window (e.g. 06:00-22:00)

alter table public.placements
  add column if not exists max_hours_per_day numeric,
  add column if not exists earliest_clock_in time,
  add column if not exists latest_clock_out time;
