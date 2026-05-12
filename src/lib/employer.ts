import "server-only";
import { getSupabaseServer } from "./supabase/server";
import type { Employer, Placement, TimeEntry, Worker, Invoice } from "@/types/db";

export type EmployerScope = {
  employer: Employer;
  employerId: string;
};

export async function getCurrentEmployer(): Promise<EmployerScope | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
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

export async function getEmployerDashboard(employerId: string) {
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
  };
}

export async function listEmployerWorkers(employerId: string): Promise<
  Array<Worker & { placement: Pick<Placement, "role_title" | "bill_rate" | "status"> }>
> {
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
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("employer_id", employerId)
    .neq("status", "draft")
    .order("created_at", { ascending: false });
  return (data as Invoice[]) ?? [];
}
