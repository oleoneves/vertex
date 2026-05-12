import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { getCurrentWorker, getOpenTimeEntry, getWorkerWeek } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { clockIn, clockOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function WorkerDashboard() {
  const worker = await getCurrentWorker();
  if (!worker) {
    redirect("/worker/login?next=/worker");
  }
  const supabase = await getSupabaseServer();

  const [open, placements, week] = await Promise.all([
    getOpenTimeEntry(worker.id),
    supabase
      .from("placements")
      .select("id, role_title, employer:employers(name)")
      .eq("worker_id", worker.id)
      .eq("status", "active"),
    getWorkerWeek(worker.id),
  ]);

  const activePlacements =
    (placements.data as unknown as Array<{
      id: string;
      role_title: string;
      employer: { name: string } | null;
    }>) ?? [];

  const firstName = worker.full_name.split(" ")[0];
  const greeting = greetingFor(new Date());

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wider text-muted-foreground">
          {greeting}, {firstName} 👋
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {open ? "You're on the clock" : "Ready to start your day?"}
        </h1>
      </header>

      {open ? (
        <ClockedInPanel open={open} />
      ) : (
        <ClockInPanel placements={activePlacements} />
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Hours this week"
          value={week.hours.toFixed(2)}
          unit="hrs"
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Shifts this week"
          value={String(week.shifts.length)}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Active placements"
          value={String(activePlacements.length)}
        />
      </section>

      {week.shifts.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              This week
            </h2>
            <Link
              href="/worker/shifts"
              className="text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {week.shifts.slice(0, 5).map((s) => {
              const start = new Date(s.scheduled_start);
              const end = new Date(s.scheduled_end);
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold">
                        {start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="text-muted-foreground">
                        {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}–
                        {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.placement?.employer?.name ?? "—"} · {s.placement?.role_title ?? "—"}
                    </div>
                  </div>
                  <span
                    className={
                      s.status === "completed"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : s.status === "in_progress"
                        ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    }
                  >
                    {s.status.replace("_", " ")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

function ClockedInPanel({
  open,
}: {
  open: { id: string; clock_in_at: string };
}) {
  const since = new Date(open.clock_in_at);
  return (
    <form
      action={clockOut}
      className="rounded-2xl border-2 border-green-500/40 bg-green-500/5 p-6"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        On the clock since {since.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </div>
      <label className="mt-5 block">
        <span className="text-sm font-medium">Break minutes today</span>
        <input
          name="break_minutes"
          type="number"
          min={0}
          defaultValue={0}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Total unpaid break time during this shift.
        </span>
      </label>
      <button
        type="submit"
        className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-xl bg-foreground px-6 text-lg font-extrabold text-background hover:opacity-90"
      >
        Clock out
      </button>
    </form>
  );
}

function ClockInPanel({
  placements,
}: {
  placements: Array<{ id: string; role_title: string; employer: { name: string } | null }>;
}) {
  if (placements.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">No active placements yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Vertex will assign you to an employer soon. You&apos;ll see your shifts here when ready.
          </p>
        </div>
      </div>
    );
  }
  return (
    <form action={clockIn} className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-6">
      <label className="block">
        <span className="text-sm font-medium">Where are you working today?</span>
        <select
          name="placement_id"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {placements.map((p) => (
            <option key={p.id} value={p.id}>
              {p.employer?.name ?? "—"} — {p.role_title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-xl bg-accent px-6 text-lg font-extrabold text-accent-foreground hover:opacity-90"
      >
        Clock in →
      </button>
    </form>
  );
}
