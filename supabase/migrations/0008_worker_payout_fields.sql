-- Additional fields for worker payouts and compliance:
-- - zelle_full_name: name registered on Zelle (may differ from worker.full_name)
-- - ssn: full SSN (sensitive; access restricted by RLS — admin only)
-- - w9_document_id: pointer to documents table for the worker's W-9 PDF

alter table public.workers
  add column if not exists zelle_full_name text,
  add column if not exists ssn text,
  add column if not exists w9_document_id uuid references public.documents(id) on delete set null;
