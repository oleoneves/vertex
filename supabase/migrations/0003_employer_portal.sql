-- Employer portal: auth user → employer mapping + RLS for read-only access.

create table if not exists public.employer_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  employer_id uuid not null references public.employers(id) on delete cascade,
  role text not null default 'manager' check (role in ('manager','viewer')),
  created_at timestamptz not null default now()
);

create index if not exists employer_users_employer_idx on public.employer_users(employer_id);

create or replace function public.current_employer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employer_id from public.employer_users where user_id = auth.uid() limit 1;
$$;

alter table public.employer_users enable row level security;

drop policy if exists "employer_users_self_read" on public.employer_users;
create policy "employer_users_self_read" on public.employer_users for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "employer_users_admin_write" on public.employer_users;
create policy "employer_users_admin_write" on public.employer_users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Read policies for employer-scoped data
drop policy if exists "employers_self_read" on public.employers;
create policy "employers_self_read" on public.employers for select to authenticated
  using (id = public.current_employer_id());

drop policy if exists "placements_employer_read" on public.placements;
create policy "placements_employer_read" on public.placements for select to authenticated
  using (employer_id = public.current_employer_id());

drop policy if exists "shifts_employer_read" on public.shifts;
create policy "shifts_employer_read" on public.shifts for select to authenticated
  using (placement_id in (select id from public.placements where employer_id = public.current_employer_id()));

drop policy if exists "time_entries_employer_read" on public.time_entries;
create policy "time_entries_employer_read" on public.time_entries for select to authenticated
  using (placement_id in (select id from public.placements where employer_id = public.current_employer_id()));

drop policy if exists "workers_employer_read" on public.workers;
create policy "workers_employer_read" on public.workers for select to authenticated
  using (id in (select worker_id from public.placements where employer_id = public.current_employer_id()));

drop policy if exists "invoices_employer_read" on public.invoices;
create policy "invoices_employer_read" on public.invoices for select to authenticated
  using (employer_id = public.current_employer_id() and status <> 'draft');

drop policy if exists "invoice_lines_employer_read" on public.invoice_line_items;
create policy "invoice_lines_employer_read" on public.invoice_line_items for select to authenticated
  using (invoice_id in (
    select id from public.invoices
    where employer_id = public.current_employer_id() and status <> 'draft'
  ));
