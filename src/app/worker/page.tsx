import { redirect } from "next/navigation";
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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wider text-muted-foreground">Hi {worker.full_name.split(" ")[0]} 👋</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {open ? "You're clocked in" : "Ready to clock in?"}
        </h1>
      </header>

      {open ? (
        <ClockedInPanel open={open} />
      ) : (
        <ClockInPanel placements={activePlacements} />
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Stat label="Hours this week" value={week.hours.toFixed(2)} unit="hrs" />
        <Stat label="Shifts this week" value={String(week.shifts.length)} unit="" />
      </section>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">
        {value}
        <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function ClockedInPanel({
  open,
}: {
  open: { id: string; clock_in_at: string };
}) {
  const since = new Date(open.clock_in_at).toLocaleString();
  return (
    <form
      action={clockOut}
      className="rounded-2xl border-2 border-green-500/40 bg-green-500/5 p-6"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
        On the clock since {since}
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-medium">Break minutes (today)</span>
        <input
          name="break_minutes"
          type="number"
          min={0}
          defaultValue={0}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
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
      <div className="rounded-2xl border-2 border-border bg-muted/40 p-6 text-center">
        <p className="text-muted-foreground">No active placements yet. Vertex will assign you soon.</p>
      </div>
    );
  }
  return (
    <form action={clockIn} className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-6">
      <label className="block">
        <span className="text-sm font-medium">Placement</span>
        <select
          name="placement_id"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {placements.map((p) => (
            <option key={p.id} value={p.id}>
              {p.employer?.name ?? "—"} · {p.role_title}
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
