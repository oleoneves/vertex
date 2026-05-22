-- Worker requests for time off (folga / vacation).

create table if not exists public.time_off_requests (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  reason text,
  kind text not null default 'unpaid'
    check (kind in ('vacation','sick','personal','unpaid','other')),
  status text not null default 'pending'
    check (status in ('pending','approved','declined','cancelled')),
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists time_off_requests_worker_idx on public.time_off_requests(worker_id);
create index if not exists time_off_requests_status_idx on public.time_off_requests(status);

alter table public.time_off_requests enable row level security;

drop policy if exists "time_off_requests_self" on public.time_off_requests;
create policy "time_off_requests_self" on public.time_off_requests for all to authenticated
  using (worker_id = public.current_worker_id() or public.is_admin())
  with check (worker_id = public.current_worker_id() or public.is_admin());
