-- Worker compliance documents (I-9, W-9, certifications, etc.)

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  type text not null check (type in (
    'i9','w9','drivers_license','ssn_card','work_authorization',
    'osha10','osha30','iicrc_wrt','iicrc_amrt',
    'workers_comp','photo','other'
  )),
  filename text not null,
  storage_path text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired')),
  expires_at date,
  uploaded_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  notes text
);

create index if not exists documents_worker_idx on public.documents(worker_id);
create index if not exists documents_type_idx on public.documents(type);
create index if not exists documents_status_idx on public.documents(status);

alter table public.documents enable row level security;

drop policy if exists "documents_admin_all" on public.documents;
create policy "documents_admin_all" on public.documents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "documents_self_read" on public.documents;
create policy "documents_self_read" on public.documents for select to authenticated
  using (worker_id = public.current_worker_id());

drop policy if exists "documents_self_insert" on public.documents;
create policy "documents_self_insert" on public.documents for insert to authenticated
  with check (worker_id = public.current_worker_id());

-- Private storage bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
