-- Workforce management: workers, employers, placements, shifts, time entries, invoices.

-- Workers: candidates that have been hired
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null unique,
  employee_code text unique,
  full_name text not null,
  email text,
  phone text,
  status text not null default 'active' check (status in ('onboarding','active','inactive')),
  pay_type text not null default 'hourly' check (pay_type in ('hourly','salary')),
  default_pay_rate numeric,
  payment_method text default 'check' check (payment_method in ('check','ach','zelle','cashapp')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists workers_status_idx on public.workers(status);
create index if not exists workers_user_idx on public.workers(user_id);

-- Employers: companies that Vertex bills (separate from the job.employer text field)
create table if not exists public.employers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  billing_email text,
  billing_address text,
  bill_rate_multiplier numeric not null default 1.5,
  payment_terms_days int not null default 15,
  notes text,
  created_at timestamptz not null default now()
);

-- Placements: a worker assigned to an employer (and optionally a job)
create table if not exists public.placements (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  employer_id uuid not null references public.employers(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  role_title text not null,
  pay_rate numeric not null,
  bill_rate numeric not null,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active','ended','paused')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists placements_worker_idx on public.placements(worker_id);
create index if not exists placements_employer_idx on public.placements(employer_id);
create index if not exists placements_status_idx on public.placements(status);

-- Shifts: scheduled blocks of work for a placement
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.placements(id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  location text,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','no_show','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start)
);

create index if not exists shifts_placement_idx on public.shifts(placement_id);
create index if not exists shifts_status_idx on public.shifts(status);
create index if not exists shifts_start_idx on public.shifts(scheduled_start);

-- Time entries: actual clock-in/out events
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references public.shifts(id) on delete set null,
  worker_id uuid not null references public.workers(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  break_minutes int not null default 0,
  hours_worked numeric generated always as (
    case when clock_out_at is null then null
         else round(((extract(epoch from (clock_out_at - clock_in_at)) / 3600) - (break_minutes::numeric / 60))::numeric, 2)
    end
  ) stored,
  pay_rate_at_entry numeric,
  bill_rate_at_entry numeric,
  approved boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_worker_idx on public.time_entries(worker_id);
create index if not exists time_entries_placement_idx on public.time_entries(placement_id);
create index if not exists time_entries_approved_idx on public.time_entries(approved);
create index if not exists time_entries_clock_in_idx on public.time_entries(clock_in_at);

-- Only one open (no clock_out) entry per worker at a time
create unique index if not exists time_entries_one_open_per_worker
  on public.time_entries(worker_id) where clock_out_at is null;

-- Invoices: billed to an employer
create sequence if not exists invoice_number_seq start 1001;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('INV-' || lpad(nextval('invoice_number_seq')::text, 5, '0')),
  employer_id uuid not null references public.employers(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','paid','void','overdue')),
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  notes text,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index if not exists invoices_employer_idx on public.invoices(employer_id);
create index if not exists invoices_status_idx on public.invoices(status);

-- Invoice line items: one row per worker per pay period on an invoice
create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete restrict,
  placement_id uuid references public.placements(id) on delete set null,
  description text not null,
  hours numeric not null,
  rate numeric not null,
  amount numeric not null
);

create index if not exists invoice_line_items_invoice_idx on public.invoice_line_items(invoice_id);

-- Payments: in (from employer) or out (to worker)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('in','out')),
  invoice_id uuid references public.invoices(id) on delete set null,
  worker_id uuid references public.workers(id) on delete set null,
  amount numeric not null,
  method text default 'check' check (method in ('check','ach','zelle','cashapp','stripe','wire')),
  reference text,
  occurred_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_invoice_idx on public.payments(invoice_id);
create index if not exists payments_worker_idx on public.payments(worker_id);

-- is_worker helper
create or replace function public.current_worker_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.workers where user_id = auth.uid() limit 1;
$$;

-- RLS
alter table public.workers enable row level security;
alter table public.employers enable row level security;
alter table public.placements enable row level security;
alter table public.shifts enable row level security;
alter table public.time_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;

-- Admins: full access on every workforce table
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['workers','employers','placements','shifts','time_entries','invoices','invoice_line_items','payments']) loop
    execute format('drop policy if exists "%I_admin_all" on public.%I', tbl, tbl);
    execute format($f$
      create policy "%I_admin_all" on public.%I for all to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $f$, tbl, tbl);
  end loop;
end$$;

-- Workers: a worker can read their own record + their placements/shifts/time_entries
drop policy if exists "workers_self_read" on public.workers;
create policy "workers_self_read" on public.workers for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "placements_self_read" on public.placements;
create policy "placements_self_read" on public.placements for select to authenticated
  using (worker_id = public.current_worker_id());

drop policy if exists "shifts_self_read" on public.shifts;
create policy "shifts_self_read" on public.shifts for select to authenticated
  using (placement_id in (select id from public.placements where worker_id = public.current_worker_id()));

drop policy if exists "time_entries_self_rw" on public.time_entries;
create policy "time_entries_self_rw" on public.time_entries for all to authenticated
  using (worker_id = public.current_worker_id())
  with check (worker_id = public.current_worker_id());
