-- Project timesheets: signed hour-confirmation docs sent by the hiring company.
-- Used as source-of-truth proof to validate worker hours before invoicing.

create table if not exists public.project_timesheets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  employer_id uuid not null references public.employers(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes int,
  period_start date,
  period_end date,
  source_company text,
  total_hours_claimed numeric,
  status text not null default 'pending'
    check (status in ('pending','reconciled','disputed','archived')),
  parsed_data jsonb,
  notes text,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now()
);

create index if not exists project_timesheets_project_idx on public.project_timesheets(project_id);
create index if not exists project_timesheets_employer_idx on public.project_timesheets(employer_id);
create index if not exists project_timesheets_status_idx on public.project_timesheets(status);
create index if not exists project_timesheets_period_idx on public.project_timesheets(period_start);

alter table public.project_timesheets enable row level security;

drop policy if exists "project_timesheets_admin_all" on public.project_timesheets;
create policy "project_timesheets_admin_all" on public.project_timesheets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('timesheets', 'timesheets', false)
on conflict (id) do nothing;
