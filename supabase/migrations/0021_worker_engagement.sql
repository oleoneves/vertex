-- Worker engagement features: referrals, incident reports, ratings, weekly availability.

-- ============ Referrals ============
create table if not exists public.worker_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_worker_id uuid not null references public.workers(id) on delete cascade,
  referred_name text not null,
  referred_email text,
  referred_phone text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending','contacted','hired','declined','duplicate')),
  reward_amount numeric,
  created_at timestamptz not null default now()
);
create index if not exists worker_referrals_referrer_idx on public.worker_referrals(referrer_worker_id);
alter table public.worker_referrals enable row level security;
drop policy if exists "worker_referrals_self" on public.worker_referrals;
create policy "worker_referrals_self" on public.worker_referrals for all to authenticated
  using (referrer_worker_id = public.current_worker_id() or public.is_admin())
  with check (referrer_worker_id = public.current_worker_id() or public.is_admin());

-- ============ Incident reports ============
create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  placement_id uuid references public.placements(id) on delete set null,
  title text not null,
  description text not null,
  severity text not null default 'low'
    check (severity in ('low','medium','high','critical')),
  photo_paths text[] default array[]::text[],
  file_paths text[] default array[]::text[],
  status text not null default 'open'
    check (status in ('open','reviewing','resolved','dismissed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists incident_reports_worker_idx on public.incident_reports(worker_id);
create index if not exists incident_reports_status_idx on public.incident_reports(status);
alter table public.incident_reports enable row level security;
drop policy if exists "incident_reports_self" on public.incident_reports;
create policy "incident_reports_self" on public.incident_reports for all to authenticated
  using (worker_id = public.current_worker_id() or public.is_admin())
  with check (worker_id = public.current_worker_id() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('incidents', 'incidents', false)
on conflict (id) do nothing;

-- ============ Ratings (worker rates job/supervisor/peer) ============
create table if not exists public.worker_ratings_given (
  id uuid primary key default gen_random_uuid(),
  rater_worker_id uuid not null references public.workers(id) on delete cascade,
  target_kind text not null check (target_kind in ('job','supervisor','peer','project')),
  project_id uuid references public.projects(id) on delete set null,
  target_worker_id uuid references public.workers(id) on delete set null,
  target_name text,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists worker_ratings_given_rater_idx on public.worker_ratings_given(rater_worker_id);
create index if not exists worker_ratings_given_target_idx on public.worker_ratings_given(target_worker_id);
alter table public.worker_ratings_given enable row level security;
drop policy if exists "worker_ratings_self" on public.worker_ratings_given;
create policy "worker_ratings_self" on public.worker_ratings_given for all to authenticated
  using (rater_worker_id = public.current_worker_id() or public.is_admin())
  with check (rater_worker_id = public.current_worker_id() or public.is_admin());

-- ============ Weekly availability ============
create table if not exists public.worker_availability (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  week_start date not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  morning boolean not null default false,
  afternoon boolean not null default false,
  evening boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (worker_id, week_start, day_of_week)
);
create index if not exists worker_availability_worker_week_idx on public.worker_availability(worker_id, week_start);
alter table public.worker_availability enable row level security;
drop policy if exists "worker_availability_self" on public.worker_availability;
create policy "worker_availability_self" on public.worker_availability for all to authenticated
  using (worker_id = public.current_worker_id() or public.is_admin())
  with check (worker_id = public.current_worker_id() or public.is_admin());
