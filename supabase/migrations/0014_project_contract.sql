-- Allow project_timesheets to also store signed contracts (e.g. DocuSign export).
-- Adds a kind column to distinguish 'timesheet' (default) vs 'contract'.

alter table public.project_timesheets
  add column if not exists kind text not null default 'timesheet'
    check (kind in ('timesheet', 'contract'));
