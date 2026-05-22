-- Match the Andrea weekly timesheet format:
-- - ticket_number: the contractor's work-order ID (e.g. 4110322351). Each day
--   can have multiple tickets per project. Same worker can appear on more than
--   one ticket per day.
-- - extra: ad-hoc bonus / extra-hour amount that doesn't fit hours × rate
--   (e.g. project finish bonus, retroactive adjustment).

alter table public.time_entries
  add column if not exists ticket_number text,
  add column if not exists extra numeric;

create index if not exists time_entries_ticket_idx on public.time_entries(ticket_number);
