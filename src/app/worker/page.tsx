import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Calendar, TrendingUp, AlertCircle, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { getCurrentWorker, getOpenTimeEntry, getWorkerWeek } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { t, type TKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { clockIn, clockOut } from "./actions";
import { ClockForm } from "./clock-form";

import { fmtNum, fmtUsd } from "@/lib/format";
export const dynamic = "force-dynamic";

export default async function WorkerDashboard() {
  const worker = await getCurrentWorker();
  if (!worker) {
    redirect("/worker/login?next=/worker");
  }
  const locale = await getLocale();
  const supabase = await getSupabaseServer();

  const [open, placements, week, projectsRes] = await Promise.all([
    getOpenTimeEntry(worker.id),
    supabase
      .from("placements")
      .select(
        "id, role_title, employer:employers(name), project:projects(name)",
      )
      .eq("worker_id", worker.id)
      .eq("status", "active"),
    getWorkerWeek(worker.id),
    supabase
      .from("time_entries")
      .select(
        "hours_worked, approved, placement:placements!inner(project:projects(id, name), employer:employers(name), role_title)",
      )
      .eq("worker_id", worker.id)
      .order("clock_in_at", { ascending: false })
      .limit(1000),
  ]);

  const activePlacements =
    (placements.data as unknown as Array<{
      id: string;
      role_title: string;
      employer: { name: string } | null;
      project: { name: string } | null;
    }>) ?? [];

  // Aggregate hours per project across all (approved + pending)
  type EntryWithRel = {
    hours_worked: number | null;
    approved: boolean;
    placement: {
      project: { id: string; name: string } | null;
      employer: { name: string } | null;
      role_title: string;
    } | null;
  };
  const projectAgg = new Map<
    string,
    { name: string; employer: string | null; approved: number; pending: number }
  >();
  for (const e of ((projectsRes.data as unknown as EntryWithRel[]) ?? [])) {
    const proj = e.placement?.project;
    const key = proj?.id ?? `noproject-${e.placement?.employer?.name ?? "—"}`;
    const name = proj?.name ?? e.placement?.employer?.name ?? "Unassigned";
    const row = projectAgg.get(key) ?? {
      name,
      employer: e.placement?.employer?.name ?? null,
      approved: 0,
      pending: 0,
    };
    const h = Number(e.hours_worked ?? 0);
    if (e.approved) row.approved += h;
    else row.pending += h;
    projectAgg.set(key, row);
  }
  const myProjects = Array.from(projectAgg.values()).sort(
    (a, b) => b.approved + b.pending - (a.approved + a.pending),
  );

  const firstName = worker.full_name.split(" ")[0];
  const greeting = greetingKeyFor(new Date());

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wider text-muted-foreground">
          {t(locale, greeting)}, {firstName} 👋
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {open ? t(locale, "w.today.on_the_clock") : t(locale, "w.today.ready")}
        </h1>
      </header>

      {open ? (
        <ClockedInPanel open={open} locale={locale} />
      ) : (
        <ClockInPanel placements={activePlacements} locale={locale} />
      )}

      {/* Big earnings card */}
      <section className="rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
              <DollarSign className="inline h-3 w-3" /> Você ganhou esta semana
            </p>
            <p className="mt-2 font-mono text-4xl font-extrabold tabular-nums text-green-700 dark:text-green-400">
              {fmtUsd(week.earnings)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {fmtNum(week.hours, { decimals: 2 })} hrs trabalhadas
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          label="Dias trabalhados"
          value={String(week.daysWorked)}
          unit="esta semana"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          label="Dias não trabalhados"
          value={String(week.daysMissed)}
          unit="dias úteis"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label={t(locale, "w.today.hours_week")}
          value={fmtNum(week.hours, { decimals: 2 })}
          unit="hrs"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t(locale, "w.today.active_placements")}
          value={String(activePlacements.length)}
        />
      </section>

      {/* My projects with hours */}
      {myProjects.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Meus projetos
          </h2>
          <ul className="mt-4 space-y-2">
            {myProjects.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  {p.employer && (
                    <div className="truncate text-xs text-muted-foreground">
                      {p.employer}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold tabular-nums">
                    {fmtNum(p.approved, { decimals: 2 })} hrs
                  </div>
                  {p.pending > 0 && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">
                      +{fmtNum(p.pending, { decimals: 2 })} pendente
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {week.shifts.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "w.today.this_week")}
            </h2>
            <Link
              href="/worker/shifts"
              className="text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              {t(locale, "w.today.view_all")} →
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
                        {start.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="text-muted-foreground">
                        {start.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}–
                        {end.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
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

function greetingKeyFor(d: Date): TKey {
  const h = d.getHours();
  if (h < 12) return "w.greeting.morning";
  if (h < 18) return "w.greeting.afternoon";
  return "w.greeting.evening";
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
  locale,
}: {
  open: { id: string; clock_in_at: string };
  locale: "en" | "es" | "pt";
}) {
  const since = new Date(open.clock_in_at);
  return (
    <ClockForm
      action={clockOut}
      className="rounded-2xl border-2 border-green-500/40 bg-green-500/5 p-6"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        {t(locale, "w.today.on_clock_since")}{" "}
        {since.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
      </div>
      <label className="mt-5 block">
        <span className="text-sm font-medium">{t(locale, "w.today.break_minutes")}</span>
        <input
          name="break_minutes"
          type="number"
          min={0}
          defaultValue={0}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          {t(locale, "w.today.break_hint")}
        </span>
      </label>
      <button
        type="submit"
        className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-xl bg-foreground px-6 text-lg font-extrabold text-background hover:opacity-90"
      >
        {t(locale, "w.today.clock_out")}
      </button>
    </ClockForm>
  );
}

function ClockInPanel({
  placements,
  locale,
}: {
  placements: Array<{ id: string; role_title: string; employer: { name: string } | null }>;
  locale: "en" | "es" | "pt";
}) {
  if (placements.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">{t(locale, "w.today.no_placements_title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(locale, "w.today.no_placements_body")}
          </p>
        </div>
      </div>
    );
  }
  return (
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
        {t(locale, "w.today.clock_in")} →
      </button>
    </ClockForm>
  );
}
