import Link from "next/link";
import { loadDashboard } from "@/lib/dashboard";
import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
import {
  Sparkline,
  AreaChart,
  BarChart,
  HorizontalBarChart,
  DonutChart,
  CHART_COLORS,
} from "../_components/charts";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const d = await loadDashboard();

  // Derive sparkline series from the new time-series
  const revenueSpark = d.revenueByDay30.map((p) => p.value);
  const marginSpark = d.marginByDay30.map((p) => p.value);
  const appsSpark = d.applicationsByDay14.map((p) => p.value);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Dashboard</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Overview</h1>
      </header>

      {/* Money row with sparklines */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiSpark
          label="Revenue MTD"
          value={fmtUsd(d.revenueMtd)}
          spark={revenueSpark}
          color={CHART_COLORS.accent}
          accent
        />
        <KpiSpark
          label="Margin this week"
          value={fmtUsd(d.marginThisWeek)}
          hint="bill − pay on logged hours"
          spark={marginSpark}
          color={CHART_COLORS.green}
        />
        <Kpi
          label="Outstanding"
          value={fmtUsd(d.outstanding)}
          hint={d.outstanding > 0 ? "invoices sent" : ""}
        />
        <KpiSpark
          label="Applications (24h)"
          value={`${d.newApplications24h}`}
          spark={appsSpark}
          color={CHART_COLORS.blue}
          link="/admin/applications"
        />
      </section>

      {/* Ops row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active workers" value={`${d.activeWorkers}`} link="/admin/workers" />
        <Kpi label="Active placements" value={`${d.activePlacements}`} link="/admin/placements" />
        <Kpi label="Open jobs" value={`${d.openJobs}`} link="/admin/jobs" />
        <Kpi
          label="Pending review"
          value={`${d.pendingTimesheets}`}
          unit="entries"
          link="/admin/timesheet"
        />
      </section>

      {/* Live: who's on the clock right now */}
      {d.liveOnTheClock.length > 0 && (
        <section className="rounded-xl border border-green-500/40 bg-green-500/5 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              On the clock right now ({d.liveOnTheClock.length})
            </h2>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {d.liveOnTheClock.slice(0, 12).map((e) => {
              const minutes = Math.floor((Date.now() - +new Date(e.clockInAt)) / 60000);
              return (
                <li
                  key={e.id}
                  className="flex items-baseline justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{e.worker}</div>
                    <div className="truncate text-xs text-muted-foreground">{e.placement}</div>
                  </div>
                  <span className="shrink-0 text-xs font-mono text-muted-foreground tabular-nums">
                    {minutes >= 60
                      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
                      : `${minutes}m`}
                  </span>
                </li>
              );
            })}
          </ul>
          {d.liveOnTheClock.length > 12 && (
            <p className="mt-3 text-xs text-muted-foreground">
              + {d.liveOnTheClock.length - 12} more clocked in
            </p>
          )}
        </section>
      )}

      {/* Revenue trend */}
      {d.revenueByDay30.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Revenue · last 30 days
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtUsd(d.revenueByDay30.reduce((s, x) => s + x.value, 0))} total
            </span>
          </div>
          <div className="mt-4 text-foreground">
            <AreaChart
              data={d.revenueByDay30}
              height={220}
              yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
              color={CHART_COLORS.accent}
              xLabels={6}
            />
          </div>
        </section>
      )}

      {/* Hours chart + activity */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Hours this week
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtHours(d.hoursThisWeek, { decimals: 0 })} total
            </span>
          </div>
          <div className="mt-4 text-foreground">
            <BarChart
              data={d.hoursByDay.map((b) => ({ label: b.day, value: b.hours }))}
              height={180}
              yFormatter={(n) => fmtNum(n)}
              color={CHART_COLORS.accent}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {d.recentActivity.length === 0 && (
              <li className="text-muted-foreground">No activity yet.</li>
            )}
            {d.recentActivity.map((a, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span
                  className={
                    a.type === "application"
                      ? "h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                      : a.type === "invoice"
                      ? "h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      : "h-1.5 w-1.5 shrink-0 rounded-full bg-green-500"
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{a.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Active projects */}
      {d.activeProjects.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Active projects ({d.activeProjects.length})
            </h2>
            <Link
              href="/admin/projects"
              className="text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              All projects →
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {d.activeProjects.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="block rounded-lg border border-border/60 p-4 transition hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold tracking-tight">{p.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.employer}</div>
                    </div>
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                      {p.activeWorkers} workers
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Hours
                      </div>
                      <div className="font-mono tabular-nums">{fmtNum(p.hours)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Revenue
                      </div>
                      <div className="font-mono tabular-nums">{fmtUsd(p.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Margin
                      </div>
                      <div className="font-mono tabular-nums text-accent">{fmtUsd(p.margin)}</div>
                    </div>
                  </div>
                  {p.budgetPct != null && (
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                        <span>{p.budgetPct}% of budget</span>
                        {p.budgetAmount && <span>{fmtUsd(p.budgetAmount)} cap</span>}
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${
                            p.budgetPct > 90
                              ? "bg-red-500"
                              : p.budgetPct > 75
                              ? "bg-amber-500"
                              : "bg-accent"
                          }`}
                          style={{ width: `${p.budgetPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Top employers / workers / workforce mix */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Top employers (90d revenue)
          </h2>
          <div className="mt-4 text-foreground">
            <HorizontalBarChart
              data={d.topEmployers.map((e) => ({ label: e.name, value: e.revenue }))}
              formatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
              color={CHART_COLORS.accent}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Top workers (30d hours)
          </h2>
          <div className="mt-4 text-foreground">
            <HorizontalBarChart
              data={d.topWorkers.map((w) => ({ label: w.name, value: w.hours }))}
              formatter={(n) => fmtHours(n, { decimals: 0 })}
              color={CHART_COLORS.green}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Workforce mix
          </h2>
          <div className="mt-4 text-foreground">
            <DonutChart
              data={[
                {
                  label: "Active",
                  value: d.workersByStatus.active,
                  color: CHART_COLORS.green,
                },
                {
                  label: "Onboarding",
                  value: d.workersByStatus.onboarding,
                  color: CHART_COLORS.amber,
                },
                {
                  label: "Inactive",
                  value: d.workersByStatus.inactive,
                  color: CHART_COLORS.muted,
                },
              ]}
            />
          </div>
        </div>
      </section>

      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <p className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Showing demo data — connect Supabase + run{" "}
          <code className="font-mono text-xs">supabase/seed.sql</code> +{" "}
          <code className="font-mono text-xs">supabase/seed_workforce.sql</code> to populate.
        </p>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  hint,
  accent,
  link,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  accent?: boolean;
  link?: string;
}) {
  const inner = (
    <div
      className={`rounded-xl border border-border p-5 ${
        accent ? "bg-accent/10" : "bg-background"
      } ${link ? "transition hover:border-foreground/30" : ""}`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

function KpiSpark({
  label,
  value,
  hint,
  spark,
  color,
  accent,
  link,
}: {
  label: string;
  value: string;
  hint?: string;
  spark: number[];
  color: string;
  accent?: boolean;
  link?: string;
}) {
  const inner = (
    <div
      className={`rounded-xl border border-border p-5 ${
        accent ? "bg-accent/10" : "bg-background"
      } ${link ? "transition hover:border-foreground/30" : ""}`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {spark.length > 0 && (
        <div className="mt-3 -mx-1">
          <Sparkline data={spark} stroke={color} fill={color} height={28} />
        </div>
      )}
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}
