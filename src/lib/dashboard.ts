import "server-only";
import { getSupabaseServer } from "./supabase/server";
import { isDemoMode, demoDashboard } from "./demo";

export type DashboardData = {
  revenueMtd: number;
  revenueThisWeek: number;
  marginMtd: number;
  outstanding: number;
  pendingPayoutCents: number;
  marginThisWeek: number;
  activeWorkers: number;
  activePlacements: number;
  openJobs: number;
  hoursThisWeek: number;
  pendingTimesheets: number;
  newApplications24h: number;
  liveOnTheClock: { id: string; worker: string; placement: string; clockInAt: string }[];
  activeProjects: {
    id: string;
    name: string;
    employer: string;
    activeWorkers: number;
    hours: number;
    revenue: number;
    margin: number;
    budgetAmount: number | null;
    budgetPct: number | null;
  }[];
  hoursByDay: { day: string; hours: number }[];
  topEmployers: { name: string; revenue: number }[];
  topWorkers: { name: string; hours: number }[];
  recentActivity: { type: string; label: string; at: string; href?: string }[];
  // Time-series for charts:
  revenueByDay30: { date: string; label: string; value: number }[];
  revenueForecast14: { date: string; label: string; value: number }[];
  marginByDay30: { date: string; label: string; value: number }[];
  applicationsByDay14: { date: string; label: string; value: number }[];
  monthlyRevenue: { month: string; label: string; revenue: number; cost: number; margin: number }[];
  workersByStatus: { active: number; onboarding: number; inactive: number };
  // Period-over-period deltas (previous period absolute values, for delta calc)
  prevPeriod: {
    revenueMtd: number;
    marginThisWeek: number;
    outstanding: number;
    applications24h: number;
    activeWorkers: number;
    activePlacements: number;
    openJobs: number;
    pendingTimesheets: number;
  };
};

export const EMPTY_DASHBOARD: DashboardData = {
  revenueMtd: 0,
  revenueThisWeek: 0,
  marginMtd: 0,
  outstanding: 0,
  pendingPayoutCents: 0,
  marginThisWeek: 0,
  activeWorkers: 0,
  activePlacements: 0,
  openJobs: 0,
  hoursThisWeek: 0,
  pendingTimesheets: 0,
  newApplications24h: 0,
  liveOnTheClock: [],
  activeProjects: [],
  hoursByDay: dayBuckets().map((d) => ({ day: d.label, hours: 0 })),
  topEmployers: [],
  topWorkers: [],
  recentActivity: [],
  revenueByDay30: [],
  revenueForecast14: [],
  marginByDay30: [],
  applicationsByDay14: [],
  monthlyRevenue: [],
  workersByStatus: { active: 0, onboarding: 0, inactive: 0 },
  prevPeriod: {
    revenueMtd: 0,
    marginThisWeek: 0,
    outstanding: 0,
    applications24h: 0,
    activeWorkers: 0,
    activePlacements: 0,
    openJobs: 0,
    pendingTimesheets: 0,
  },
};

function dayBuckets() {
  const now = new Date();
  const day = now.getUTCDay();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
      start: d,
      end: new Date(d.getTime() + 86400000),
    };
  });
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function dateLabel(d: Date): string {
  return `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function trailingDayBuckets(days: number) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - (days - 1 - i));
    return {
      iso: d.toISOString().slice(0, 10),
      label: dateLabel(d),
      start: d,
      end: new Date(d.getTime() + 86400000),
    };
  });
}

function monthBuckets(months: number) {
  const now = new Date();
  return Array.from({ length: months }).map((_, i) => {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1),
    );
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return {
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${MONTH_LABELS[start.getUTCMonth()]} ${String(start.getUTCFullYear()).slice(2)}`,
      start,
      end,
    };
  });
}

function linearForecast(
  actual: { date: string; label: string; value: number }[],
  forecastDays: number,
): { date: string; label: string; value: number }[] {
  if (actual.length === 0 || forecastDays <= 0) return [];
  const tail = actual.slice(-14);
  const avg = tail.reduce((s, d) => s + d.value, 0) / tail.length;
  const first = tail[0].value;
  const last = tail[tail.length - 1].value;
  const slope = tail.length > 1 ? (last - first) / (tail.length - 1) : 0;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Array.from({ length: forecastDays }).map((_, i) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + i + 1);
    const dow = d.getUTCDay();
    const trended = last + slope * (i + 1);
    const adjusted = dow === 0 || dow === 6 ? trended * 0.2 : trended;
    return {
      date: d.toISOString().slice(0, 10),
      label: dateLabel(d),
      value: Math.max(0, Math.round(Math.max(adjusted, avg * 0.15))),
    };
  });
}

export async function loadDashboard(): Promise<DashboardData> {
  if (isDemoMode()) {
    return demoDashboard() as DashboardData;
  }

  const supabase = await getSupabaseServer();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const since24h = new Date(now.getTime() - 86400000).toISOString();
  const since48h = new Date(now.getTime() - 2 * 86400000).toISOString();
  const buckets = dayBuckets();
  const weekStart = buckets[0].start.toISOString();
  const weekEnd = buckets[6].end.toISOString();
  const prevWeekStart = new Date(buckets[0].start.getTime() - 7 * 86400000).toISOString();
  // 30/14 day windows for time-series charts
  const days30 = trailingDayBuckets(30);
  const days14 = trailingDayBuckets(14);
  const since30dStart = days30[0].start.toISOString();
  const since14dStart = days14[0].start.toISOString();
  // 6-month window for monthly revenue chart
  const months6 = monthBuckets(6);
  const since6moStart = months6[0].start.toISOString();
  // Previous calendar month (same range) for revenueMtd delta
  const prevMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  ).toISOString();
  const prevMonthEnd = monthStart;

  const [
    paidInv,
    sentInv,
    activeWorkersCount,
    onboardingWorkersCount,
    inactiveWorkersCount,
    activePlacementsCount,
    openJobsCount,
    entries30d,
    pendingCount,
    apps24Count,
    apps48to24Count,
    topEmpsData,
    topWorkersData,
    recentApps,
    recentInvoices,
    recentEntries,
    liveOpen,
    activeProjectsRaw,
    inv30dPaid,
    inv6moPaid,
    apps14d,
    prevMonthPaidInv,
    prevWeekEntries,
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("total, paid_at")
      .eq("status", "paid")
      .gte("paid_at", monthStart),
    supabase
      .from("invoices")
      .select("total")
      .in("status", ["sent", "overdue"]),
    supabase
      .from("workers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("workers")
      .select("id", { count: "exact", head: true })
      .eq("status", "onboarding"),
    supabase
      .from("workers")
      .select("id", { count: "exact", head: true })
      .eq("status", "inactive"),
    supabase
      .from("placements")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("time_entries")
      .select("hours_worked, clock_in_at, pay_rate_at_entry, bill_rate_at_entry")
      .gte("clock_in_at", since30dStart)
      .limit(50000),
    supabase
      .from("time_entries")
      .select("id", { count: "exact", head: true })
      .eq("approved", false)
      .not("clock_out_at", "is", null),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24h),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since48h)
      .lt("created_at", since24h),
    supabase
      .from("invoices")
      .select("total, employer:employers(name)")
      .eq("status", "paid")
      .gte("paid_at", new Date(now.getTime() - 90 * 86400000).toISOString())
      .limit(500),
    supabase
      .from("time_entries")
      .select("hours_worked, worker:workers(full_name)")
      .eq("approved", true)
      .gte("clock_in_at", new Date(now.getTime() - 30 * 86400000).toISOString())
      .limit(500),
    supabase
      .from("applications")
      .select("id, created_at, candidate:candidates(full_name), job:jobs(title)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("time_entries")
      .select("id, clock_in_at, clock_out_at, worker:workers(full_name)")
      .order("clock_in_at", { ascending: false })
      .limit(5),
    supabase
      .from("time_entries")
      .select(
        "id, clock_in_at, worker:workers(full_name), placement:placements(role_title, employer:employers(name))",
      )
      .is("clock_out_at", null)
      .order("clock_in_at", { ascending: false })
      .limit(20),
    supabase
      .from("projects")
      .select(
        "id, name, budget_amount, employer:employers(name), placements:placements(id, status, time_entries:time_entries(hours_worked, pay_rate_at_entry, bill_rate_at_entry, approved))",
      )
      .eq("status", "active"),
    supabase
      .from("invoices")
      .select("total, paid_at")
      .eq("status", "paid")
      .gte("paid_at", since30dStart)
      .limit(5000),
    supabase
      .from("invoices")
      .select("total, paid_at")
      .eq("status", "paid")
      .gte("paid_at", since6moStart)
      .limit(20000),
    supabase
      .from("applications")
      .select("created_at")
      .gte("created_at", since14dStart)
      .limit(5000),
    supabase
      .from("invoices")
      .select("total")
      .eq("status", "paid")
      .gte("paid_at", prevMonthStart)
      .lt("paid_at", prevMonthEnd),
    supabase
      .from("time_entries")
      .select("hours_worked, pay_rate_at_entry, bill_rate_at_entry")
      .gte("clock_in_at", prevWeekStart)
      .lt("clock_in_at", weekStart)
      .limit(20000),
  ]);

  const revenueMtd = (paidInv.data ?? []).reduce(
    (acc, r) => acc + Number((r as { total: number }).total ?? 0),
    0,
  );
  const outstanding = (sentInv.data ?? []).reduce(
    (acc, r) => acc + Number((r as { total: number }).total ?? 0),
    0,
  );

  const entries = (entries30d.data ?? []) as Array<{
    hours_worked: number | null;
    clock_in_at: string;
    pay_rate_at_entry: number | null;
    bill_rate_at_entry: number | null;
  }>;
  const weekStartMs = buckets[0].start.getTime();
  const weekEndMs = buckets[6].end.getTime();
  const entriesThisWeek = entries.filter((e) => {
    const t = +new Date(e.clock_in_at);
    return t >= weekStartMs && t < weekEndMs;
  });
  const hoursThisWeek = entriesThisWeek.reduce(
    (a, e) => a + (Number(e.hours_worked) || 0),
    0,
  );
  const marginThisWeek = entriesThisWeek.reduce((a, e) => {
    const hrs = Number(e.hours_worked) || 0;
    const margin = (Number(e.bill_rate_at_entry) || 0) - (Number(e.pay_rate_at_entry) || 0);
    return a + hrs * margin;
  }, 0);
  const revenueThisWeek = entriesThisWeek.reduce((a, e) => {
    const hrs = Number(e.hours_worked) || 0;
    return a + hrs * (Number(e.bill_rate_at_entry) || 0);
  }, 0);
  const monthStartMs = new Date(monthStart).getTime();
  const entriesMtd = entries.filter(
    (e) => +new Date(e.clock_in_at) >= monthStartMs,
  );
  const marginMtd = entriesMtd.reduce((a, e) => {
    const hrs = Number(e.hours_worked) || 0;
    const margin = (Number(e.bill_rate_at_entry) || 0) - (Number(e.pay_rate_at_entry) || 0);
    return a + hrs * margin;
  }, 0);
  const hoursByDay = buckets.map((b) => {
    const total = entriesThisWeek
      .filter((e) => {
        const t = +new Date(e.clock_in_at);
        return t >= b.start.getTime() && t < b.end.getTime();
      })
      .reduce((a, e) => a + (Number(e.hours_worked) || 0), 0);
    return { day: b.label, hours: Math.round(total * 10) / 10 };
  });

  // 30-day margin series (labor margin = (bill - pay) * hours, bucketed by day)
  const marginByBucket = new Map<string, number>();
  for (const e of entries) {
    const iso = e.clock_in_at.slice(0, 10);
    const margin =
      ((Number(e.bill_rate_at_entry) || 0) - (Number(e.pay_rate_at_entry) || 0)) *
      (Number(e.hours_worked) || 0);
    marginByBucket.set(iso, (marginByBucket.get(iso) ?? 0) + margin);
  }
  const marginByDay30 = days30.map((b) => ({
    date: b.iso,
    label: b.label,
    value: Math.round(marginByBucket.get(b.iso) ?? 0),
  }));

  // 30-day revenue series (paid invoices, bucketed by paid_at day)
  const revenueByBucket = new Map<string, number>();
  for (const r of ((inv30dPaid.data ?? []) as Array<{ total: number; paid_at: string }>)) {
    if (!r.paid_at) continue;
    const iso = r.paid_at.slice(0, 10);
    revenueByBucket.set(iso, (revenueByBucket.get(iso) ?? 0) + Number(r.total ?? 0));
  }
  const revenueByDay30 = days30.map((b) => ({
    date: b.iso,
    label: b.label,
    value: Math.round(revenueByBucket.get(b.iso) ?? 0),
  }));

  const revenueForecast14 = linearForecast(revenueByDay30, 14);

  // 14-day applications series
  const appsByBucket = new Map<string, number>();
  for (const a of ((apps14d.data ?? []) as Array<{ created_at: string }>)) {
    if (!a.created_at) continue;
    const iso = a.created_at.slice(0, 10);
    appsByBucket.set(iso, (appsByBucket.get(iso) ?? 0) + 1);
  }
  const applicationsByDay14 = days14.map((b) => ({
    date: b.iso,
    label: b.label,
    value: appsByBucket.get(b.iso) ?? 0,
  }));

  // 6-month revenue + cost (revenue from paid invoices; cost approximated from
  // observed margin ratio in the last 30 days — proper per-month cost would
  // require pulling 180 days of time_entries which is too heavy for a page load)
  const revenueByMonth = new Map<string, number>();
  for (const r of ((inv6moPaid.data ?? []) as Array<{ total: number; paid_at: string }>)) {
    if (!r.paid_at) continue;
    const key = r.paid_at.slice(0, 7);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(r.total ?? 0));
  }
  let revenue30dLabor = 0;
  let cost30dLabor = 0;
  for (const e of entries) {
    const h = Number(e.hours_worked) || 0;
    revenue30dLabor += h * (Number(e.bill_rate_at_entry) || 0);
    cost30dLabor += h * (Number(e.pay_rate_at_entry) || 0);
  }
  const marginRatio =
    revenue30dLabor > 0
      ? Math.max(0, Math.min(0.9, (revenue30dLabor - cost30dLabor) / revenue30dLabor))
      : 0.4;
  const monthlyRevenue = months6.map((m) => {
    const revenue = Math.round(revenueByMonth.get(m.month) ?? 0);
    const margin = Math.round(revenue * marginRatio);
    const cost = revenue - margin;
    return { month: m.month, label: m.label, revenue, cost, margin };
  });

  // Previous-period values for delta calc
  const prevMonthRevenue = ((prevMonthPaidInv.data ?? []) as Array<{ total: number }>).reduce(
    (a, r) => a + Number(r.total ?? 0),
    0,
  );
  const prevMarginThisWeek = (
    (prevWeekEntries.data ?? []) as Array<{
      hours_worked: number | null;
      pay_rate_at_entry: number | null;
      bill_rate_at_entry: number | null;
    }>
  ).reduce((a, e) => {
    const hrs = Number(e.hours_worked) || 0;
    const m = (Number(e.bill_rate_at_entry) || 0) - (Number(e.pay_rate_at_entry) || 0);
    return a + hrs * m;
  }, 0);

  type EmpRow = { total: number; employer: { name: string } | null };
  const empAgg = new Map<string, number>();
  for (const r of (topEmpsData.data as unknown as EmpRow[]) ?? []) {
    const name = r.employer?.name;
    if (!name) continue;
    empAgg.set(name, (empAgg.get(name) ?? 0) + Number(r.total ?? 0));
  }
  const topEmployers = Array.from(empAgg.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  type WkRow = { hours_worked: number | null; worker: { full_name: string } | null };
  const wkAgg = new Map<string, number>();
  for (const r of (topWorkersData.data as unknown as WkRow[]) ?? []) {
    const name = r.worker?.full_name;
    if (!name || !r.hours_worked) continue;
    wkAgg.set(name, (wkAgg.get(name) ?? 0) + Number(r.hours_worked));
  }
  const topWorkers = Array.from(wkAgg.entries())
    .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  const recentActivity: DashboardData["recentActivity"] = [];
  for (const a of (recentApps.data ?? []) as unknown as Array<{
    id: string;
    created_at: string;
    candidate: { full_name: string } | null;
    job: { title: string } | null;
  }>) {
    recentActivity.push({
      type: "application",
      label: `${a.candidate?.full_name ?? "Someone"} applied to ${a.job?.title ?? "a job"}`,
      at: a.created_at,
      href: "/admin/applications",
    });
  }
  for (const i of (recentInvoices.data ?? []) as unknown as Array<{
    id: string;
    invoice_number: string;
    total: number;
    status: string;
    created_at: string;
  }>) {
    recentActivity.push({
      type: "invoice",
      label: `${i.invoice_number} — $${Number(i.total).toFixed(0)} (${i.status})`,
      at: i.created_at,
      href: `/admin/invoices/${i.id}`,
    });
  }
  for (const t of (recentEntries.data ?? []) as unknown as Array<{
    id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    worker: { full_name: string } | null;
  }>) {
    recentActivity.push({
      type: "time",
      label: t.clock_out_at
        ? `${t.worker?.full_name ?? "Worker"} clocked out`
        : `${t.worker?.full_name ?? "Worker"} clocked in`,
      at: t.clock_out_at ?? t.clock_in_at,
      href: "/admin/timesheet",
    });
  }
  recentActivity.sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const liveOnTheClock = (
    (liveOpen.data ?? []) as unknown as Array<{
      id: string;
      clock_in_at: string;
      worker: { full_name: string } | null;
      placement: { role_title: string; employer: { name: string } | null } | null;
    }>
  ).map((r) => ({
    id: r.id,
    worker: r.worker?.full_name ?? "Worker",
    placement: `${r.placement?.employer?.name ?? "—"} · ${r.placement?.role_title ?? "—"}`,
    clockInAt: r.clock_in_at,
  }));

  type ProjectRow = {
    id: string;
    name: string;
    budget_amount: number | null;
    employer: { name: string } | null;
    placements:
      | Array<{
          id: string;
          status: string;
          time_entries:
            | Array<{
                hours_worked: number | null;
                pay_rate_at_entry: number | null;
                bill_rate_at_entry: number | null;
                approved: boolean;
              }>
            | null;
        }>
      | null;
  };
  const activeProjects = ((activeProjectsRaw.data as unknown as ProjectRow[]) ?? [])
    .map((p) => {
      const placements = p.placements ?? [];
      const activeWorkers = placements.filter((pl) => pl.status === "active").length;
      let hours = 0;
      let cost = 0;
      let revenue = 0;
      for (const pl of placements) {
        for (const te of pl.time_entries ?? []) {
          if (!te.approved) continue;
          const h = Number(te.hours_worked) || 0;
          hours += h;
          cost += h * (Number(te.pay_rate_at_entry) || 0);
          revenue += h * (Number(te.bill_rate_at_entry) || 0);
        }
      }
      const budgetPct = p.budget_amount
        ? Math.min(100, Math.round((revenue / Number(p.budget_amount)) * 100))
        : null;
      return {
        id: p.id,
        name: p.name,
        employer: p.employer?.name ?? "—",
        activeWorkers,
        hours: Math.round(hours * 10) / 10,
        revenue: Math.round(revenue),
        margin: Math.round(revenue - cost),
        budgetAmount: p.budget_amount != null ? Number(p.budget_amount) : null,
        budgetPct,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return {
    revenueMtd: Math.round(revenueMtd * 100) / 100,
    revenueThisWeek: Math.round(revenueThisWeek * 100) / 100,
    marginMtd: Math.round(marginMtd * 100) / 100,
    outstanding: Math.round(outstanding * 100) / 100,
    pendingPayoutCents: 0,
    marginThisWeek: Math.round(marginThisWeek * 100) / 100,
    activeWorkers: activeWorkersCount.count ?? 0,
    activePlacements: activePlacementsCount.count ?? 0,
    openJobs: openJobsCount.count ?? 0,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
    pendingTimesheets: pendingCount.count ?? 0,
    newApplications24h: apps24Count.count ?? 0,
    liveOnTheClock,
    activeProjects,
    hoursByDay,
    topEmployers,
    topWorkers,
    recentActivity: recentActivity.slice(0, 8),
    revenueByDay30,
    revenueForecast14,
    marginByDay30,
    applicationsByDay14,
    monthlyRevenue,
    workersByStatus: {
      active: activeWorkersCount.count ?? 0,
      onboarding: onboardingWorkersCount.count ?? 0,
      inactive: inactiveWorkersCount.count ?? 0,
    },
    prevPeriod: {
      revenueMtd: Math.round(prevMonthRevenue * 100) / 100,
      marginThisWeek: Math.round(prevMarginThisWeek * 100) / 100,
      // No historical snapshot for outstanding/workers/placements/jobs/timesheets
      // — leaving at 0 makes pctDelta return null, which the UI renders as no delta
      outstanding: 0,
      applications24h: apps48to24Count.count ?? 0,
      activeWorkers: 0,
      activePlacements: 0,
      openJobs: 0,
      pendingTimesheets: 0,
    },
  };
}
