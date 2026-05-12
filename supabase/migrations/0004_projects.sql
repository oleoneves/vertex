-- Projects: a discrete engagement with an employer (refinery expansion, hotel renovation, etc.)
-- A placement can belong to a project (optional). Projects roll up workers, hours, revenue, margin.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(id) on delete cascade,
  name text not null,
  slug text unique,
  location text,
  start_date date,
  end_date date,
  budget_hours numeric,
  budget_amount numeric,
  status text not null default 'active'
    check (status in ('active','completed','cancelled','paused')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists projects_employer_idx on public.projects(employer_id);
create index if not exists projects_status_idx on public.projects(status);

-- Add project_id to placements (nullable for backward compat)
alter table public.placements
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists placements_project_idx on public.placements(project_id);

-- RLS
alter table public.projects enable row level security;

drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projects_employer_read" on public.projects;
create policy "projects_employer_read" on public.projects for select to authenticated
  using (employer_id = public.current_employer_id());
