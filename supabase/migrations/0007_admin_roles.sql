-- Role-based access for admin users.
-- super_admin: full access (Caio only)
-- assistant:   workforce + ops, NO financial (invoices, payments, reports)

-- Backfill any legacy "admin" rows to "super_admin" before tightening the check.
update public.admin_users set role = 'super_admin' where role = 'admin';

alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('super_admin', 'assistant'));

-- Helper: is the current user a super admin?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.admin_users
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

-- Tighten financial RLS: super_admin only on invoices, line items, payments.
drop policy if exists "invoices_admin_all" on public.invoices;
drop policy if exists "invoices_super_only" on public.invoices;
create policy "invoices_super_only" on public.invoices for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "invoice_line_items_admin_all" on public.invoice_line_items;
drop policy if exists "invoice_line_items_super_only" on public.invoice_line_items;
create policy "invoice_line_items_super_only" on public.invoice_line_items for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "payments_admin_all" on public.payments;
drop policy if exists "payments_super_only" on public.payments;
create policy "payments_super_only" on public.payments for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Projects: assistants can read but only super_admin can create/edit/delete.
drop policy if exists "projects_admin_all" on public.projects;
drop policy if exists "projects_super_write" on public.projects;
create policy "projects_super_write" on public.projects for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "projects_assistant_read" on public.projects;
create policy "projects_assistant_read" on public.projects for select to authenticated
  using (public.is_admin());
