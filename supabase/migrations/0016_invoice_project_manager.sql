-- Project manager name responsible for the work captured on this invoice.
-- Free text so the assistant can fill it even if no employer_contacts row exists yet.

alter table public.invoices
  add column if not exists project_manager text;
