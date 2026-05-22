-- Travel availability captured at worker registration.
-- Used when admin assigns out-of-town jobs.

alter table public.workers
  add column if not exists travel_available boolean not null default false,
  add column if not exists travel_region text
    check (travel_region in ('local','state','national','international') or travel_region is null);
