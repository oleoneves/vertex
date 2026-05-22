-- Before/after photos attached to time entries (job proof for restoration work).

alter table public.time_entries
  add column if not exists before_photo_paths text[] default array[]::text[],
  add column if not exists after_photo_paths text[] default array[]::text[];

-- Reuse incidents bucket for storage (single private bucket)
-- (no schema change for storage; paths will live under /jobs/<entry_id>/)

-- Helpful indexes for hot worker queries
create index if not exists time_entries_worker_clock_in_idx
  on public.time_entries(worker_id, clock_in_at desc);
create index if not exists shifts_placement_status_idx
  on public.shifts(placement_id, status);
create index if not exists invoices_paid_at_idx
  on public.invoices(paid_at desc) where paid_at is not null;
create index if not exists applications_created_at_idx
  on public.applications(created_at desc);
