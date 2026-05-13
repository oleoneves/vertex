// Demo data — used when Supabase is not configured (DEMO_MODE).
// Lets the entire admin/employer/worker UI render realistic numbers without a DB.
// Numbers are designed to match the "Sunbelt Refinery Expansion" simulation:
// 100 workers · 30 days · 8h/day · $15 pay / $25 bill = $600k revenue / $240k margin.

import type {
  Worker,
  Employer,
  Placement,
  Shift,
  TimeEntry,
  Invoice,
  InvoiceLineItem,
  Project,
  Payment,
} from "@/types/db";

// ============== Name pools ==============
const FIRST_NAMES = [
  "Carlos","Maria","Luis","Ana","Jose","Diego","Sofia","Pedro","Camila","Rafael",
  "Beatriz","Thiago","Juan","Lucia","Miguel","Isabella","Ricardo","Valeria","Fernando","Gabriela",
  "Daniel","Carolina","Marco","Patricia","Antonio","Mariana","Roberto","Alessandra","Sergio","Renata",
  "Alejandro","Vanessa","Eduardo","Bruna","Manuel","Daniela","Joao","Leticia","Andre","Larissa",
  "Felipe","Adriana","Lucas","Andrea","Henrique","Julia","Bruno","Amanda","Vinicius","Fernanda",
];
const LAST_NAMES = [
  "Silva","Santos","Garcia","Rodriguez","Martinez","Lopez","Hernandez","Gonzalez","Perez","Mendoza",
  "Ramirez","Costa","Pereira","Oliveira","Lima","Souza","Almeida","Ferreira","Carvalho","Gomes",
  "Diaz","Torres","Flores","Rivera","Gomez","Reyes","Cruz","Morales","Ortiz","Gutierrez",
  "Chavez","Ramos","Vargas","Castro","Romero","Alvarez","Ruiz","Mendes","Rocha","Barbosa",
  "Cardoso","Araujo","Nascimento","Correia","Moreira","Cunha","Pinto","Teixeira","Ribeiro","Machado",
];

const PROJECT_ROLES = [
  "Welder Helper",
  "Pipefitter Helper",
  "Scaffolder",
  "Painter",
  "Insulator",
  "General Laborer",
  "Equipment Operator",
  "Construction Laborer",
];

// ============== Stable IDs ==============
const ID = {
  emp: {
    sunbelt: "emp-sunbelt",
    hilton: "emp-hilton",
    clearwave: "emp-clearwave",
    westlake: "emp-westlake",
  },
  project: "proj-sunbelt",
};

// ============== Time helpers ==============
function isoNow(offsetMs: number = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}
function isoDaysAgo(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function dateAddDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ============== Generated workers (200) ==============
function makeWorker(n: number, opts: { onboarding?: boolean } = {}): Worker {
  const first = FIRST_NAMES[(n - 1) % FIRST_NAMES.length];
  const last = LAST_NAMES[((n * 7) + 13) % LAST_NAMES.length];
  return {
    id: `worker-${String(n).padStart(3, "0")}`,
    candidate_id: null,
    user_id: null,
    employee_code: `W-D${String(n).padStart(3, "0")}`,
    full_name: `${first} ${last}`,
    email: `worker${n}@vertex-demo.example`,
    phone: `+1 (713) 555-${String(n).padStart(4, "0")}`,
    status: opts.onboarding ? "onboarding" : "active",
    pay_type: "hourly",
    default_pay_rate: 15,
    payment_method: n % 3 === 0 ? "check" : "ach",
    notes: null,
    created_at: isoDaysAgo(40 + (n % 30)),
  };
}

export function demoWorkers(): Worker[] {
  return Array.from({ length: 200 }, (_, i) => makeWorker(i + 1, { onboarding: i >= 190 }));
}

// ============== Employers ==============
export function demoEmployers(): Employer[] {
  return [
    {
      id: ID.emp.sunbelt,
      name: "Sunbelt Industrial Group",
      contact_name: "Mark Hollister",
      billing_email: "ap@sunbeltindustrial.example",
      billing_address: "1200 Refinery Rd\nGalveston, TX 77550",
      bill_rate_multiplier: 1.67,
      payment_terms_days: 30,
      notes: "Refinery expansion — 100-headcount project. Weekly billing.",
      created_at: isoDaysAgo(45),
    },
    {
      id: ID.emp.hilton,
      name: "Hilton Orlando",
      contact_name: "Patricia Reyes",
      billing_email: "ap@hiltonorlando.example",
      billing_address: "6001 Destination Pkwy\nOrlando, FL 32819",
      bill_rate_multiplier: 1.67,
      payment_terms_days: 15,
      notes: null,
      created_at: isoDaysAgo(60),
    },
    {
      id: ID.emp.clearwave,
      name: "ClearWave Facility Services",
      contact_name: "Marcus Bell",
      billing_email: "invoices@clearwavefs.example",
      billing_address: "410 Bay St\nTampa, FL 33602",
      bill_rate_multiplier: 1.67,
      payment_terms_days: 15,
      notes: null,
      created_at: isoDaysAgo(50),
    },
    {
      id: ID.emp.westlake,
      name: "Westlake Builders",
      contact_name: "Sam Ortiz",
      billing_email: "ap@westlakebuilders.example",
      billing_address: "1500 W 6th St\nAustin, TX 78703",
      bill_rate_multiplier: 1.67,
      payment_terms_days: 30,
      notes: null,
      created_at: isoDaysAgo(40),
    },
  ];
}

// ============== Project ==============
export function demoProjects(): (Project & { employer: { name: string } })[] {
  return [
    {
      id: ID.project,
      employer_id: ID.emp.sunbelt,
      name: "Sunbelt Refinery Expansion",
      slug: "sunbelt-refinery-expansion",
      location: "Galveston, TX · Refinery Site",
      start_date: dateAddDays(new Date(), -30),
      end_date: dateAddDays(new Date(), 60),
      budget_hours: 20000,
      budget_amount: 500000,
      status: "active",
      notes: "100-headcount refinery expansion. Mon-Sun 7am-3pm shifts.",
      created_at: isoDaysAgo(31),
      employer: { name: "Sunbelt Industrial Group" },
    },
  ];
}

// ============== Placements ==============
// 100 workers in the Sunbelt project. The rest are scattered or idle.
export function demoPlacements(): Placement[] {
  const out: Placement[] = [];
  for (let i = 1; i <= 100; i++) {
    out.push({
      id: `placement-${i}`,
      worker_id: `worker-${String(i).padStart(3, "0")}`,
      employer_id: ID.emp.sunbelt,
      project_id: ID.project,
      job_id: null,
      role_title: PROJECT_ROLES[(i - 1) % PROJECT_ROLES.length],
      pay_rate: 15,
      bill_rate: 25,
      start_date: dateAddDays(new Date(), -30),
      end_date: null,
      status: "active",
      notes: "Sunbelt refinery expansion",
      created_at: isoDaysAgo(30),
    });
  }
  // 12 housekeepers @ Hilton
  for (let i = 0; i < 12; i++) {
    const wn = 101 + i;
    out.push({
      id: `placement-h${i}`,
      worker_id: `worker-${String(wn).padStart(3, "0")}`,
      employer_id: ID.emp.hilton,
      project_id: null,
      job_id: null,
      role_title: "Housekeeper",
      pay_rate: 15,
      bill_rate: 25,
      start_date: dateAddDays(new Date(), -45),
      end_date: null,
      status: "active",
      notes: null,
      created_at: isoDaysAgo(46),
    });
  }
  // 10 janitors @ ClearWave
  for (let i = 0; i < 10; i++) {
    const wn = 113 + i;
    out.push({
      id: `placement-c${i}`,
      worker_id: `worker-${String(wn).padStart(3, "0")}`,
      employer_id: ID.emp.clearwave,
      project_id: null,
      job_id: null,
      role_title: i % 2 === 0 ? "Night Janitor" : "Day Porter",
      pay_rate: 16,
      bill_rate: 26,
      start_date: dateAddDays(new Date(), -60),
      end_date: null,
      status: "active",
      notes: null,
      created_at: isoDaysAgo(60),
    });
  }
  // 8 construction @ Westlake
  for (let i = 0; i < 8; i++) {
    const wn = 123 + i;
    out.push({
      id: `placement-w${i}`,
      worker_id: `worker-${String(wn).padStart(3, "0")}`,
      employer_id: ID.emp.westlake,
      project_id: null,
      job_id: null,
      role_title: "Construction Laborer",
      pay_rate: 18,
      bill_rate: 28,
      start_date: dateAddDays(new Date(), -50),
      end_date: null,
      status: "active",
      notes: null,
      created_at: isoDaysAgo(50),
    });
  }
  return out;
}

// ============== Upcoming shifts ==============
export function demoUpcomingShifts(): Shift[] {
  const out: Shift[] = [];
  // Tomorrow's Sunbelt shift for first 30 workers
  for (let i = 1; i <= 30; i++) {
    out.push({
      id: `shift-tomorrow-${i}`,
      placement_id: `placement-${i}`,
      scheduled_start: isoDaysAgo(-1, 7, 0),
      scheduled_end: isoDaysAgo(-1, 15, 0),
      location: "Sunbelt Refinery Expansion · Galveston, TX",
      status: "scheduled",
      notes: null,
      created_at: isoNow(),
    });
  }
  // Day after for next 30
  for (let i = 31; i <= 60; i++) {
    out.push({
      id: `shift-d2-${i}`,
      placement_id: `placement-${i}`,
      scheduled_start: isoDaysAgo(-2, 7, 0),
      scheduled_end: isoDaysAgo(-2, 15, 0),
      location: "Sunbelt Refinery Expansion · Galveston, TX",
      status: "scheduled",
      notes: null,
      created_at: isoNow(),
    });
  }
  return out;
}

// ============== Pre-computed dashboard ==============
// Numbers reflect: 100 Sunbelt workers × 30 days × 8h = 24,000 hours
// + ~30 other workers × 20 days × 8h ≈ 4,800 hours = 28,800 total
// $15 pay = $432k cost. $25 bill = $720k revenue. $288k margin total.
// MTD revenue (paid this calendar month): ~$200k
const TOTAL_HOURS = 28800;
const TOTAL_PAY = 432000;
const TOTAL_REVENUE = 720000;

export function demoDashboard() {
  const now = new Date();
  const day = now.getUTCDay();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);

  // 130 workers × 8h × 5 days into the week = 5,200 hrs this week
  const hoursThisWeek = 5_200;
  const marginThisWeek = hoursThisWeek * 10;

  const hoursByDay = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const isPast = d <= now;
    return {
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
      hours: isPast ? (i === 0 || i === 6 ? 0 : 1040) : 0,
    };
  });

  return {
    revenueMtd: 218_400,
    outstanding: 152_000,
    pendingPayoutCents: 0,
    marginThisWeek,
    activeWorkers: 190,
    activePlacements: 130,
    openJobs: 14,
    hoursThisWeek,
    pendingTimesheets: 86,
    newApplications24h: 7,
    liveOnTheClock: liveOnTheClockSample(),
    activeProjects: [
      {
        id: ID.project,
        name: "Sunbelt Refinery Expansion",
        employer: "Sunbelt Industrial Group",
        activeWorkers: 100,
        hours: 24000,
        revenue: 600000,
        margin: 240000,
        budgetAmount: 500000,
        budgetPct: Math.min(100, Math.round((600000 / 500000) * 100)),
      },
    ],
    hoursByDay,
    topEmployers: [
      { name: "Sunbelt Industrial Group", revenue: 600000 },
      { name: "Hilton Orlando", revenue: 56000 },
      { name: "ClearWave Facility Services", revenue: 42000 },
      { name: "Westlake Builders", revenue: 22000 },
    ],
    topWorkers: demoWorkers().slice(0, 5).map((w) => ({
      name: w.full_name,
      hours: 240 - (Number(w.id.slice(-3)) % 6) * 8,
    })),
    recentActivity: recentActivitySample(),
  };
}

function liveOnTheClockSample() {
  const workers = demoWorkers();
  return Array.from({ length: 12 }).map((_, i) => {
    const w = workers[i * 7 + 3];
    const minsAgo = 5 + (i * 31) % 360; // 5m to 6h
    return {
      id: `live-${i}`,
      worker: w.full_name,
      placement: i < 9
        ? `Sunbelt Industrial Group · ${PROJECT_ROLES[(i + 1) % PROJECT_ROLES.length]}`
        : i === 9
        ? "Hilton Orlando · Housekeeper"
        : i === 10
        ? "ClearWave Facility Services · Day Porter"
        : "Westlake Builders · Construction Laborer",
      clockInAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
    };
  });
}

function recentActivitySample() {
  return [
    { type: "time", label: "Carlos Mendoza clocked in", at: new Date(Date.now() - 8 * 60000).toISOString() },
    { type: "invoice", label: "INV-01003 — $32,400 (sent)", at: new Date(Date.now() - 45 * 60000).toISOString() },
    { type: "application", label: "Beatriz Lima applied to Construction Laborer", at: new Date(Date.now() - 95 * 60000).toISOString() },
    { type: "time", label: "Sofia Gomez clocked out", at: new Date(Date.now() - 130 * 60000).toISOString() },
    { type: "time", label: "Pedro Alves clocked in", at: new Date(Date.now() - 145 * 60000).toISOString() },
    { type: "invoice", label: "INV-01002 — $42,000 (paid)", at: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
    { type: "application", label: "Thiago Martins applied to Welder Helper", at: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
    { type: "time", label: "Camila Rodriguez clocked in", at: new Date(Date.now() - 7 * 3600 * 1000).toISOString() },
  ];
}

// ============== Project detail ==============
export function demoProjectDetail(id: string) {
  if (id !== ID.project) return null;
  const project = demoProjects()[0];
  const placements = demoPlacements()
    .filter((p) => p.project_id === ID.project)
    .map((p) => ({
      ...p,
      worker: demoWorkers().find((w) => w.id === p.worker_id) ?? null,
    }));

  // 14-day chart: 100 workers × 8h × 7 weekdays/2 = approx; let's just do flat 800/day for last 14
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      day: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      hours: 800, // 100 workers × 8 hours
    };
  });

  // Role rollup
  const roleRows = PROJECT_ROLES.map((role, i) => {
    const count = i === 0 || i === 7 ? 13 : 12; // ~100 split across 8 roles
    return {
      role,
      hours: count * 8 * 30,
      headcount: count,
    };
  }).sort((a, b) => b.hours - a.hours);

  // Recent entries
  const recentEntries = Array.from({ length: 10 }).map((_, i) => {
    const w = demoWorkers()[i + 4];
    return {
      id: `re-${i}`,
      hours_worked: 8,
      pay_rate_at_entry: 15,
      bill_rate_at_entry: 25,
      clock_in_at: new Date(Date.now() - (i + 1) * 12 * 3600 * 1000).toISOString(),
      clock_out_at: new Date(Date.now() - (i + 1) * 4 * 3600 * 1000).toISOString(),
      approved: i > 2,
      placement: { project_id: ID.project, role_title: PROJECT_ROLES[i % PROJECT_ROLES.length] },
      worker: { full_name: w.full_name },
    };
  });

  return {
    project: { ...project, employer: demoEmployers()[0] },
    placements,
    activeWorkers: 100,
    totalWorkers: 100,
    totals: {
      hours: 24000,
      cost: 360000,
      revenue: 600000,
      margin: 240000,
      pendingHours: 0,
    },
    days,
    roleRows,
    recentEntries,
  };
}

// ============== Invoices ==============
export function demoInvoices(): (Invoice & { employer: { name: string; billing_email: string | null } })[] {
  return [
    {
      id: "inv-1",
      invoice_number: "INV-01001",
      employer_id: ID.emp.sunbelt,
      period_start: dateAddDays(new Date(), -28),
      period_end: dateAddDays(new Date(), -22),
      subtotal: 168000,
      tax: 0,
      total: 168000,
      status: "paid",
      due_date: dateAddDays(new Date(), 8),
      sent_at: isoDaysAgo(21),
      paid_at: isoDaysAgo(5),
      pdf_url: null,
      notes: null,
      created_at: isoDaysAgo(21),
      employer: { name: "Sunbelt Industrial Group", billing_email: "ap@sunbeltindustrial.example" },
    },
    {
      id: "inv-2",
      invoice_number: "INV-01002",
      employer_id: ID.emp.hilton,
      period_start: dateAddDays(new Date(), -21),
      period_end: dateAddDays(new Date(), -15),
      subtotal: 14_000,
      tax: 0,
      total: 14_000,
      status: "paid",
      due_date: dateAddDays(new Date(), -1),
      sent_at: isoDaysAgo(14),
      paid_at: isoDaysAgo(2),
      pdf_url: null,
      notes: null,
      created_at: isoDaysAgo(14),
      employer: { name: "Hilton Orlando", billing_email: "ap@hiltonorlando.example" },
    },
    {
      id: "inv-3",
      invoice_number: "INV-01003",
      employer_id: ID.emp.sunbelt,
      period_start: dateAddDays(new Date(), -14),
      period_end: dateAddDays(new Date(), -8),
      subtotal: 152_000,
      tax: 0,
      total: 152_000,
      status: "sent",
      due_date: dateAddDays(new Date(), 22),
      sent_at: isoDaysAgo(7),
      paid_at: null,
      pdf_url: null,
      notes: null,
      created_at: isoDaysAgo(7),
      employer: { name: "Sunbelt Industrial Group", billing_email: "ap@sunbeltindustrial.example" },
    },
    {
      id: "inv-4",
      invoice_number: "INV-01004",
      employer_id: ID.emp.sunbelt,
      period_start: dateAddDays(new Date(), -7),
      period_end: dateAddDays(new Date(), -1),
      subtotal: 168_000,
      tax: 0,
      total: 168_000,
      status: "draft",
      due_date: dateAddDays(new Date(), 29),
      sent_at: null,
      paid_at: null,
      pdf_url: null,
      notes: null,
      created_at: isoDaysAgo(1),
      employer: { name: "Sunbelt Industrial Group", billing_email: "ap@sunbeltindustrial.example" },
    },
  ];
}

// ============== Time entries (recent for timesheet view) ==============
export function demoTimeEntries(opts: { limit?: number } = {}): (TimeEntry & {
  worker: { full_name: string; employee_code: string | null } | null;
  placement: { role_title: string; employer: { name: string } | null } | null;
})[] {
  const limit = opts.limit ?? 50;
  return Array.from({ length: limit }).map((_, i) => {
    const w = demoWorkers()[i % 100];
    const hours = 8;
    const clockIn = new Date(Date.now() - (i + 1) * 7 * 3600 * 1000);
    const clockOut = new Date(clockIn.getTime() + hours * 3600 * 1000);
    return {
      id: `te-${i}`,
      shift_id: null,
      worker_id: w.id,
      placement_id: `placement-${(i % 100) + 1}`,
      clock_in_at: clockIn.toISOString(),
      clock_out_at: i % 13 === 0 ? null : clockOut.toISOString(),
      break_minutes: 0,
      hours_worked: i % 13 === 0 ? null : hours,
      pay_rate_at_entry: 15,
      bill_rate_at_entry: 25,
      approved: i > 6 && i % 13 !== 0,
      approved_by: null,
      approved_at: null,
      location: i % 4 === 0 ? `29.39${i % 10},-94.95${(i + 7) % 10}` : null,
      notes: null,
      created_at: clockIn.toISOString(),
      worker: { full_name: w.full_name, employee_code: w.employee_code },
      placement: {
        role_title: PROJECT_ROLES[i % PROJECT_ROLES.length],
        employer: { name: "Sunbelt Industrial Group" },
      },
    };
  });
}

// ============== Payments ==============
export function demoPayments(): Payment[] {
  const out: Payment[] = [];
  // In from paid invoices
  out.push({
    id: "pay-1",
    direction: "in",
    invoice_id: "inv-1",
    worker_id: null,
    amount: 168000,
    method: "ach",
    reference: "ACH-INV-01001",
    occurred_at: isoDaysAgo(5),
    notes: null,
    created_at: isoDaysAgo(5),
  });
  out.push({
    id: "pay-2",
    direction: "in",
    invoice_id: "inv-2",
    worker_id: null,
    amount: 14000,
    method: "ach",
    reference: "ACH-INV-01002",
    occurred_at: isoDaysAgo(2),
    notes: null,
    created_at: isoDaysAgo(2),
  });
  // Outbound payroll to a sample of workers
  for (let i = 1; i <= 12; i++) {
    out.push({
      id: `pay-out-${i}`,
      direction: "out",
      invoice_id: null,
      worker_id: `worker-${String(i).padStart(3, "0")}`,
      amount: 600,
      method: i % 3 === 0 ? "check" : "ach",
      reference: `PAYROLL-${dateAddDays(new Date(), -7)}`,
      occurred_at: isoDaysAgo(3),
      notes: null,
      created_at: isoDaysAgo(3),
    });
  }
  return out;
}

// ============== Reports ==============
export function demoReports() {
  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    // Ramping revenue: month 0 = $40k margin, month 5 = $80k margin (today)
    const margin = 40000 + i * 8000;
    const cost = margin * 1.5;
    const revenue = cost + margin;
    return {
      month: key,
      revenue: Math.round(revenue),
      cost: Math.round(cost),
      margin: Math.round(margin),
      hours: Math.round(revenue / 25),
    };
  });
  const total = monthly.reduce(
    (a, m) => ({
      hours: a.hours + m.hours,
      revenue: a.revenue + m.revenue,
      cost: a.cost + m.cost,
      margin: a.margin + m.margin,
    }),
    { hours: 0, revenue: 0, cost: 0, margin: 0 },
  );
  return {
    monthly,
    byEmployer: [
      { employer: "Sunbelt Industrial Group", hours: 24000, revenue: 600000, cost: 360000, margin: 240000 },
      { employer: "Hilton Orlando", hours: 2240, revenue: 56000, cost: 33600, margin: 22400 },
      { employer: "ClearWave Facility Services", hours: 1680, revenue: 42000, cost: 26880, margin: 15120 },
      { employer: "Westlake Builders", hours: 880, revenue: 22000, cost: 15840, margin: 6160 },
    ],
    byWorker: demoWorkers().slice(0, 25).map((w, i) => ({
      worker: w.full_name,
      hours: 240 - (i * 4) % 60,
      pay: (240 - (i * 4) % 60) * 15,
    })),
    totals: total,
  };
}

// ============== Payroll ==============
export function demoPayroll() {
  const periodEnd = new Date();
  const day = periodEnd.getDay();
  periodEnd.setDate(periodEnd.getDate() - (day === 0 ? 7 : day));
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodEnd.getDate() - 6);

  const rows = demoWorkers().slice(0, 130).map((w, i) => {
    const hours = 32 + ((i * 7) % 16); // 32-48 hrs per week
    const grossPay = hours * 15;
    return {
      workerId: w.id,
      workerName: w.full_name,
      employeeCode: w.employee_code,
      paymentMethod: w.payment_method,
      hours,
      grossPay,
      alreadyPaid: i < 80,
      paymentId: i < 80 ? `pay-payroll-${i}` : null,
      rateBreakdown: [{ rate: 15, hours }],
    };
  });

  const totals = rows.reduce(
    (a, r) => {
      a.hours += r.hours;
      a.grossPay += r.grossPay;
      if (!r.alreadyPaid) {
        a.unpaidPay += r.grossPay;
        a.unpaidCount += 1;
      }
      return a;
    },
    { hours: 0, grossPay: 0, unpaidPay: 0, unpaidCount: 0 },
  );

  return {
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    rows,
    totals,
  };
}

// ============== Helper ==============
export function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
