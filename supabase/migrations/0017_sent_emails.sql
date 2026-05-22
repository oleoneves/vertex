-- Log of emails sent through the admin composer.
-- Used so assistant + super_admin can audit what was sent and to whom.

create table if not exists public.sent_emails (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contractor','worker','custom')),
  to_emails text[] not null,
  subject text not null,
  body text not null,
  sent_by uuid references auth.users(id),
  sent_at timestamptz not null default now(),
  status text not null default 'sent' check (status in ('sent','failed')),
  error text
);

create index if not exists sent_emails_sent_at_idx on public.sent_emails(sent_at desc);
create index if not exists sent_emails_kind_idx on public.sent_emails(kind);

alter table public.sent_emails enable row level security;

drop policy if exists "sent_emails_admin_all" on public.sent_emails;
create policy "sent_emails_admin_all" on public.sent_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
