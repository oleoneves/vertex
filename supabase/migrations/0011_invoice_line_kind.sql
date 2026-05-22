-- Categorize invoice line items: labor / per_diem / travel / hotel / other.
-- worker_id is now optional (per_diem / travel / hotel may not tie to a single worker).

alter table public.invoice_line_items
  add column if not exists kind text not null default 'labor'
    check (kind in ('labor','per_diem','travel','hotel','other')),
  add column if not exists unit text;

alter table public.invoice_line_items
  alter column worker_id drop not null;

create index if not exists invoice_line_items_kind_idx on public.invoice_line_items(kind);
