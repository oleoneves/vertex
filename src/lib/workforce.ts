import "server-only";
import { getSupabaseServer } from "./supabase/server";
import {
  isDemoMode,
  demoWorkers,
  demoEmployers,
  demoPlacements,
  demoUpcomingShifts,
  demoTimeEntries,
  demoInvoices,
  demoProjects,
} from "./demo";
import type {
  Worker,
  Employer,
  Placement,
  Shift,
  TimeEntry,
  Invoice,
  InvoiceLineItem,
} from "@/types/db";

export function supabaseReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function listWorkers(): Promise<Worker[]> {
  if (isDemoMode()) return demoWorkers();
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("workers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Worker[]) ?? [];
}

export async function listEmployers(): Promise<Employer[]> {
  if (isDemoMode()) return demoEmployers();
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("employers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Employer[]) ?? [];
}

export type PlacementWithRefs = Placement & {
  worker: Pick<Worker, "full_name" | "employee_code"> | null;
  employer: Pick<Employer, "name"> | null;
  project?: { name: string } | null;
};

export async function listPlacements(): Promise<PlacementWithRefs[]> {
  if (isDemoMode()) {
    const workers = demoWorkers();
    const employers = demoEmployers();
    const projects = demoProjects();
    return demoPlacements().map((p) => {
      const w = workers.find((x) => x.id === p.worker_id);
      const e = employers.find((x) => x.id === p.employer_id);
      const proj = p.project_id ? projects.find((x) => x.id === p.project_id) : null;
      return {
        ...p,
        worker: w ? { full_name: w.full_name, employee_code: w.employee_code } : null,
        employer: e ? { name: e.name } : null,
        project: proj ? { name: proj.name } : null,
      };
    });
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("placements")
    .select(
      "*, worker:workers(full_name, employee_code), employer:employers(name)",
    )
    .order("created_at", { ascending: false });
  return (data as unknown as PlacementWithRefs[]) ?? [];
}

export type ShiftWithRefs = Shift & {
  placement: (Pick<Placement, "role_title"> & {
    worker: Pick<Worker, "full_name"> | null;
    employer: Pick<Employer, "name"> | null;
  }) | null;
};

export async function listShifts(opts: { upcoming?: boolean } = {}): Promise<ShiftWithRefs[]> {
  if (isDemoMode()) {
    const workers = demoWorkers();
    const placements = demoPlacements();
    return demoUpcomingShifts().map((s) => {
      const placement = placements.find((p) => p.id === s.placement_id);
      const worker = placement ? workers.find((w) => w.id === placement.worker_id) : null;
      return {
        ...s,
        placement: placement
          ? {
              role_title: placement.role_title,
              worker: worker ? { full_name: worker.full_name } : null,
              employer: { name: "Sunbelt Industrial Group" },
            }
          : null,
      };
    });
  }
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("shifts")
    .select(
      "*, placement:placements(role_title, worker:workers(full_name), employer:employers(name))",
    )
    .order("scheduled_start", { ascending: opts.upcoming === false ? false : true });
  if (opts.upcoming) {
    q = q.gte("scheduled_start", new Date().toISOString());
  }
  const { data } = await q;
  return (data as unknown as ShiftWithRefs[]) ?? [];
}

export type TimeEntryWithRefs = TimeEntry & {
  worker: Pick<Worker, "full_name" | "employee_code"> | null;
  placement: (Pick<Placement, "role_title"> & {
    employer: Pick<Employer, "name"> | null;
  }) | null;
};

export async function listTimeEntries(opts: {
  from?: string;
  to?: string;
  unapprovedOnly?: boolean;
  workerId?: string;
} = {}): Promise<TimeEntryWithRefs[]> {
  if (isDemoMode()) {
    let entries = demoTimeEntries({ limit: 80 });
    if (opts.unapprovedOnly) {
      entries = entries.filter((e) => !e.approved && e.clock_out_at);
    }
    return entries as unknown as TimeEntryWithRefs[];
  }
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("time_entries")
    .select(
      "*, worker:workers(full_name, employee_code), placement:placements(role_title, employer:employers(name))",
    )
    .order("clock_in_at", { ascending: false });
  if (opts.from) q = q.gte("clock_in_at", opts.from);
  if (opts.to) q = q.lte("clock_in_at", opts.to);
  if (opts.unapprovedOnly) q = q.eq("approved", false);
  if (opts.workerId) q = q.eq("worker_id", opts.workerId);
  const { data } = await q;
  return (data as unknown as TimeEntryWithRefs[]) ?? [];
}

export type InvoiceWithEmployer = Invoice & {
  employer: Pick<Employer, "name" | "billing_email"> | null;
};

export async function listInvoices(): Promise<InvoiceWithEmployer[]> {
  if (isDemoMode()) return demoInvoices() as unknown as InvoiceWithEmployer[];
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("invoices")
    .select("*, employer:employers(name, billing_email)")
    .order("created_at", { ascending: false });
  return (data as unknown as InvoiceWithEmployer[]) ?? [];
}

export type InvoiceDetail = Invoice & {
  employer:
    | Pick<
        Employer,
        "name" | "billing_email" | "billing_address" | "contact_name" | "payment_terms_days"
      >
    | null;
  lines: (InvoiceLineItem & { worker: Pick<Worker, "full_name"> | null })[];
};

export async function getInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  if (!supabaseReady()) return null;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("invoices")
    .select(
      "*, employer:employers(name, contact_name, billing_email, billing_address, payment_terms_days), lines:invoice_line_items(*, worker:workers(full_name))",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as InvoiceDetail) ?? null;
}

// Worker portal helpers
export async function getCurrentWorker(): Promise<Worker | null> {
  if (isDemoMode()) {
    const { demoCurrentWorker } = await import("./demo");
    return demoCurrentWorker();
  }
  if (!supabaseReady()) return null;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("workers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as Worker) ?? null;
}

export async function getOpenTimeEntry(workerId: string): Promise<TimeEntry | null> {
  if (isDemoMode()) return null;
  if (!supabaseReady()) return null;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("time_entries")
    .select("*")
    .eq("worker_id", workerId)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as TimeEntry) ?? null;
}

export async function getWorkerWeek(workerId: string): Promise<{
  shifts: ShiftWithRefs[];
  entries: TimeEntry[];
  hours: number;
}> {
  if (isDemoMode()) {
    const { demoWorkerWeek } = await import("./demo");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return demoWorkerWeek() as any;
  }
  if (!supabaseReady()) return { shifts: [], entries: [], hours: 0 };
  const supabase = await getSupabaseServer();
  const now = new Date();
  const day = now.getUTCDay();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - day);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  const [shifts, entries] = await Promise.all([
    supabase
      .from("shifts")
      .select(
        "*, placement:placements(role_title, worker:workers(full_name), employer:employers(name))",
      )
      .in(
        "placement_id",
        (
          await supabase
            .from("placements")
            .select("id")
            .eq("worker_id", workerId)
        ).data?.map((p) => p.id) ?? [],
      )
      .gte("scheduled_start", weekStart.toISOString())
      .lt("scheduled_start", weekEnd.toISOString())
      .order("scheduled_start", { ascending: true }),
    supabase
      .from("time_entries")
      .select("*")
      .eq("worker_id", workerId)
      .gte("clock_in_at", weekStart.toISOString())
      .lt("clock_in_at", weekEnd.toISOString()),
  ]);

  const entriesData = (entries.data as TimeEntry[]) ?? [];
  const hours = entriesData.reduce((acc, e) => acc + (Number(e.hours_worked) || 0), 0);

  return {
    shifts: (shifts.data as unknown as ShiftWithRefs[]) ?? [],
    entries: entriesData,
    hours,
  };
}
