import "server-only";
import { getSupabaseServer } from "./supabase/server";
import type { Employer, Placement, TimeEntry, Worker, Invoice } from "@/types/db";
import {
  isDemoMode,
  demoEmployers,
  demoInvoices,
  demoTimeEntries,
  demoPlacements,
  demoWorkers,
} from "./demo";

export type EmployerScope = {
  employer: Employer;
  employerId: string;
};

const DEMO_EMPLOYER_ID = "emp-sunbelt";

export async function getCurrentEmployer(): Promise<EmployerScope | null> {
  if (isDemoMode()) {
    const e = demoEmployers().find((x) => x.id === DEMO_EMPLOYER_ID);
    if (!e) return null;
    return { employer: e, employerId: e.id };
  }
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: link } = await supabase
    .from("employer_users")
    .select("employer:employers(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  const e = (link as unknown as { employer: Employer | null })?.employer;
  if (!e) return null;
  return { employer: e, employerId: e.id };
}

export type EmployerDashboardData = {
  activePlacements: number;
  hoursWeek: number;
  outstanding: number;
  recentEntries: Array<{
    id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    hours_worked: number | null;
    approved: boolean;
    worker: { full_name: string } | null;
    placement: { role_title: string } | null;
  }>;
  // Charts:
  hoursByDay14: { date: string; label: string; value: number }[];
  spendByDay14: { date: string; label: string; value: number }[];
  weeklySpend6w: { label: string; value: number }[];
};

export async function getEmployerDashboard(
  employerId: string,
): Promise<EmployerDashboardData> {
  if (isDemoMode()) {
    return demoEmployerDashboard(employerId);
  }
  const supabase = await getSupabaseServer();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();

  const [placementsCount, hoursWeekRes, openInvRes, recentEntriesRes] = await Promise.all([
    supabase
      .from("placements")
      .select("id", { count: "exact", head: true })
      .eq("employer_id", employerId)
      .eq("status", "active"),
    supabase
      .from("time_entries")
      .select("hours_worked, placement:placements!inner(employer_id)")
      .eq("placement.employer_id", employerId)
      .gte("clock_in_at", since),
    supabase
      .from("invoices")
      .select("total")
      .eq("employer_id", employerId)
      .in("status", ["sent", "overdue"]),
    supabase
      .from("time_entries")
      .select(
        "id, clock_in_at, clock_out_at, hours_worked, approved, worker:workers(full_name), placement:placements!inner(role_title, employer_id)",
      )
      .eq("placement.employer_id", employerId)
      .order("clock_in_at", { ascending: false })
      .limit(8),
  ]);

  const hoursWeek = (
    (hoursWeekRes.data as unknown as { hours_worked: number | null }[]) ?? []
  ).reduce((acc, r) => acc + (Number(r.hours_worked) || 0), 0);
  const outstanding = (openInvRes.data as Array<{ total: number }> | null ?? []).reduce(
    (acc, r) => acc + Number(r.total ?? 0),
    0,
  );

  return {
    activePlacements: placementsCount.count ?? 0,
    hoursWeek: Math.round(hoursWeek * 10) / 10,
    outstanding,
    recentEntries:
      (recentEntriesRes.data as unknown as Array<{
        id: string;
        clock_in_at: string;
        clock_out_at: string | null;
        hours_worked: number | null;
        approved: boolean;
        worker: { full_name: string } | null;
        placement: { role_title: string } | null;
      }>) ?? [],
    hoursByDay14: [],
    spendByDay14: [],
    weeklySpend6w: [],
  };
}

function demoEmployerDashboard(employerId: string): EmployerDashboardData {
  const dateLabel = (d: Date) =>
    `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()]} ${d.getUTCDate()}`;

  // Days 14
  const now = new Date();
  const hoursByDay14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - (13 - i));
    const dow = d.getUTCDay();
    // Sunbelt runs 7-day project, 100 workers × 8h ≈ 800 hrs/day, lower weekends
    const base = dow === 0 || dow === 6 ? 320 : 800;
    const variance = 1 + ((i * 17) % 20 - 10) / 100;
    return {
      date: d.toISOString().slice(0, 10),
      label: dateLabel(d),
      value: Math.round(base * variance),
    };
  });
  const spendByDay14 = hoursByDay14.map((h) => ({
    ...h,
    value: Math.round(h.value * 25),
  }));

  // Weekly spend (6w)
  const weeklySpend6w = Array.from({ length: 6 }).map((_, i) => {
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - (5 - i) * 7);
    const base = 130_000 + i * 12_000;
    const variance = 1 + ((i * 11) % 15 - 7) / 100;
    return {
      label: `Wk of ${dateLabel(weekStart)}`,
      value: Math.round(base * variance),
    };
  });

  // Recent clock-ins (mirror demoTimeEntries but filtered by employer)
  const entries = demoTimeEntries({ limit: 20 });
  const recentEntries = entries.slice(0, 8).map((e) => ({
    id: e.id,
    clock_in_at: e.clock_in_at,
    clock_out_at: e.clock_out_at,
    hours_worked: e.hours_worked,
    approved: e.approved,
    worker: e.worker ? { full_name: e.worker.full_name } : null,
    placement: e.placement ? { role_title: e.placement.role_title } : null,
  }));

  // Outstanding: sum unpaid invoices for this employer
  const outstanding = demoInvoices()
    .filter((i) => i.employer_id === employerId && ["sent", "overdue"].includes(i.status))
    .reduce((s, i) => s + Number(i.total), 0);

  // Hours this week: last 7 days from hoursByDay14
  const hoursWeek = hoursByDay14.slice(-7).reduce((s, d) => s + d.value, 0);

  // Active placements for this employer
  const activePlacements = demoPlacements().filter(
    (p) => p.employer_id === employerId && p.status === "active",
  ).length;

  return {
    activePlacements,
    hoursWeek,
    outstanding,
    recentEntries,
    hoursByDay14,
    spendByDay14,
    weeklySpend6w,
  };
}

export async function listEmployerWorkers(employerId: string): Promise<
  Array<Worker & { placement: Pick<Placement, "role_title" | "bill_rate" | "status"> }>
> {
  if (isDemoMode()) {
    const placements = demoPlacements().filter((p) => p.employer_id === employerId);
    const workers = demoWorkers();
    return placements
      .map((p) => {
        const w = workers.find((x) => x.id === p.worker_id);
        if (!w) return null;
        return {
          ...w,
          placement: {
            role_title: p.role_title,
            bill_rate: p.bill_rate,
            status: p.status,
          },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("placements")
    .select(
      "role_title, bill_rate, status, worker:workers(*)",
    )
    .eq("employer_id", employerId)
    .order("created_at", { ascending: false });
  return (
    ((data as unknown as Array<{
      role_title: string;
      bill_rate: number;
      status: string;
      worker: Worker | null;
    }>) ?? [])
      .filter((r) => r.worker)
      .map((r) => ({
        ...(r.worker as Worker),
        placement: {
          role_title: r.role_title,
          bill_rate: r.bill_rate,
          status: r.status as Placement["status"],
        },
      }))
  );
}

export async function listEmployerHours(employerId: string, opts: { from?: string } = {}) {
  if (isDemoMode()) {
    const entries = demoTimeEntries({ limit: 80 });
    return entries.map((e) => ({
      ...e,
      placement: e.placement
        ? {
            role_title: e.placement.role_title,
            bill_rate: 25,
            employer_id: employerId,
          }
        : null,
    }));
  }
  const supabase = await getSupabaseServer();
  const from = opts.from ?? new Date(Date.now() - 30 * 86400000).toISOString();
  const { data } = await supabase
    .from("time_entries")
    .select(
      "id, clock_in_at, clock_out_at, hours_worked, approved, worker:workers(full_name), placement:placements!inner(role_title, bill_rate, employer_id)",
    )
    .eq("placement.employer_id", employerId)
    .gte("clock_in_at", from)
    .order("clock_in_at", { ascending: false })
    .limit(200);
  return (
    (data as unknown as Array<
      TimeEntry & {
        worker: { full_name: string } | null;
        placement: { role_title: string; bill_rate: number; employer_id: string } | null;
      }
    >) ?? []
  );
}

export async function listEmployerInvoices(employerId: string) {
  if (isDemoMode()) {
    return demoInvoices().filter(
      (i) => i.employer_id === employerId && i.status !== "draft",
    ) as unknown as Invoice[];
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("employer_id", employerId)
    .neq("status", "draft")
    .order("created_at", { ascending: false });
  return (data as Invoice[]) ?? [];
}
