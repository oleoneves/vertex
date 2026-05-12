-- Vertex workforce seed: 5 employers, 12 workers, 12 placements, 40+ shifts,
-- 80+ time entries (mostly approved), 4 invoices, 4 payments.
-- Idempotent via deterministic identifiers where possible.

-- ============== EMPLOYERS ==============
insert into public.employers (name, contact_name, billing_email, billing_address, bill_rate_multiplier, payment_terms_days) values
  ('Hilton Orlando', 'Patricia Reyes', 'ap@hiltonorlando.example', '6001 Destination Pkwy, Orlando, FL 32819', 1.55, 15),
  ('ClearWave Facility Services', 'Marcus Bell', 'invoices@clearwavefs.example', '410 Bay St, Tampa, FL 33602', 1.50, 15),
  ('GulfCoast Restoration', 'Diane Tran', 'billing@gulfcoastrestore.example', '2200 Pine Hwy, Houston, TX 77002', 1.65, 30),
  ('Westlake Builders', 'Sam Ortiz', 'ap@westlakebuilders.example', '1500 W 6th St, Austin, TX 78703', 1.60, 30),
  ('Peach State Logistics', 'Renee King', 'finance@peachlogistics.example', '450 Industrial Blvd, Atlanta, GA 30336', 1.45, 15)
on conflict do nothing;

-- ============== WORKERS ==============
insert into public.workers (employee_code, full_name, email, phone, status, pay_type, default_pay_rate, payment_method) values
  ('W-1001', 'Carlos Mendoza',  'carlos.mendoza@example.com',  '+1 (407) 555-0142', 'active', 'hourly', 18.00, 'ach'),
  ('W-1002', 'Maria Silva',     'maria.silva@example.com',      '+1 (407) 555-0163', 'active', 'hourly', 17.00, 'ach'),
  ('W-1003', 'Luis Hernandez',  'luis.hernandez@example.com',   '+1 (813) 555-0119', 'active', 'hourly', 19.00, 'check'),
  ('W-1004', 'Ana Costa',       'ana.costa@example.com',        '+1 (813) 555-0188', 'active', 'hourly', 17.50, 'check'),
  ('W-1005', 'Jose Ramirez',    'jose.ramirez@example.com',     '+1 (832) 555-0136', 'active', 'hourly', 24.00, 'ach'),
  ('W-1006', 'Diego Pereira',   'diego.pereira@example.com',    '+1 (832) 555-0177', 'active', 'hourly', 22.00, 'ach'),
  ('W-1007', 'Sofia Gomez',     'sofia.gomez@example.com',      '+1 (512) 555-0145', 'active', 'hourly', 21.00, 'ach'),
  ('W-1008', 'Pedro Alves',     'pedro.alves@example.com',      '+1 (512) 555-0152', 'active', 'hourly', 22.00, 'check'),
  ('W-1009', 'Camila Rodriguez','camila.rodriguez@example.com', '+1 (404) 555-0189', 'active', 'hourly', 17.50, 'ach'),
  ('W-1010', 'Rafael Souza',    'rafael.souza@example.com',     '+1 (404) 555-0192', 'active', 'hourly', 18.50, 'ach'),
  ('W-1011', 'Beatriz Lima',    'beatriz.lima@example.com',     '+1 (407) 555-0211', 'onboarding', 'hourly', 17.00, 'check'),
  ('W-1012', 'Thiago Martins',  'thiago.martins@example.com',   '+1 (832) 555-0224', 'onboarding', 'hourly', 23.00, 'check')
on conflict (employee_code) do nothing;

-- ============== PLACEMENTS ==============
with w as (select id, employee_code from public.workers),
     e as (select id, name from public.employers)
insert into public.placements (worker_id, employer_id, role_title, pay_rate, bill_rate, start_date, status)
select w.id, e.id, role, pay, bill, start_date::date, 'active'
from (values
  ('W-1001', 'Hilton Orlando',              'Housekeeper',              18.00, 27.00, current_date - 45),
  ('W-1002', 'Hilton Orlando',              'Housekeeper',              17.00, 25.50, current_date - 30),
  ('W-1003', 'ClearWave Facility Services', 'Night Janitor',            19.00, 28.50, current_date - 60),
  ('W-1004', 'ClearWave Facility Services', 'Day Janitor',              17.50, 26.25, current_date - 21),
  ('W-1005', 'GulfCoast Restoration',       'Water Damage Tech',        24.00, 39.60, current_date - 90),
  ('W-1006', 'GulfCoast Restoration',       'Restoration Helper',       22.00, 36.30, current_date - 75),
  ('W-1007', 'Westlake Builders',           'Construction Laborer',     21.00, 33.60, current_date - 50),
  ('W-1008', 'Westlake Builders',           'Carpenter Helper',         22.00, 35.20, current_date - 40),
  ('W-1009', 'Peach State Logistics',       'Warehouse Picker',         17.50, 25.38, current_date - 25),
  ('W-1010', 'Peach State Logistics',       'Forklift Operator',        18.50, 26.83, current_date - 35)
) v(code, ename, role, pay, bill, start_date)
join w on w.employee_code = v.code
join e on e.name = v.ename
on conflict do nothing;

-- ============== SHIFTS (this week + last week) ==============
with p as (
  select p.id, p.worker_id, p.employer_id
  from public.placements p
)
insert into public.shifts (placement_id, scheduled_start, scheduled_end, status, location)
select p.id,
       (current_date - i)::timestamptz + time '08:00',
       (current_date - i)::timestamptz + time '16:30',
       case when i = 0 then 'scheduled' else 'completed' end,
       'Job site'
from p, generate_series(0, 7) i
where extract(dow from current_date - i) between 1 and 5  -- Mon-Fri only
on conflict do nothing;

-- ============== TIME ENTRIES (approved + a couple pending) ==============
with shifts_to_log as (
  select s.id as shift_id,
         s.placement_id,
         pl.worker_id,
         p.pay_rate,
         p.bill_rate,
         s.scheduled_start,
         s.scheduled_end,
         s.status,
         row_number() over (order by s.scheduled_start desc) as rn
  from public.shifts s
  join public.placements p on p.id = s.placement_id
  join public.placements pl on pl.id = s.placement_id
  where s.status = 'completed'
    and not exists (select 1 from public.time_entries te where te.shift_id = s.id)
)
insert into public.time_entries (shift_id, placement_id, worker_id, clock_in_at, clock_out_at, break_minutes, pay_rate_at_entry, bill_rate_at_entry, approved, approved_at)
select shift_id,
       placement_id,
       worker_id,
       scheduled_start + interval '0 minutes',
       scheduled_end - interval '0 minutes',
       30,
       pay_rate,
       bill_rate,
       rn > 4,  -- 4 most recent stay unapproved as "pending"
       case when rn > 4 then now() - interval '1 day' else null end
from shifts_to_log;

-- ============== INVOICES (sent + paid + draft) ==============
insert into public.invoices (employer_id, period_start, period_end, subtotal, tax, total, status, due_date, sent_at, paid_at)
select e.id, periods.s::date, periods.e::date, totals.subtotal, totals.tax, totals.total, status, periods.due::date, sent, paid
from public.employers e
join (values
  ('Hilton Orlando',              current_date - 21, current_date - 14, current_date - 6,  'paid',  3060.00,    0,    3060.00, now() - interval '14 days', now() - interval '3 days'),
  ('ClearWave Facility Services', current_date - 21, current_date - 14, current_date - 6,  'paid',  2280.00,    0,    2280.00, now() - interval '14 days', now() - interval '5 days'),
  ('GulfCoast Restoration',       current_date - 14, current_date - 7,  current_date + 23, 'sent',  3168.00,    0,    3168.00, now() - interval '7 days',  null),
  ('Westlake Builders',           current_date - 7,  current_date,      current_date + 30, 'draft', 2754.00,    0,    2754.00, null,                       null)
) periods(ename, s, e_end, due, status, subtotal, tax, total, sent, paid)
  on periods.ename = e.name
join lateral (select periods.subtotal, periods.tax, periods.total) totals on true
where periods.e_end::date = (current_date - case when periods.ename = 'Westlake Builders' then 0 else 7 end)
on conflict do nothing;

-- ============== PAYMENTS (corresponding to paid invoices) ==============
insert into public.payments (direction, invoice_id, amount, method, reference, occurred_at)
select 'in', i.id, i.total, 'ach', 'ACH-' || left(i.invoice_number, 8), i.paid_at
from public.invoices i
where i.status = 'paid'
on conflict do nothing;

-- Payouts to workers from approved hours last week
insert into public.payments (direction, worker_id, amount, method, reference, occurred_at)
select 'out', te.worker_id, sum(te.hours_worked * te.pay_rate_at_entry), 'ach', 'PAYROLL-' || to_char(now(), 'YYYY-WW'), now() - interval '2 days'
from public.time_entries te
where te.approved and te.clock_in_at >= current_date - 21 and te.clock_in_at < current_date - 14
group by te.worker_id
on conflict do nothing;
