-- Multiple contacts per employer (supervisor, finance, director, etc.)

create table if not exists public.employer_contacts (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(id) on delete cascade,
  position text not null check (position in (
    'supervisor', 'finance', 'director', 'project_manager',
    'operations', 'safety', 'billing', 'other'
  )),
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists employer_contacts_employer_idx on public.employer_contacts(employer_id);

alter table public.employer_contacts enable row level security;

drop policy if exists "employer_contacts_admin_all" on public.employer_contacts;
create policy "employer_contacts_admin_all" on public.employer_contacts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
