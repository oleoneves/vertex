-- Vertex initial schema
-- Run on Supabase via Management API or psql.

create extension if not exists "pgcrypto";

-- Jobs posted publicly
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  employer text not null,
  category text not null,
  employment_type text not null check (employment_type in ('full_time','part_time','seasonal','contract')),
  location_city text not null,
  location_state text not null check (length(location_state) = 2),
  hourly_rate_min numeric,
  hourly_rate_max numeric,
  description text not null,
  requirements text,
  benefits text,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists jobs_active_idx on public.jobs(active) where active;
create index if not exists jobs_state_idx on public.jobs(location_state);
create index if not exists jobs_category_idx on public.jobs(category);

-- Candidates
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  locale text not null default 'en' check (locale in ('en','es','pt')),
  created_at timestamptz not null default now()
);

-- Applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  cv_url text,
  experience_summary text,
  status text not null default 'new' check (status in ('new','reviewing','accepted','rejected')),
  ai_score int,
  ai_summary text,
  created_at timestamptz not null default now()
);

create index if not exists applications_job_idx on public.applications(job_id);
create index if not exists applications_candidate_idx on public.applications(candidate_id);
create index if not exists applications_status_idx on public.applications(status);

-- Admins (allow-list of auth users)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

-- RLS
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.admin_users enable row level security;

-- Jobs: public can read active; admins manage
drop policy if exists "jobs_public_read" on public.jobs;
create policy "jobs_public_read" on public.jobs for select using (active = true);

drop policy if exists "jobs_admin_all" on public.jobs;
create policy "jobs_admin_all" on public.jobs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Candidates: server inserts via service role; admins read
drop policy if exists "candidates_admin_read" on public.candidates;
create policy "candidates_admin_read" on public.candidates for select to authenticated
  using (public.is_admin());

-- Applications: server inserts via service role; admins read/update
drop policy if exists "applications_admin_all" on public.applications;
create policy "applications_admin_all" on public.applications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- admin_users: only admins see the list
drop policy if exists "admin_users_self" on public.admin_users;
create policy "admin_users_self" on public.admin_users for select to authenticated
  using (public.is_admin());

-- Storage bucket for CVs (private)
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;
