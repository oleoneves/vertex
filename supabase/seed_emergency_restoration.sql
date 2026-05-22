-- Vertex EMERGENCY RESTORATION simulation
-- Restoration Pro USA · Tampa Bay hurricane recovery · 100 workers × 30 days × 8h
-- Math: 100 workers × 30 calendar days × 8h = 24,000 hours
--       @ $15/hr pay = $360k cost · @ $25/hr bill = $600k revenue · $240k Vertex margin
-- Emergency work — 7 days a week, 7am–3pm
-- Idempotent — safe to run multiple times.

-- ============== 1. Project employer ==============
insert into public.employers (
  name, contact_name, billing_email, billing_address,
  bill_rate_multiplier, payment_terms_days, notes
)
select 'Restoration Pro USA',
       'Daniela Cardoso',
       'ap@restorationprousa.example',
       E'2400 Tampa Bay Blvd\nTampa, FL 33606',
       1.67, 15,
       'Disaster restoration franchise — 24/7 emergency response. Net-15.'
where not exists (
  select 1 from public.employers where name = 'Restoration Pro USA'
);

-- ============== 2. Project ==============
insert into public.projects (
  employer_id, name, slug, location, start_date, end_date,
  budget_hours, budget_amount, status, notes
)
select
  e.id,
  'Hurricane Recovery — Tampa Bay',
  'hurricane-recovery-tampa-bay',
  'Tampa Bay region · multi-site',
  (current_date - 15),
  (current_date + 45),
  30000,
  750000,
  'active',
  E'Emergency restoration following hurricane impact. 24/7 response, 7-day-a-week ops.\nScope: water extraction, mold remediation, structural drying, content cleaning.'
from public.employers e
where e.name = 'Restoration Pro USA'
  and not exists (
    select 1 from public.projects p where p.slug = 'hurricane-recovery-tampa-bay'
  );

-- ============== 3. 100 workers W-3001..W-3100 ==============
with names as (
  select
    array[
      'Carlos','Maria','Luis','Ana','Jose','Diego','Sofia','Pedro','Camila','Rafael',
      'Beatriz','Thiago','Juan','Lucia','Miguel','Isabella','Ricardo','Valeria','Fernando','Gabriela',
      'Daniel','Carolina','Marco','Patricia','Antonio','Mariana','Roberto','Alessandra','Sergio','Renata',
      'Alejandro','Vanessa','Eduardo','Bruna','Manuel','Daniela','Joao','Leticia','Andre','Larissa',
      'Felipe','Adriana','Lucas','Andrea','Henrique','Julia','Bruno','Amanda','Vinicius','Fernanda'
    ] as fn,
    array[
      'Silva','Santos','Garcia','Rodriguez','Martinez','Lopez','Hernandez','Gonzalez','Perez','Mendoza',
      'Ramirez','Costa','Pereira','Oliveira','Lima','Souza','Almeida','Ferreira','Carvalho','Gomes',
      'Diaz','Torres','Flores','Rivera','Gomez','Reyes','Cruz','Morales','Ortiz','Gutierrez',
      'Chavez','Ramos','Vargas','Castro','Romero','Alvarez','Ruiz','Mendes','Rocha','Barbosa',
      'Cardoso','Araujo','Nascimento','Correia','Moreira','Cunha','Pinto','Teixeira','Ribeiro','Machado'
    ] as ln
)
insert into public.workers (
  employee_code, full_name, email, phone, status, pay_type, default_pay_rate, payment_method, notes
)
select
  'W-' || (3000 + n)::text,
  names.fn[((n - 1) % 50) + 1] || ' ' || names.ln[((n * 11 + 17) % 50) + 1],
  'restoration' || n || '@vertex-demo.example',
  '+1 (813) 555-' || lpad(n::text, 4, '0'),
  'active',
  'hourly',
  15.00,
  case when n % 4 = 0 then 'check' else 'ach' end,
  'Tampa Bay restoration crew · disaster response'
from generate_series(1, 100) n, names
on conflict (employee_code) do nothing;

-- ============== 4. Placements: 100 workers → Restoration Pro project @ $15/$25 ==============
with emp as (select id from public.employers where name = 'Restoration Pro USA'),
     proj as (select id from public.projects where slug = 'hurricane-recovery-tampa-bay')
insert into public.placements (
  worker_id, employer_id, project_id, role_title, pay_rate, bill_rate, start_date, status, notes
)
select
  w.id, emp.id, proj.id,
  case (parsed.n % 8)
    when 0 then 'Water Extraction Tech'
    when 1 then 'Mold Remediation Tech'
    when 2 then 'Structural Drying Tech'
    when 3 then 'Content Cleaning'
    when 4 then 'Demolition Crew'
    when 5 then 'Carpet & Floor Tech'
    when 6 then 'Board-Up Crew'
    else 'Restoration Helper'
  end,
  15.00, 25.00,
  current_date - 15, 'active',
  'Hurricane Recovery · Tampa Bay'
from public.workers w
cross join emp
cross join proj
cross join lateral (select substring(w.employee_code from 3)::int as n) parsed
where w.employee_code like 'W-3%'
  and parsed.n between 3001 and 3100
  and not exists (
    select 1 from public.placements p
    where p.worker_id = w.id and p.employer_id = emp.id
  );

-- ============== 5. Shifts — 7 days/week, last 15 days + next 0, 7am–3pm = 8h ==============
with project_placements as (
  select p.id as placement_id
  from public.placements p
  join public.employers e on e.id = p.employer_id
  where e.name = 'Restoration Pro USA'
)
insert into public.shifts (
  placement_id, scheduled_start, scheduled_end, status, location, notes
)
select
  pp.placement_id,
  (current_date - i)::timestamptz + time '07:00',
  (current_date - i)::timestamptz + time '15:00',
  'completed',
  'Hurricane Recovery · Tampa Bay · multi-site',
  'Emergency response shift'
from project_placements pp
cross join generate_series(1, 15) i  -- last 15 days, every day (7-day operation)
where not exists (
  select 1 from public.shifts s
  where s.placement_id = pp.placement_id
    and s.scheduled_start::date = (current_date - i)::date
);

-- ============== 6. Time entries (8h each, fully approved) ==============
with project_shifts as (
  select s.id as shift_id, s.placement_id, p.worker_id, p.pay_rate, p.bill_rate,
         s.scheduled_start, s.scheduled_end
  from public.shifts s
  join public.placements p on p.id = s.placement_id
  join public.employers e on e.id = p.employer_id
  where e.name = 'Restoration Pro USA'
    and s.status = 'completed'
)
insert into public.time_entries (
  shift_id, placement_id, worker_id,
  clock_in_at, clock_out_at, break_minutes,
  pay_rate_at_entry, bill_rate_at_entry,
  approved, approved_at
)
select
  ps.shift_id, ps.placement_id, ps.worker_id,
  ps.scheduled_start, ps.scheduled_end, 0,
  ps.pay_rate, ps.bill_rate,
  true, ps.scheduled_end + interval '6 hours'
from project_shifts ps
where not exists (
  select 1 from public.time_entries te where te.shift_id = ps.shift_id
);

-- ============== 7. Generate sent invoice for the 15-day period ==============
do $$
declare
  emp_id uuid;
  payment_days int;
  inv_id uuid;
  p_start date := current_date - 15;
  p_end date := current_date - 1;
  subtotal_amt numeric;
begin
  select id, payment_terms_days into emp_id, payment_days
  from public.employers where name = 'Restoration Pro USA';

  if emp_id is null then return; end if;

  if exists (
    select 1 from public.invoices
    where employer_id = emp_id and period_start = p_start and period_end = p_end
  ) then return; end if;

  select coalesce(sum(te.hours_worked * te.bill_rate_at_entry), 0)
    into subtotal_amt
  from public.time_entries te
  join public.placements p on p.id = te.placement_id
  where p.employer_id = emp_id
    and te.approved
    and te.clock_in_at::date between p_start and p_end;

  if subtotal_amt = 0 then return; end if;

  insert into public.invoices (
    employer_id, period_start, period_end,
    subtotal, tax, total, status, due_date, sent_at, notes
  ) values (
    emp_id, p_start, p_end,
    subtotal_amt, 0, subtotal_amt,
    'sent',
    p_end + payment_days,
    now() - interval '1 day',
    'Hurricane Recovery — Tampa Bay · 15-day emergency response · 100 workers'
  ) returning id into inv_id;

  insert into public.invoice_line_items (
    invoice_id, worker_id, placement_id, description, hours, rate, amount
  )
  select
    inv_id, te.worker_id, te.placement_id,
    w.full_name || ' — ' || p.role_title,
    sum(te.hours_worked),
    max(te.bill_rate_at_entry),
    round(sum(te.hours_worked * te.bill_rate_at_entry)::numeric, 2)
  from public.time_entries te
  join public.placements p on p.id = te.placement_id
  join public.workers w on w.id = te.worker_id
  where p.employer_id = emp_id
    and te.approved
    and te.clock_in_at::date between p_start and p_end
  group by te.worker_id, te.placement_id, w.full_name, p.role_title;
end$$;

-- Summary:
-- ✓ 1 employer (Restoration Pro USA · Tampa FL, Net-15, 1.67×)
-- ✓ 1 project (Hurricane Recovery — Tampa Bay · $750k budget / 30k hr cap)
-- ✓ 100 workers W-3001..W-3100 (8 restoration roles)
-- ✓ 100 placements · $15 pay / $25 bill · started 15 days ago
-- ✓ 1,500 shifts (100 × 15 days, all days of week, 7am-3pm)
-- ✓ 12,000 approved hours = $180k cost / $300k revenue / $120k margin so far
-- ✓ 1 sent invoice for the 15-day period
