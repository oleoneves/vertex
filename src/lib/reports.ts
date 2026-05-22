import "server-only";
import { getSupabaseServer } from "./supabase/server";
import { isDemoMode, demoReports } from "./demo";

export type MonthlyReport = {
  month: string;
  revenue: number;
  cost: number;
  margin: number;
  hours: number;
};

export type ByEmployerRow = {
  employer: string;
  hours: number;
  revenue: number;
  cost: number;
  margin: number;
};

export type ByWorkerRow = {
  worker: string;
  hours: number;
  pay: number;
  revenue: number;
  margin: number;
};

export type ByProjectManagerRow = {
  project_manager: string;
  employer: string;
  invoice_count: number;
  revenue: number;
  cost: number;
  margin: number;
};

export type ReportsData = {
  monthly: MonthlyReport[];
  byEmployer: ByEmployerRow[];
  byWorker: ByWorkerRow[];
  byProjectManager: ByProjectManagerRow[];
  totals: { hours: number; revenue: number; cost: number; margin: number };
};

function emptyReport(): ReportsData {
  return {
    monthly: [],
    byEmployer: [],
    byWorker: [],
    byProjectManager: [],
    totals: { hours: 0, revenue: 0, cost: 0, margin: 0 },
  };
}

export async function loadReports(opts: { months?: number } = {}): Promise<ReportsData> {
  if (isDemoMode()) {
    return demoReports() as ReportsData;
  }

  const months = opts.months ?? 6;
  const supabase = await getSupabaseServer();
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data: entries } = await supabase
    .from("time_entries")
    .select(
      "hours_worked, pay_rate_at_entry, bill_rate_at_entry, clock_in_at, worker:workers(full_name), placement:placements!inner(employer:employers(name))",
    )
    .eq("approved", true)
    .gte("clock_in_at", since.toISOString())
    .order("clock_in_at", { ascending: false })
    .limit(10000);

  type Row = {
    hours_worked: number | null;
    pay_rate_at_entry: number | null;
    bill_rate_at_entry: number | null;
    clock_in_at: string;
    worker: { full_name: string } | null;
    placement: { employer: { name: string } | null } | null;
  };

  const rows = ((entries as unknown as Row[]) ?? []).map((r) => ({
    hrs: Number(r.hours_worked) || 0,
    pay: Number(r.pay_rate_at_entry) || 0,
    bill: Number(r.bill_rate_at_entry) || 0,
    when: new Date(r.clock_in_at),
    worker: r.worker?.full_name ?? "—",
    employer: r.placement?.employer?.name ?? "—",
  }));

  // Monthly bucket
  const monthMap = new Map<string, MonthlyReport>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { month: key, revenue: 0, cost: 0, margin: 0, hours: 0 });
  }
  for (const r of rows) {
    const key = `${r.when.getFullYear()}-${String(r.when.getMonth() + 1).padStart(2, "0")}`;
    const m = monthMap.get(key);
    if (!m) continue;
    m.hours += r.hrs;
    m.revenue += r.hrs * r.bill;
    m.cost += r.hrs * r.pay;
    m.margin = m.revenue - m.cost;
  }

  // By employer
  const empMap = new Map<string, ByEmployerRow>();
  for (const r of rows) {
    let e = empMap.get(r.employer);
    if (!e) {
      e = { employer: r.employer, hours: 0, revenue: 0, cost: 0, margin: 0 };
      empMap.set(r.employer, e);
    }
    e.hours += r.hrs;
    e.revenue += r.hrs * r.bill;
    e.cost += r.hrs * r.pay;
    e.margin = e.revenue - e.cost;
  }

  // By worker
  const wkMap = new Map<string, ByWorkerRow>();
  for (const r of rows) {
    let w = wkMap.get(r.worker);
    if (!w) {
      w = { worker: r.worker, hours: 0, pay: 0, revenue: 0, margin: 0 };
      wkMap.set(r.worker, w);
    }
    w.hours += r.hrs;
    w.pay += r.hrs * r.pay;
    w.revenue += r.hrs * r.bill;
    w.margin = w.revenue - w.pay;
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.hours += r.hrs;
      acc.revenue += r.hrs * r.bill;
      acc.cost += r.hrs * r.pay;
      acc.margin = acc.revenue - acc.cost;
      return acc;
    },
    { hours: 0, revenue: 0, cost: 0, margin: 0 },
  );

  // Project managers (from invoices in the same window, status != void)
  // Cost per invoice is estimated as invoice.total × (employer.cost / employer.revenue) using the byEmployer rollup.
  type InvRow = {
    project_manager: string | null;
    total: number | string;
    employer: { name: string } | null;
  };
  const { data: invsRaw } = await supabase
    .from("invoices")
    .select("project_manager, total, employer:employers(name)")
    .neq("status", "void")
    .gte("period_start", since.toISOString().slice(0, 10))
    .order("period_start", { ascending: false })
    .limit(5000);
  const pmMap = new Map<string, ByProjectManagerRow>();
  for (const inv of ((invsRaw as unknown as InvRow[]) ?? [])) {
    if (!inv.project_manager) continue;
    const employer = inv.employer?.name ?? "—";
    const empAgg = empMap.get(employer);
    const costRatio =
      empAgg && empAgg.revenue > 0 ? empAgg.cost / empAgg.revenue : 0.6; // 60% cost as fallback
    const invTotal = Number(inv.total ?? 0);
    const invCost = invTotal * costRatio;
    const key = `${employer}|${inv.project_manager}`;
    const row = pmMap.get(key) ?? {
      project_manager: inv.project_manager,
      employer,
      invoice_count: 0,
      revenue: 0,
      cost: 0,
      margin: 0,
    };
    row.invoice_count += 1;
    row.revenue += invTotal;
    row.cost += invCost;
    row.margin = row.revenue - row.cost;
    pmMap.set(key, row);
  }

  return {
    monthly: Array.from(monthMap.values()),
    byEmployer: Array.from(empMap.values()).sort((a, b) => b.revenue - a.revenue),
    byWorker: Array.from(wkMap.values()).sort((a, b) => b.hours - a.hours).slice(0, 25),
    byProjectManager: Array.from(pmMap.values()).sort((a, b) => b.revenue - a.revenue),
    totals,
  };
}
