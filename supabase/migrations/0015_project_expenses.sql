-- Project closing — expenses logged against a project so super-admin can
-- subtract them from revenue to get the real net margin.
-- Examples: Airbnb, car rental, flights, extra hotels, extra labor (assistant),
-- gas, food, pharmacy, medical/accident, materials, other.

create table if not exists public.project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null check (category in (
    'airbnb','car_rental','flights','hotel','extra_labor',
    'gas','food','pharmacy','medical','materials','other'
  )),
  description text not null,
  amount numeric not null,
  expense_date date,
  vendor text,
  receipt_url text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists project_expenses_project_idx on public.project_expenses(project_id);
create index if not exists project_expenses_category_idx on public.project_expenses(category);

alter table public.project_expenses enable row level security;

drop policy if exists "project_expenses_super_only" on public.project_expenses;
create policy "project_expenses_super_only" on public.project_expenses for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
