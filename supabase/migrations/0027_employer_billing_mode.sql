-- Billing mode toggle: hourly (existing rate-based) or fixed_budget (per-project budget).
-- When fixed_budget, per-project budget_amount drives invoicing instead of hourly_bill_rate × hours.

alter table public.employers
  add column if not exists billing_mode text default 'hourly'
    check (billing_mode in ('hourly', 'fixed_budget'));
