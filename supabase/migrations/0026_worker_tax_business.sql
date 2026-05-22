-- Additional tax/business identifiers on the worker record:
-- - itin: Individual Taxpayer Identification Number (for workers without SSN)
-- - business_name: registered company name when the worker is paid as a business
-- - ein: Employer Identification Number for that business (used on 1099-NEC)

alter table public.workers
  add column if not exists itin text,
  add column if not exists business_name text,
  add column if not exists ein text;
