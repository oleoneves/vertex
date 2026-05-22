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
  WorkerDocument,
  DocumentType,
  DocumentStatus,
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
    restoration: "emp-restoration",
  },
  project: "proj-sunbelt",
  projectRestoration: "proj-restoration",
};

const RESTORATION_ROLES = [
  "Water Extraction Tech",
  "Mold Remediation Tech",
  "Structural Drying Tech",
  "Content Cleaning",
  "Demolition Crew",
  "Carpet & Floor Tech",
  "Board-Up Crew",
  "Restoration Helper",
];

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
    zelle_full_name: null,
    ssn: null,
    w9_document_id: null,
    notes: null,
    created_at: isoDaysAgo(40 + (n % 30)),
    // Rating distribution: ~70% 4.5-5.0, ~20% 3.5-4.5, ~10% under
    rating: opts.onboarding
      ? null
      : Math.round((3.0 + ((n * 7) % 21) / 10) * 10) / 10,
    ratings_count: opts.onboarding ? 0 : 3 + (n % 17),
    is_favorite: !opts.onboarding && n % 11 === 0,
    no_show_count: n % 19 === 0 ? 1 + (n % 3) : 0,
  };
}

export function demoWorkers(): Worker[] {
  return Array.from({ length: 200 }, (_, i) => makeWorker(i + 1, { onboarding: i >= 190 }));
}

// Workers grouped by US state (derived deterministically from worker_id).
const WORKER_STATES = [
  "TX", "FL", "CA", "TX", "TX", "FL", "GA", "TX", "CA", "FL",
  "AZ", "NC", "TX", "FL", "TX", "GA", "TX", "FL", "NY", "CA",
];

export function workerStateFor(workerId: string): string {
  const n = Number(workerId.slice(-3)) || 0;
  return WORKER_STATES[n % WORKER_STATES.length];
}

export function demoWorkersByState(): { state: string; count: number }[] {
  const map = new Map<string, number>();
  for (const w of demoWorkers()) {
    const s = workerStateFor(w.id);
    map.set(s, (map.get(s) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
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
      hourly_bill_rate: null,
      per_diem_rate: null,
      travel_time_rate: null,
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
      hourly_bill_rate: null,
      per_diem_rate: null,
      travel_time_rate: null,
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
      hourly_bill_rate: null,
      per_diem_rate: null,
      travel_time_rate: null,
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
      hourly_bill_rate: null,
      per_diem_rate: null,
      travel_time_rate: null,
      payment_terms_days: 30,
      notes: null,
      created_at: isoDaysAgo(40),
    },
    {
      id: ID.emp.restoration,
      name: "Restoration Pro USA",
      contact_name: "Daniela Cardoso",
      billing_email: "ap@restorationprousa.example",
      billing_address: "2400 Tampa Bay Blvd\nTampa, FL 33606",
      bill_rate_multiplier: 1.67,
      hourly_bill_rate: null,
      per_diem_rate: null,
      travel_time_rate: null,
      payment_terms_days: 15,
      notes: "Disaster restoration franchise — 24/7 emergency response.",
      created_at: isoDaysAgo(30),
    },
  ];
}

// ============== Projects ==============
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
    {
      id: ID.projectRestoration,
      employer_id: ID.emp.restoration,
      name: "Hurricane Recovery — Tampa Bay",
      slug: "hurricane-recovery-tampa-bay",
      location: "Tampa Bay region · multi-site",
      start_date: dateAddDays(new Date(), -15),
      end_date: dateAddDays(new Date(), 45),
      budget_hours: 30000,
      budget_amount: 750000,
      status: "active",
      notes: "Emergency restoration following hurricane impact. 24/7 response, 7-day-a-week ops.",
      created_at: isoDaysAgo(15),
      employer: { name: "Restoration Pro USA" },
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
  // 50 restoration crew @ Restoration Pro project (workers 131..180)
  for (let i = 0; i < 50; i++) {
    const wn = 131 + i;
    out.push({
      id: `placement-r${i}`,
      worker_id: `worker-${String(wn).padStart(3, "0")}`,
      employer_id: ID.emp.restoration,
      project_id: ID.projectRestoration,
      job_id: null,
      role_title: RESTORATION_ROLES[i % RESTORATION_ROLES.length],
      pay_rate: 15,
      bill_rate: 25,
      start_date: dateAddDays(new Date(), -15),
      end_date: null,
      status: "active",
      notes: "Hurricane Recovery · Tampa Bay",
      created_at: isoDaysAgo(15),
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
      {
        id: ID.projectRestoration,
        name: "Hurricane Recovery — Tampa Bay",
        employer: "Restoration Pro USA",
        activeWorkers: 50,
        hours: 6000,
        revenue: 150000,
        margin: 60000,
        budgetAmount: 750000,
        budgetPct: Math.round((150000 / 750000) * 100),
      },
    ],
    hoursByDay,
    topEmployers: [
      { name: "Sunbelt Industrial Group", revenue: 600000 },
      { name: "Restoration Pro USA", revenue: 150000 },
      { name: "Hilton Orlando", revenue: 56000 },
      { name: "ClearWave Facility Services", revenue: 42000 },
      { name: "Westlake Builders", revenue: 22000 },
    ],
    topWorkers: demoWorkers().slice(0, 5).map((w) => ({
      name: w.full_name,
      hours: 240 - (Number(w.id.slice(-3)) % 6) * 8,
    })),
    recentActivity: recentActivitySample(),
    revenueByDay30: revenueSeriesByDay(30),
    revenueForecast14: revenueForecastSeries(30, 14),
    marginByDay30: marginSeriesByDay(30),
    applicationsByDay14: applicationsSeriesByDay(14),
    monthlyRevenue: monthlyRevenueSeries(6),
    workersByStatus: { active: 190, onboarding: 10, inactive: 0 },
    prevPeriod: {
      // Previous period values for delta calc (mock realistic prior numbers)
      revenueMtd: 196_000, // current 218,400 → +11.4%
      marginThisWeek: 5_200 * 9.2, // current 52,000 → +8.7%
      outstanding: 168_000, // current 152,000 → −9.5%
      applications24h: 5, // current 7 → +40%
      activeWorkers: 184, // current 190 → +3.3%
      activePlacements: 122, // current 130 → +6.6%
      openJobs: 11, // current 14 → +27%
      pendingTimesheets: 92, // current 86 → −6.5%
    },
  };
}

function revenueForecastSeries(
  actualDays: number,
  forecastDays: number,
): { date: string; label: string; value: number }[] {
  // Simple linear-trend forecast: take the last 14 actual days, fit a slope,
  // project forward with weekend dips preserved.
  const actual = revenueSeriesByDay(actualDays);
  const tail = actual.slice(-14);
  const avg = tail.reduce((s, d) => s + d.value, 0) / tail.length;
  const first = tail[0].value;
  const last = tail[tail.length - 1].value;
  const slope = (last - first) / (tail.length - 1);

  const now = new Date();
  return Array.from({ length: forecastDays }).map((_, i) => {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() + i + 1);
    const dow = d.getUTCDay();
    const trended = last + slope * (i + 1);
    // Mute weekends to match actual pattern
    const adjusted = dow === 0 || dow === 6 ? trended * 0.18 : trended;
    // Add slight noise to avoid a perfectly straight line
    const noise = 1 + ((i * 19) % 12 - 6) / 100;
    return {
      date: d.toISOString().slice(0, 10),
      label: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()]} ${d.getUTCDate()}`,
      value: Math.max(0, Math.round(Math.max(adjusted, avg * 0.2) * noise)),
    };
  });
}

function dateLabel(d: Date): string {
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function revenueSeriesByDay(days: number): { date: string; label: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - (days - 1 - i));
    const dow = d.getUTCDay();
    // Weekday baseline ~$8500, weekend ~$1500; sprinkle some variance
    const base = dow === 0 || dow === 6 ? 1500 : 8500;
    const variance = 1 + ((i * 37) % 30 - 15) / 100;
    return {
      date: d.toISOString().slice(0, 10),
      label: dateLabel(d),
      value: Math.round(base * variance),
    };
  });
}

function marginSeriesByDay(days: number): { date: string; label: string; value: number }[] {
  return revenueSeriesByDay(days).map((d) => ({
    ...d,
    value: Math.round(d.value * 0.4),
  }));
}

function applicationsSeriesByDay(days: number): { date: string; label: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - (days - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      label: dateLabel(d),
      value: ((i * 13) % 5) + (i % 3 === 0 ? 2 : 0),
    };
  });
}

function monthlyRevenueSeries(
  months: number,
): { month: string; label: string; revenue: number; cost: number; margin: number }[] {
  const now = new Date();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return Array.from({ length: months }).map((_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
    // Growth trend: ~$120k → $220k
    const factor = 1 + (i / (months - 1)) * 0.85;
    const revenue = Math.round(120_000 * factor);
    const cost = Math.round(revenue * 0.6);
    const margin = revenue - cost;
    return {
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`,
      revenue,
      cost,
      margin,
    };
  });
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
  const isSunbelt = id === ID.project;
  const isRestoration = id === ID.projectRestoration;
  if (!isSunbelt && !isRestoration) return null;

  const projects = demoProjects();
  const project = isSunbelt ? projects[0] : projects[1];
  const employers = demoEmployers();
  const employer = isSunbelt
    ? employers[0]
    : employers.find((e) => e.id === ID.emp.restoration)!;

  const projectId = isSunbelt ? ID.project : ID.projectRestoration;
  const roles = isSunbelt ? PROJECT_ROLES : RESTORATION_ROLES;
  const workerCount = isSunbelt ? 100 : 50;
  const dailyHours = workerCount * 8;
  const totalHours = isSunbelt ? 24000 : 6000;
  const cost = totalHours * 15;
  const revenue = totalHours * 25;

  const placements = demoPlacements()
    .filter((p) => p.project_id === projectId)
    .map((p) => ({
      ...p,
      worker: demoWorkers().find((w) => w.id === p.worker_id) ?? null,
    }));

  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      day: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      hours: dailyHours,
    };
  });

  const headcountPerRole = Math.floor(workerCount / roles.length);
  const remainder = workerCount % roles.length;
  const roleRows = roles
    .map((role, i) => {
      const count = i < remainder ? headcountPerRole + 1 : headcountPerRole;
      return {
        role,
        hours: count * 8 * (isSunbelt ? 30 : 15),
        headcount: count,
      };
    })
    .sort((a, b) => b.hours - a.hours);

  const recentEntries = Array.from({ length: 10 }).map((_, i) => {
    const baseWorkerIdx = isSunbelt ? i + 4 : i + 134;
    const w = demoWorkers()[baseWorkerIdx % 200];
    return {
      id: `re-${projectId}-${i}`,
      hours_worked: 8,
      pay_rate_at_entry: 15,
      bill_rate_at_entry: 25,
      clock_in_at: new Date(Date.now() - (i + 1) * 12 * 3600 * 1000).toISOString(),
      clock_out_at: new Date(Date.now() - (i + 1) * 4 * 3600 * 1000).toISOString(),
      approved: i > 2,
      placement: { project_id: projectId, role_title: roles[i % roles.length] },
      worker: { full_name: w.full_name },
    };
  });

  return {
    project: { ...project, employer },
    placements,
    activeWorkers: workerCount,
    totalWorkers: workerCount,
    totals: {
      hours: totalHours,
      cost,
      revenue,
      margin: revenue - cost,
      pendingHours: isSunbelt ? 0 : 320,
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

// ============== Invoice detail (lines + employer) ==============
export type DemoInvoiceDetail = Invoice & {
  employer: {
    name: string;
    billing_email: string | null;
    billing_address: string | null;
    contact_name: string | null;
    payment_terms_days: number;
  } | null;
  lines: (InvoiceLineItem & { worker: { full_name: string } | null })[];
};

export function demoInvoiceDetail(id: string): DemoInvoiceDetail | null {
  const inv = demoInvoices().find((i) => i.id === id);
  if (!inv) return null;
  const employer = demoEmployers().find((e) => e.id === inv.employer_id);

  const billRate = inv.employer_id === ID.emp.clearwave ? 26 : 25;
  const subtotal = Number(inv.subtotal);

  // Service mix by employer:
  // - Remote/large projects (Sunbelt, Restoration) → labor + travel + per diem
  // - Local clients (Hilton, ClearWave, Westlake) → labor only (no travel/per diem)
  const remoteEmployers = new Set<string>([ID.emp.sunbelt, ID.emp.restoration]);
  const isRemote = remoteEmployers.has(inv.employer_id);

  const lines: (InvoiceLineItem & { worker: { full_name: string } | null })[] = [];
  const periodLabel = `${inv.period_start} → ${inv.period_end}`;

  if (isRemote) {
    // 85% labor, 5% travel time, 10% per diem
    const laborAmount = Math.round(subtotal * 0.85 * 100) / 100;
    const travelAmount = Math.round(subtotal * 0.05 * 100) / 100;
    const perDiemAmount = Math.round((subtotal - laborAmount - travelAmount) * 100) / 100;

    const laborHours = Math.round((laborAmount / billRate) * 100) / 100;
    const travelHours = Math.round((travelAmount / billRate) * 100) / 100;
    const perDiemDays = Math.round(perDiemAmount / 24);
    const perDiemRate = perDiemDays > 0 ? Math.round((perDiemAmount / perDiemDays) * 100) / 100 : 0;

    lines.push({
      id: `${inv.id}-line-labor`,
      invoice_id: inv.id,
      worker_id: "",
      placement_id: null,
      description: `Labor services — week of ${periodLabel}`,
      hours: laborHours,
      rate: billRate,
      amount: laborAmount,
      worker: null,
    });
    lines.push({
      id: `${inv.id}-line-travel`,
      invoice_id: inv.id,
      worker_id: "",
      placement_id: null,
      description: `Travel time — round trip to/from job site`,
      hours: travelHours,
      rate: billRate,
      amount: travelAmount,
      worker: null,
    });
    lines.push({
      id: `${inv.id}-line-per-diem`,
      invoice_id: inv.id,
      worker_id: "",
      placement_id: null,
      description: `Per diem — meals & lodging (${perDiemDays} person-days)`,
      hours: perDiemDays,
      rate: perDiemRate,
      amount: perDiemAmount,
      worker: null,
    });
  } else {
    // Local jobs: single labor line
    const hours = Math.round((subtotal / billRate) * 100) / 100;
    lines.push({
      id: `${inv.id}-line-labor`,
      invoice_id: inv.id,
      worker_id: "",
      placement_id: null,
      description: `Labor services — week of ${periodLabel}`,
      hours,
      rate: billRate,
      amount: subtotal,
      worker: null,
    });
  }

  return {
    ...inv,
    employer: employer
      ? {
          name: employer.name,
          billing_email: employer.billing_email,
          billing_address: employer.billing_address,
          contact_name: employer.contact_name,
          payment_terms_days: employer.payment_terms_days,
        }
      : null,
    lines,
  };
}

export function demoInvoicePayments(invoiceId: string): Payment[] {
  return demoPayments().filter((p) => p.invoice_id === invoiceId);
}

// ============== Live Shift Board ==============
export type LiveShiftEntry = {
  id: string;
  worker: string;
  role: string;
  employer: string;
  project: string | null;
  location: string | null;
  scheduledStart: string;
  status: "scheduled" | "en_route" | "on_site" | "completed";
  clockInAt: string | null;
  clockOutAt: string | null;
  hours: number | null;
  // Optional crew leader flag for restoration
  isCrewLead?: boolean;
};

export function demoLiveBoard(): LiveShiftEntry[] {
  const now = Date.now();
  const workers = demoWorkers();
  const roles = [
    "Water Damage Tech",
    "Mold Remediation Tech",
    "Fire/Smoke Tech",
    "Storm Recovery Crew",
    "Carpentry Lead",
    "Drywall Tech",
    "Equipment Operator",
    "Cleaning Tech",
  ];
  const employers = [
    { name: "Restoration Pro USA", project: "Hurricane Recovery — Tampa Bay" },
    { name: "Restoration Pro USA", project: "Water damage — Orlando Suites" },
    { name: "Sunbelt Industrial Group", project: "Sunbelt Refinery Expansion" },
    { name: "Hilton Orlando", project: null },
    { name: "ClearWave Facility Services", project: null },
  ];
  const sites = [
    "Tampa, FL",
    "Galveston, TX",
    "Orlando, FL",
    "St. Petersburg, FL",
    "Clearwater, FL",
    "Houston, TX",
    "Austin, TX",
  ];

  const out: LiveShiftEntry[] = [];

  // 1. SCHEDULED (start in next 0-4h, not clocked in yet)
  for (let i = 0; i < 8; i++) {
    const w = workers[(i * 13 + 1) % 200];
    const e = employers[i % employers.length];
    const minutesFromNow = 15 + (i * 37) % 240;
    const start = new Date(now + minutesFromNow * 60000);
    out.push({
      id: `live-sch-${i}`,
      worker: w.full_name,
      role: roles[i % roles.length],
      employer: e.name,
      project: e.project,
      location: sites[(i + 1) % sites.length],
      scheduledStart: start.toISOString(),
      status: "scheduled",
      clockInAt: null,
      clockOutAt: null,
      hours: null,
      isCrewLead: i % 5 === 0,
    });
  }

  // 2. EN_ROUTE (start in next 0-90 min, location captured but not clocked in)
  for (let i = 0; i < 4; i++) {
    const w = workers[(i * 19 + 50) % 200];
    const e = employers[(i + 1) % employers.length];
    const start = new Date(now + (5 + i * 18) * 60000);
    out.push({
      id: `live-enr-${i}`,
      worker: w.full_name,
      role: roles[(i + 3) % roles.length],
      employer: e.name,
      project: e.project,
      location: sites[(i + 2) % sites.length],
      scheduledStart: start.toISOString(),
      status: "en_route",
      clockInAt: null,
      clockOutAt: null,
      hours: null,
      isCrewLead: i === 0,
    });
  }

  // 3. ON_SITE (clocked in, no clock-out)
  for (let i = 0; i < 14; i++) {
    const w = workers[(i * 7 + 100) % 200];
    const e = employers[i % employers.length];
    const minsAgo = 5 + (i * 23) % 360;
    const clockIn = new Date(now - minsAgo * 60000);
    out.push({
      id: `live-ons-${i}`,
      worker: w.full_name,
      role: roles[(i + 2) % roles.length],
      employer: e.name,
      project: e.project,
      location: sites[(i + 3) % sites.length],
      scheduledStart: new Date(clockIn.getTime() - 5 * 60000).toISOString(),
      status: "on_site",
      clockInAt: clockIn.toISOString(),
      clockOutAt: null,
      hours: null,
      isCrewLead: i % 7 === 0,
    });
  }

  // 4. COMPLETED today (clocked out earlier today)
  for (let i = 0; i < 12; i++) {
    const w = workers[(i * 11 + 150) % 200];
    const e = employers[(i + 2) % employers.length];
    const hoursAgo = 1 + (i * 7) % 8;
    const clockOut = new Date(now - hoursAgo * 3600 * 1000);
    const shiftHours = 6 + (i % 3);
    const clockIn = new Date(clockOut.getTime() - shiftHours * 3600 * 1000);
    out.push({
      id: `live-cpl-${i}`,
      worker: w.full_name,
      role: roles[(i + 4) % roles.length],
      employer: e.name,
      project: e.project,
      location: sites[i % sites.length],
      scheduledStart: clockIn.toISOString(),
      status: "completed",
      clockInAt: clockIn.toISOString(),
      clockOutAt: clockOut.toISOString(),
      hours: shiftHours,
    });
  }

  return out;
}

// ============== Applications ==============
export function demoApplications(): Array<{
  id: string;
  status: "new" | "reviewing" | "accepted" | "rejected";
  ai_score: number | null;
  ai_summary: string | null;
  experience_summary: string | null;
  created_at: string;
  candidate: { full_name: string; email: string } | null;
  job: { title: string; slug: string } | null;
}> {
  const jobs = [
    { title: "General Laborer", slug: "general-laborer" },
    { title: "Welder Helper", slug: "welder-helper" },
    { title: "Pipefitter Helper", slug: "pipefitter-helper" },
    { title: "Painter", slug: "painter" },
    { title: "Housekeeper", slug: "housekeeper" },
    { title: "Construction Laborer", slug: "construction-laborer" },
    { title: "Scaffolder", slug: "scaffolder" },
    { title: "Night Janitor", slug: "night-janitor" },
  ];
  const summaries = [
    "5 years industrial maintenance, OSHA-10",
    "Recent grad, construction experience",
    "8 years welding, structural steel",
    "Hotel housekeeping 3 years",
    "First-time applicant, eager to learn",
    "Painter w/ commercial experience",
    "Hospitality cleaning + OSHA-10",
    "Industrial scaffolding 6 years",
  ];
  const workers = demoWorkers();
  // ~40 applications across statuses, weighted toward "new" and "reviewing"
  const statuses: Array<"new" | "reviewing" | "accepted" | "rejected"> = [
    "new", "new", "new", "new", "new", "new", "new", "new", "new", "new", "new", "new", "new", "new", "new",
    "reviewing", "reviewing", "reviewing", "reviewing", "reviewing", "reviewing", "reviewing", "reviewing", "reviewing",
    "reviewing", "reviewing", "reviewing",
    "accepted", "accepted", "accepted", "accepted", "accepted", "accepted",
    "rejected", "rejected", "rejected", "rejected",
  ];

  return statuses.map((status, i) => {
    const w = workers[(i * 17) % workers.length];
    const job = jobs[i % jobs.length];
    const summary = summaries[i % summaries.length];
    const score = status === "accepted" ? 75 + (i % 25) : status === "rejected" ? 20 + (i % 30) : 40 + ((i * 7) % 50);
    const hoursAgo = (i + 1) * 3.5;
    return {
      id: `app-${i + 1}`,
      status,
      ai_score: score,
      ai_summary: `${summary}. Match: ${score}/100.`,
      experience_summary: summary,
      created_at: new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString(),
      candidate: {
        full_name: w.full_name,
        email: `${w.full_name.toLowerCase().replace(/\s+/g, ".")}.${i}@example.com`,
      },
      job,
    };
  });
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

// ============== Demo worker (Carlos Mendoza, W-D001) ==============
export function demoCurrentWorker(): Worker {
  return demoWorkers()[0];
}

export function demoWorkerWeek() {
  const worker = demoCurrentWorker();
  const placements = demoPlacements().filter((p) => p.worker_id === worker.id);
  const shifts = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      id: `w-shift-${i}`,
      placement_id: placements[0]?.id ?? "placement-1",
      scheduled_start: new Date(d.setHours(7, 0, 0, 0)).toISOString(),
      scheduled_end: new Date(d.setHours(15, 0, 0, 0)).toISOString(),
      status: i === 0 ? "scheduled" : "completed",
      location: "Sunbelt Refinery · Galveston, TX",
      notes: null,
      created_at: new Date().toISOString(),
      placement: {
        role_title: placements[0]?.role_title ?? "Welder Helper",
        worker: { full_name: worker.full_name },
        employer: { name: "Sunbelt Industrial Group" },
      },
    };
  });
  return {
    shifts,
    entries: [],
    hours: 32,
  };
}

export function demoWorkerPaystubs() {
  return Array.from({ length: 4 }).map((_, i) => {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - ((i + 1) * 7));
    const day = periodStart.getDay();
    const mondayOffset = day === 0 ? 6 : day - 1;
    periodStart.setDate(periodStart.getDate() - mondayOffset);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);
    return {
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      hours: 40,
      gross: 600,
      paidAt: i > 0 ? isoDaysAgo(i * 7 - 1) : null,
    };
  });
}

export function demoWorkerPaystubDetail(periodStart: string) {
  const worker = demoCurrentWorker();
  const start = new Date(periodStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const lines = Array.from({ length: 5 }).map((_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return {
      date: day.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      placement: "Sunbelt Industrial Group — Welder Helper",
      hours: 8,
      rate: 15,
      amount: 120,
    };
  });
  return {
    worker: {
      full_name: worker.full_name,
      employee_code: worker.employee_code,
      payment_method: worker.payment_method,
    },
    periodStart,
    periodEnd: end.toISOString().slice(0, 10),
    lines,
    totals: { hours: 40, gross: 600 },
    paid: {
      at: isoDaysAgo(1),
      method: "ach",
      reference: `PAYROLL-${periodStart}`,
    },
  };
}

// ============== Documents demo ==============

const DOC_SAMPLES: { type: DocumentType; status: DocumentStatus; filename: string; daysAgo: number }[] = [
  { type: "i9", status: "approved", filename: "i9-form.pdf", daysAgo: 28 },
  { type: "w9", status: "approved", filename: "w9.pdf", daysAgo: 27 },
  { type: "drivers_license", status: "approved", filename: "license.jpg", daysAgo: 27 },
  { type: "ssn_card", status: "pending", filename: "ssn.jpg", daysAgo: 2 },
  { type: "osha10", status: "approved", filename: "osha-10-cert.pdf", daysAgo: 15 },
];

export function demoWorkerDocuments(workerId?: string): WorkerDocument[] {
  const targetId = workerId ?? demoCurrentWorker().id;
  return DOC_SAMPLES.map((d, i) => ({
    id: `doc-${targetId}-${i}`,
    worker_id: targetId,
    type: d.type,
    filename: d.filename,
    storage_path: `${targetId}/${d.type}/${i}.pdf`,
    status: d.status,
    expires_at: null,
    uploaded_at: isoDaysAgo(d.daysAgo),
    reviewed_by: d.status !== "pending" ? "admin-1" : null,
    reviewed_at: d.status !== "pending" ? isoDaysAgo(d.daysAgo - 1) : null,
    notes: null,
  }));
}

// All documents across all workers — for /admin/documents
export function demoAllDocuments() {
  const workers = demoWorkers();
  const out: (WorkerDocument & {
    worker: { id: string; full_name: string; employee_code: string | null } | null;
  })[] = [];
  // 8 pending docs across 8 different workers
  for (let i = 0; i < 8; i++) {
    const w = workers[i * 3];
    out.push({
      id: `adoc-pending-${i}`,
      worker_id: w.id,
      type: ["i9", "w9", "ssn_card", "drivers_license", "osha10"][i % 5] as DocumentType,
      filename: `doc-${i}.pdf`,
      storage_path: `${w.id}/${i}.pdf`,
      status: "pending",
      expires_at: null,
      uploaded_at: isoDaysAgo(i),
      reviewed_by: null,
      reviewed_at: null,
      notes: null,
      worker: { id: w.id, full_name: w.full_name, employee_code: w.employee_code },
    });
  }
  // 12 approved docs across various workers
  for (let i = 0; i < 12; i++) {
    const w = workers[i * 5 + 1];
    out.push({
      id: `adoc-approved-${i}`,
      worker_id: w.id,
      type: ["i9", "w9", "drivers_license", "ssn_card", "osha10", "osha30", "iicrc_wrt"][i % 7] as DocumentType,
      filename: `${["i9", "w9", "license", "ssn", "osha", "cert", "iicrc"][i % 7]}-${i}.pdf`,
      storage_path: `${w.id}/${i}.pdf`,
      status: "approved",
      expires_at: null,
      uploaded_at: isoDaysAgo(20 + i),
      reviewed_by: "admin-1",
      reviewed_at: isoDaysAgo(18 + i),
      notes: null,
      worker: { id: w.id, full_name: w.full_name, employee_code: w.employee_code },
    });
  }
  // 2 rejected
  for (let i = 0; i < 2; i++) {
    const w = workers[i * 11 + 50];
    out.push({
      id: `adoc-rejected-${i}`,
      worker_id: w.id,
      type: "drivers_license",
      filename: `dl-${i}.jpg`,
      storage_path: `${w.id}/dl.jpg`,
      status: "rejected",
      expires_at: null,
      uploaded_at: isoDaysAgo(5 + i),
      reviewed_by: "admin-1",
      reviewed_at: isoDaysAgo(4 + i),
      notes: "Image blurry — please re-upload",
      worker: { id: w.id, full_name: w.full_name, employee_code: w.employee_code },
    });
  }
  return out.sort((a, b) => (a.uploaded_at < b.uploaded_at ? 1 : -1));
}

// ============== Helper ==============
export function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
