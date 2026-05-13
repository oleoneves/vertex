import "server-only";
import { getSupabaseServer } from "./supabase/server";
import { isDemoMode, demoProjects, demoProjectDetail } from "./demo";
import type { Project, Employer, Worker, Placement, TimeEntry } from "@/types/db";

export type ProjectWithEmployer = Project & {
  employer: Pick<Employer, "name"> | null;
};

export async function listProjects(): Promise<ProjectWithEmployer[]> {
  if (isDemoMode()) {
    return demoProjects() as ProjectWithEmployer[];
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("projects")
    .select("*, employer:employers(name)")
    .order("created_at", { ascending: false });
  return (data as unknown as ProjectWithEmployer[]) ?? [];
}

export async function getProjectDetail(id: string) {
  if (isDemoMode()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return demoProjectDetail(id) as any;
  }
  const supabase = await getSupabaseServer();

  const [projectRes, placementsRes, entriesRes] = await Promise.all([
    supabase
      .from("projects")
      .select("*, employer:employers(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("placements")
      .select("*, worker:workers(full_name, employee_code, status)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("time_entries")
      .select(
        "id, hours_worked, pay_rate_at_entry, bill_rate_at_entry, clock_in_at, clock_out_at, approved, placement:placements!inner(project_id, role_title), worker:workers(full_name)",
      )
      .eq("placement.project_id", id)
      .limit(10000),
  ]);

  const project = projectRes.data as
    | (Project & { employer: Employer | null })
    | null;
  if (!project) return null;

  const placements =
    (placementsRes.data as unknown as (Placement & {
      worker: Pick<Worker, "full_name" | "employee_code" | "status"> | null;
    })[]) ?? [];

  type EntryRow = {
    id: string;
    hours_worked: number | null;
    pay_rate_at_entry: number | null;
    bill_rate_at_entry: number | null;
    clock_in_at: string;
    clock_out_at: string | null;
    approved: boolean;
    placement: { project_id: string; role_title: string } | null;
    worker: { full_name: string } | null;
  };
  const entries = (entriesRes.data as unknown as EntryRow[]) ?? [];

  // Totals
  const totals = entries.reduce(
    (acc, e) => {
      const hrs = Number(e.hours_worked) || 0;
      const pay = Number(e.pay_rate_at_entry) || 0;
      const bill = Number(e.bill_rate_at_entry) || 0;
      if (e.approved) {
        acc.hours += hrs;
        acc.cost += hrs * pay;
        acc.revenue += hrs * bill;
      } else if (e.clock_out_at) {
        acc.pendingHours += hrs;
      }
      return acc;
    },
    { hours: 0, cost: 0, revenue: 0, pendingHours: 0 },
  );

  // Last 14-day bucket for the chart
  const days: { day: string; label: string; hours: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      day: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      hours: 0,
    });
  }
  for (const e of entries) {
    if (!e.approved) continue;
    const key = new Date(e.clock_in_at).toISOString().slice(0, 10);
    const d = days.find((x) => x.day === key);
    if (d) d.hours += Number(e.hours_worked) || 0;
  }

  // Per-role breakdown
  const byRole = new Map<string, { role: string; hours: number; workers: Set<string> }>();
  for (const e of entries) {
    if (!e.approved || !e.placement) continue;
    const r = byRole.get(e.placement.role_title) ?? {
      role: e.placement.role_title,
      hours: 0,
      workers: new Set(),
    };
    r.hours += Number(e.hours_worked) || 0;
    if (e.worker?.full_name) r.workers.add(e.worker.full_name);
    byRole.set(e.placement.role_title, r);
  }
  const roleRows = Array.from(byRole.values())
    .map((r) => ({ role: r.role, hours: Math.round(r.hours * 10) / 10, headcount: r.workers.size }))
    .sort((a, b) => b.hours - a.hours);

  // Active vs total workers
  const activeWorkers = placements.filter((p) => p.status === "active").length;
  const totalWorkers = new Set(placements.map((p) => p.worker_id)).size;

  return {
    project,
    placements,
    activeWorkers,
    totalWorkers,
    totals: {
      ...totals,
      margin: totals.revenue - totals.cost,
    },
    days,
    roleRows,
    recentEntries: entries
      .slice()
      .sort((a, b) => +new Date(b.clock_in_at) - +new Date(a.clock_in_at))
      .slice(0, 10),
  };
}
