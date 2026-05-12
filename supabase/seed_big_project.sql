-- Vertex BIG PROJECT simulation
-- Sunbelt Industrial Group · refinery expansion · 100 workers × 30 days × 8h
-- Math: 100 workers × ~22 weekdays × 8h = ~17,600 hours
--       @ $15/hr pay = ~$264k cost · @ $25/hr bill = ~$440k revenue · ~$176k Vertex margin
-- Idempotent — safe to run multiple times.

-- ============== 1. Project employer ==============
insert into public.employers (
  name, contact_name, billing_email, billing_address,
  bill_rate_multiplier, payment_terms_days, notes
)
select 'Sunbelt Industrial Group',
       'Mark Hollister',
       'ap@sunbeltindustrial.example',
       E'1200 Refinery Rd\nGalveston, TX 77550',
       1.67, 30,
       'Refinery expansion — 100-headcount project. Weekly billing.'
where not exists (
  select 1 from public.employers where name = 'Sunbelt Industrial Group'
);

-- ============== 2. 100 workers with realistic Hispanic/Portuguese names ==============
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
  'W-' || (2000 + n)::text,
  names.fn[((n - 1) % 50) + 1] || ' ' || names.ln[((n * 7 + 13) % 50) + 1],
  'worker' || n || '@vertex-demo.example',
  '+1 (713) 555-' || lpad(n::text, 4, '0'),
  'active',
  'hourly',
  15.00,
  case when n % 3 = 0 then 'check' else 'ach' end,
  'Sunbelt project · refinery laborer'
from generate_series(1, 100) n, names
on conflict (employee_code) do nothing;

-- ============== 2a. Project for the simulation ==============
insert into public.projects (
  employer_id, name, slug, location, start_date, end_date,
  budget_hours, budget_amount, status, notes
)
select
  e.id,
  'Sunbelt Refinery Expansion',
  'sunbelt-refinery-expansion',
  'Galveston, TX · Refinery Site',
  (current_date - 30),
  (current_date + 60),
  20000,
  500000,
  'active',
  '100-headcount refinery expansion · Mon–Fri 7am–3pm shifts.'
from public.employers e
where e.name = 'Sunbelt Industrial Group'
  and not exists (
    select 1 from public.projects p where p.slug = 'sunbelt-refinery-expansion'
  );

-- ============== 3. Placements: 100 workers → Sunbelt project @ $15/$25 ==============
with emp as (select id from public.employers where name = 'Sunbelt Industrial Group'),
     proj as (select id from public.projects where slug = 'sunbelt-refinery-expansion')
insert into public.placements (
  worker_id, employer_id, project_id, role_title, pay_rate, bill_rate, start_date, status, notes
)
select
  w.id, emp.id, proj.id,
  case (parsed.n % 8)
    when 0 then 'Welder Helper'
    when 1 then 'Pipefitter Helper'
    when 2 then 'Scaffolder'
    when 3 then 'Painter'
    when 4 then 'Insulator'
    when 5 then 'General Laborer'
    when 6 then 'Equipment Operator'
    else 'Construction Laborer'
  end,
  15.00, 25.00,
  current_date - 30, 'active',
  'Sunbelt refinery expansion'
from public.workers w
cross join emp
cross join proj
cross join lateral (select substring(w.employee_code from 3)::int as n) parsed
where w.employee_code like 'W-2%'
  and parsed.n between 2001 and 2100
  and not exists (
    select 1 from public.placements p
    where p.worker_id = w.id and p.employer_id = emp.id
  );

-- ============== 4. Shifts (Mon–Fri last 30 days, 7am–3pm = 8h) ==============
with project_placements as (
  select p.id as placement_id
  from public.placements p
  join public.employers e on e.id = p.employer_id
  where e.name = 'Sunbelt Industrial Group'
)
insert into public.shifts (
  placement_id, scheduled_start, scheduled_end, status, location, notes
)
select
  pp.placement_id,
  (current_date - i)::timestamptz + time '07:00',
  (current_date - i)::timestamptz + time '15:00',
  'completed',
  'Sunbelt Refinery Expansion · Galveston, TX',
  null
from project_placements pp
cross join generate_series(1, 30) i
where extract(dow from (current_date - i)) between 1 and 5  -- Mon-Fri
  and not exists (
    select 1 from public.shifts s
    where s.placement_id = pp.placement_id
      and s.scheduled_start::date = (current_date - i)::date
  );

-- ============== 5. Time entries (8h each, fully approved) ==============
with project_shifts as (
  select s.id as shift_id, s.placement_id, p.worker_id, p.pay_rate, p.bill_rate,
         s.scheduled_start, s.scheduled_end
  from public.shifts s
  join public.placements p on p.id = s.placement_id
  join public.employers e on e.id = p.employer_id
  where e.name = 'Sunbelt Industrial Group'
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
  true, ps.scheduled_end + interval '12 hours'
from project_shifts ps
where not exists (
  select 1 from public.time_entries te where te.shift_id = ps.shift_id
);

-- ============== 6. Generate invoice for the 30-day period ==============
do $$
declare
  emp_id uuid;
  payment_days int;
  inv_id uuid;
  period_start date := current_date - 30;
  period_end date := current_date - 1;
  subtotal_amt numeric;
begin
  select id, payment_terms_days into emp_id, payment_days
  from public.employers where name = 'Sunbelt Industrial Group';

  if emp_id is null then return; end if;

  -- Skip if an invoice already exists for this period
  if exists (
    select 1 from public.invoices
    where employer_id = emp_id and period_start = period_start and period_end = period_end
  ) then return; end if;

  select coalesce(sum(te.hours_worked * te.bill_rate_at_entry), 0)
    into subtotal_amt
  from public.time_entries te
  join public.placements p on p.id = te.placement_id
  where p.employer_id = emp_id
    and te.approved
    and te.clock_in_at::date between period_start and period_end;

  if subtotal_amt = 0 then return; end if;

  insert into public.invoices (
    employer_id, period_start, period_end,
    subtotal, tax, total, status, due_date, notes
  ) values (
    emp_id, period_start, period_end,
    subtotal_amt, 0, subtotal_amt,
    'draft',
    period_end + payment_days,
    'Sunbelt refinery expansion · 30-day period · 100 workers'
  ) returning id into inv_id;

  -- Line items: one row per worker
  insert into public.invoice_line_items (
    invoice_id, worker_id, placement_id, description, hours, rate, amount
  )
  select
    inv_id,
    te.worker_id,
    te.placement_id,
    w.full_name || ' — ' || p.role_title,
    sum(te.hours_worked),
    max(te.bill_rate_at_entry),
    round(sum(te.hours_worked * te.bill_rate_at_entry)::numeric, 2)
  from public.time_entries te
  join public.placements p on p.id = te.placement_id
  join public.workers w on w.id = te.worker_id
  where p.employer_id = emp_id
    and te.approved
    and te.clock_in_at::date between period_start and period_end
  group by te.worker_id, te.placement_id, w.full_name, p.role_title;
end$$;

-- ============== Summary view (run after import) ==============
-- select
--   (select count(*) from public.workers where employee_code like 'W-2%') as workers,
--   (select count(*) from public.placements p join public.employers e on e.id=p.employer_id where e.name='Sunbelt Industrial Group') as placements,
--   (select count(*) from public.shifts s join public.placements p on p.id=s.placement_id join public.employers e on e.id=p.employer_id where e.name='Sunbelt Industrial Group') as shifts,
--   (select count(*) from public.time_entries te join public.placements p on p.id=te.placement_id join public.employers e on e.id=p.employer_id where e.name='Sunbelt Industrial Group') as time_entries,
--   (select round(sum(te.hours_worked),0) from public.time_entries te join public.placements p on p.id=te.placement_id join public.employers e on e.id=p.employer_id where e.name='Sunbelt Industrial Group') as total_hours,
--   (select round(sum(te.hours_worked * te.bill_rate_at_entry),0) from public.time_entries te join public.placements p on p.id=te.placement_id join public.employers e on e.id=p.employer_id where e.name='Sunbelt Industrial Group') as billable;
