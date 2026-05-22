-- Fields captured at project creation so an estimate can be auto-generated:
-- people × hours_per_day × days = total labor hours.

alter table public.projects
  add column if not exists estimate_people int,
  add column if not exists estimate_hours_per_day numeric,
  add column if not exists estimate_travel_hours_per_person numeric;
