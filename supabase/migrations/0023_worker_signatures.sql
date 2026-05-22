-- E-signatures: worker must sign PPE usage + platform terms before clock-in.

create table if not exists public.worker_signatures (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  document text not null check (document in ('ppe','terms')),
  version text not null default 'v1',
  signed_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  unique (worker_id, document, version)
);

create index if not exists worker_signatures_worker_idx on public.worker_signatures(worker_id);

alter table public.worker_signatures enable row level security;
drop policy if exists "worker_signatures_self" on public.worker_signatures;
create policy "worker_signatures_self" on public.worker_signatures for all to authenticated
  using (worker_id = public.current_worker_id() or public.is_admin())
  with check (worker_id = public.current_worker_id() or public.is_admin());
