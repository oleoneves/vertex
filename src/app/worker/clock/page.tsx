import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getCurrentWorker, getOpenTimeEntry } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { clockIn, clockOut } from "../actions";
import { ClockForm } from "../clock-form";

export const dynamic = "force-dynamic";

export default async function WorkerClockPage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/clock");
  const locale = await getLocale();
  const supabase = await getSupabaseServer();

  const [open, placementsRes] = await Promise.all([
    getOpenTimeEntry(worker.id),
    supabase
      .from("placements")
      .select("id, role_title, employer:employers(name)")
      .eq("worker_id", worker.id)
      .eq("status", "active"),
  ]);
  const placements =
    (placementsRes.data as unknown as Array<{
      id: string;
      role_title: string;
      employer: { name: string } | null;
    }>) ?? [];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {open ? t(locale, "w.today.on_the_clock") : t(locale, "w.today.ready")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {open
            ? "Aperte clock-out quando terminar."
            : "Selecione onde está trabalhando e aperte clock-in."}
        </p>
      </header>

      {open ? (
        <ClockForm
          action={clockOut}
          className="rounded-2xl border-2 border-green-500/40 bg-green-500/5 p-6"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
            {t(locale, "w.today.clocked_in")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">
            {new Date(open.clock_in_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <RunningElapsed from={open.clock_in_at} />

          <label className="mt-5 block text-sm">
            <span className="font-medium">{t(locale, "w.today.break_minutes")}</span>
            <input
              type="number"
              name="break_minutes"
              defaultValue="0"
              min="0"
              step="5"
              className="mt-1 w-28 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>

          <button
            type="submit"
            className="mt-5 inline-flex h-16 w-full items-center justify-center rounded-xl bg-foreground px-6 text-xl font-extrabold text-background hover:opacity-90"
          >
            {t(locale, "w.today.clock_out")} →
          </button>
        </ClockForm>
      ) : placements.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">{t(locale, "w.today.no_placements_title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(locale, "w.today.no_placements_body")}
            </p>
          </div>
        </div>
      ) : (
        <ClockForm
          action={clockIn}
          captureGeo
          className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-6"
        >
          <input type="hidden" name="location" defaultValue="" />
          <label className="block">
            <span className="text-sm font-medium">{t(locale, "w.today.where")}</span>
            <select
              name="placement_id"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
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
            className="mt-5 inline-flex h-16 w-full items-center justify-center rounded-xl bg-accent px-6 text-xl font-extrabold text-accent-foreground hover:opacity-90"
          >
            {t(locale, "w.today.clock_in")} →
          </button>
        </ClockForm>
      )}
    </div>
  );
}

function RunningElapsed({ from }: { from: string }) {
  const ms = Date.now() - new Date(from).getTime();
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return (
    <p className="mt-2 font-mono text-sm tabular-nums text-muted-foreground">
      Elapsed: {hrs}h {String(mins).padStart(2, "0")}m
    </p>
  );
}
