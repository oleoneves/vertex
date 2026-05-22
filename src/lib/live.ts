import "server-only";
import { getSupabaseServer } from "./supabase/server";
import type { LiveShiftEntry } from "./demo";

// Live board for /admin/live: today's shifts + open time entries, joined to
// worker / employer / placement names. Empty result is the correct state when
// no shifts are scheduled.
export async function loadLiveBoard(): Promise<LiveShiftEntry[]> {
  const supabase = await getSupabaseServer();

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  type ShiftRow = {
    id: string;
    scheduled_start: string;
    scheduled_end: string;
    location: string | null;
    status: string;
    placement: {
      role_title: string | null;
      worker: { full_name: string } | null;
      employer: { name: string } | null;
      project: { name: string } | null;
    } | null;
  };
  type EntryRow = {
    id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    hours_worked: number | null;
    location: string | null;
    placement: {
      role_title: string | null;
      worker: { full_name: string } | null;
      employer: { name: string } | null;
      project: { name: string } | null;
    } | null;
  };

  const [shiftsRes, entriesRes] = await Promise.all([
    supabase
      .from("shifts")
      .select(
        "id, scheduled_start, scheduled_end, location, status, placement:placements(role_title, worker:workers(full_name), employer:employers(name), project:projects(name))",
      )
      .gte("scheduled_start", dayStart.toISOString())
      .lte("scheduled_start", dayEnd.toISOString())
      .order("scheduled_start", { ascending: true })
      .limit(80),
    supabase
      .from("time_entries")
      .select(
        "id, clock_in_at, clock_out_at, hours_worked, location, placement:placements(role_title, worker:workers(full_name), employer:employers(name), project:projects(name))",
      )
      .gte("clock_in_at", dayStart.toISOString())
      .lte("clock_in_at", dayEnd.toISOString())
      .order("clock_in_at", { ascending: true })
      .limit(80),
  ]);

  const shifts = (shiftsRes.data ?? []) as unknown as ShiftRow[];
  const entries = (entriesRes.data ?? []) as unknown as EntryRow[];

  const out: LiveShiftEntry[] = [];

  // Scheduled shifts that haven't been clocked into yet (no matching entry today)
  const entryShiftIds = new Set<string>();
  for (const s of shifts) {
    // Build from shift if status is scheduled/cancelled (still informational)
    out.push({
      id: `shift-${s.id}`,
      worker: s.placement?.worker?.full_name ?? "—",
      role: s.placement?.role_title ?? "—",
      employer: s.placement?.employer?.name ?? "—",
      project: s.placement?.project?.name ?? null,
      location: s.location,
      scheduledStart: s.scheduled_start,
      status: "scheduled",
      clockInAt: null,
      clockOutAt: null,
      hours: null,
    });
    entryShiftIds.add(s.id);
  }

  // Time entries clocked in today — these override status to on_site/completed.
  for (const e of entries) {
    const clockedOut = !!e.clock_out_at;
    out.push({
      id: `entry-${e.id}`,
      worker: e.placement?.worker?.full_name ?? "—",
      role: e.placement?.role_title ?? "—",
      employer: e.placement?.employer?.name ?? "—",
      project: e.placement?.project?.name ?? null,
      location: e.location,
      scheduledStart: e.clock_in_at,
      status: clockedOut ? "completed" : "on_site",
      clockInAt: e.clock_in_at,
      clockOutAt: e.clock_out_at,
      hours: e.hours_worked,
    });
  }

  return out;
}
