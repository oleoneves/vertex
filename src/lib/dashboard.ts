import "server-only";
import { getSupabaseServer } from "./supabase/server";
import { isDemoMode, demoDashboard } from "./demo";

export type DashboardData = {
  revenueMtd: number;
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
  recentActivity: { type: string; label: string; at: string }[];
};

export const EMPTY_DASHBOARD: DashboardData = {
  revenueMtd: 0,
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

export async function loadDashboard(): Promise<DashboardData> {
  if (isDemoMode()) {
    return demoDashboard() as DashboardData;
  }

  const supabase = await getSupabaseServer();
  const now = new Date();
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1).toISOString();
  const since24h = new Date(now.getTime() - 86400000).toISOString();
  const buckets = dayBuckets();
  const weekStart = buckets[0].start.toISOString();
  const weekEnd = buckets[6].end.toISOString();

  const [
    paidInv,
    sentInv,
    activeWorkersCount,
    activePlacementsCount,
    openJobsCount,
    weekEntries,
    pendingCount,
    apps24Count,
    topEmpsData,
    topWorkersData,
    recentApps,
    recentInvoices,
    recentEntries,
    liveOpen,
    activeProjectsRaw,
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
      .gte("clock_in_at", weekStart)
      .lt("clock_in_at", weekEnd),
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
  ]);

  const revenueMtd = (paidInv.data ?? []).reduce(
    (acc, r) => acc + Number((r as { total: number }).total ?? 0),
    0,
  );
  const outstanding = (sentInv.data ?? []).reduce(
    (acc, r) => acc + Number((r as { total: number }).total ?? 0),
    0,
  );

  const entries = (weekEntries.data ?? []) as Array<{
    hours_worked: number | null;
    clock_in_at: string;
    pay_rate_at_entry: number | null;
    bill_rate_at_entry: number | null;
  }>;
  const hoursThisWeek = entries.reduce((a, e) => a + (Number(e.hours_worked) || 0), 0);
  const marginThisWeek = entries.reduce((a, e) => {
    const hrs = Number(e.hours_worked) || 0;
    const margin = (Number(e.bill_rate_at_entry) || 0) - (Number(e.pay_rate_at_entry) || 0);
    return a + hrs * margin;
  }, 0);
  const hoursByDay = buckets.map((b) => {
    const total = entries
      .filter((e) => {
        const t = new Date(e.clock_in_at);
        return t >= b.start && t < b.end;
      })
      .reduce((a, e) => a + (Number(e.hours_worked) || 0), 0);
    return { day: b.label, hours: Math.round(total * 10) / 10 };
  });

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
  };
}
