import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { listPlacements } from "@/lib/workforce";
import { listProjects } from "@/lib/projects";
import { isDemoMode, demoUpcomingShifts } from "@/lib/demo";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Shift, Placement } from "@/types/db";
import { PageHeader } from "../../_components/page-header";
import { EmptyState } from "../../_components/empty-state";

export const dynamic = "force-dynamic";

async function loadShiftsInRange(
  startISO: string,
  endISO: string,
): Promise<Array<Pick<Shift, "id" | "placement_id" | "scheduled_start" | "status">>> {
  if (isDemoMode()) {
    return demoUpcomingShifts().map((s) => ({
      id: s.id,
      placement_id: s.placement_id,
      scheduled_start: s.scheduled_start,
      status: s.status,
    }));
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("shifts")
    .select("id, placement_id, scheduled_start, status")
    .gte("scheduled_start", startISO)
    .lt("scheduled_start", endISO)
    .order("scheduled_start", { ascending: true })
    .limit(5000);
  return (data as Array<Pick<Shift, "id" | "placement_id" | "scheduled_start" | "status">>) ?? [];
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-500/15 text-blue-800 dark:text-blue-300",
  in_progress: "bg-amber-500/20 text-amber-900 dark:text-amber-300",
  completed: "bg-green-500/15 text-green-800 dark:text-green-300",
  no_show: "bg-red-500/15 text-red-800 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; employer?: string; project?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date();
  const baseDate = sp.week ? new Date(sp.week) : today;
  // Compute the Monday of the requested week
  const dow = baseDate.getDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(baseDate);
  weekStart.setDate(baseDate.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const placements = (await listPlacements()).filter((p) => p.status === "active");
  const projects = await listProjects();

  // Filter
  let filtered = placements;
  if (sp.employer) filtered = filtered.filter((p) => p.employer_id === sp.employer);
  if (sp.project) filtered = filtered.filter((p) => p.project_id === sp.project);

  const placementsCapped = filtered.slice(0, 40); // viewport limit
  const overflow = filtered.length - placementsCapped.length;

  const shifts = await loadShiftsInRange(
    weekStart.toISOString(),
    weekEnd.toISOString(),
  );

  // shiftsByPlacementDay[placement_id][YYYY-MM-DD] = count
  const byKey = new Map<string, { count: number; status: string }>();
  for (const s of shifts) {
    const day = new Date(s.scheduled_start).toISOString().slice(0, 10);
    const k = `${s.placement_id}|${day}`;
    const prev = byKey.get(k);
    byKey.set(k, {
      count: (prev?.count ?? 0) + 1,
      status: prev?.status ?? s.status,
    });
  }

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(weekStart.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(weekStart.getDate() + 7);

  return (
    <div>
      <PageHeader
        title="Shift calendar"
        subtitle={`Week of ${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
      >
        <Link
          href={`/admin/shifts/calendar?week=${prevWeek.toISOString().slice(0, 10)}${sp.employer ? `&employer=${sp.employer}` : ""}${sp.project ? `&project=${sp.project}` : ""}`}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          ←
        </Link>
        <Link
          href={`/admin/shifts/calendar${sp.employer ? `?employer=${sp.employer}` : ""}${sp.project ? `${sp.employer ? "&" : "?"}project=${sp.project}` : ""}`}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          This week
        </Link>
        <Link
          href={`/admin/shifts/calendar?week=${nextWeek.toISOString().slice(0, 10)}${sp.employer ? `&employer=${sp.employer}` : ""}${sp.project ? `&project=${sp.project}` : ""}`}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          →
        </Link>
        <Link
          href="/admin/shifts"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          List view
        </Link>
      </PageHeader>

      <form
        method="GET"
        className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs"
      >
        <input type="hidden" name="week" value={weekStart.toISOString().slice(0, 10)} />
        <span className="font-medium text-muted-foreground">Filter:</span>
        <select
          name="project"
          defaultValue={sp.project ?? ""}
          className="h-9 rounded-md border border-border bg-background px-2 text-xs"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-bold text-background hover:opacity-90"
        >
          Apply
        </button>
      </form>

      {placementsCapped.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="No active placements in this view"
          body="Try a different filter or create placements first."
        />
      ) : (
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="min-w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="bg-muted/40">
                <th className="sticky left-0 z-10 min-w-[12rem] border-b border-border bg-muted/60 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Placement
                </th>
                {days.map((d) => {
                  const isToday = d.toDateString() === today.toDateString();
                  return (
                    <th
                      key={d.toISOString()}
                      className={`min-w-[5rem] border-b border-border px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider ${
                        isToday
                          ? "bg-accent/20 text-accent"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                      <div className="text-foreground">
                        {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {placementsCapped.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="sticky left-0 z-10 min-w-[12rem] border-b border-border bg-background px-3 py-2 text-sm">
                    <div className="font-medium truncate">{p.worker?.full_name ?? "—"}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {p.employer?.name} · {p.role_title}
                    </div>
                  </td>
                  {days.map((d) => {
                    const key = `${p.id}|${d.toISOString().slice(0, 10)}`;
                    const cell = byKey.get(key);
                    return (
                      <td
                        key={d.toISOString()}
                        className="border-b border-border/50 p-1 text-center"
                      >
                        {cell ? (
                          <span
                            className={`inline-flex h-7 min-w-[2rem] items-center justify-center rounded font-mono text-[11px] font-bold ${
                              STATUS_COLOR[cell.status] ?? "bg-muted"
                            }`}
                            title={`${cell.count} shift${cell.count === 1 ? "" : "s"} · ${cell.status}`}
                          >
                            {cell.count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overflow > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          + {overflow} more placement{overflow === 1 ? "" : "s"} not shown · filter to narrow.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-blue-500/30" /> Scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-amber-500/30" /> In progress
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-green-500/30" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-red-500/30" /> No-show / Cancelled
        </span>
      </div>
    </div>
  );
}
