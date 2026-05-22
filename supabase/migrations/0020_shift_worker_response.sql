-- Worker can accept or decline upcoming shifts from /worker/shifts.
-- Adds an "offered" and "declined" status path:
--   offered  → admin scheduled it, awaiting worker reply
--   accepted → worker accepted (default after accept)
--   declined → worker said no, admin needs to reassign

alter table public.shifts drop constraint if exists shifts_status_check;
alter table public.shifts add constraint shifts_status_check
  check (status in ('offered','accepted','scheduled','in_progress','completed','no_show','cancelled','declined'));

alter table public.shifts
  add column if not exists worker_responded_at timestamptz;
