import Link from "next/link";
import { loadDashboard } from "@/lib/dashboard";
import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const d = await loadDashboard();
  const maxHours = Math.max(1, ...d.hoursByDay.map((h) => h.hours));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Dashboard</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Overview</h1>
      </header>

      {/* Money row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Revenue MTD"
          value={fmtUsd(d.revenueMtd)}
          accent
        />
        <Kpi
          label="Margin this week"
          value={fmtUsd(d.marginThisWeek)}
          hint="bill − pay on logged hours"
        />
        <Kpi
          label="Outstanding"
          value={fmtUsd(d.outstanding)}
          hint={d.outstanding > 0 ? "invoices sent" : ""}
        />
        <Kpi
          label="Pending review"
          value={`${d.pendingTimesheets}`}
          unit="entries"
          link="/admin/timesheet"
        />
      </section>

      {/* Ops row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active workers" value={`${d.activeWorkers}`} link="/admin/workers" />
        <Kpi label="Active placements" value={`${d.activePlacements}`} link="/admin/placements" />
        <Kpi label="Open jobs" value={`${d.openJobs}`} link="/admin/jobs" />
        <Kpi label="Applications (24h)" value={`${d.newApplications24h}`} link="/admin/applications" />
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

      {/* Hours chart + activity */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Hours this week
            </h2>
            <span className="text-xs text-muted-foreground">{d.hoursThisWeek} total</span>
          </div>
          <div className="mt-5 grid grid-cols-7 items-end gap-2 h-40">
            {d.hoursByDay.map((b) => {
              const heightPct = Math.round((b.hours / maxHours) * 100);
              return (
                <div key={b.day} className="flex h-full flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t bg-accent"
                    style={{ height: `${heightPct}%`, minHeight: b.hours > 0 ? "4px" : "0" }}
                    title={`${b.hours}h`}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">{b.day}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{b.hours}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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

      {/* Top employers + workers */}
      <section className="grid gap-6 lg:grid-cols-2">
        <RankCard
          title="Top employers (90d revenue)"
          rows={d.topEmployers.map((e) => ({ label: e.name, value: fmtUsd(e.revenue) }))}
        />
        <RankCard
          title="Top workers (30d hours)"
          rows={d.topWorkers.map((w) => ({ label: w.name, value: fmtHours(w.hours, { decimals: 0 }) }))}
        />
      </section>

      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <p className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Showing empty state — connect Supabase + run{" "}
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
      className={`relative rounded-lg border border-border p-5 ${
        accent ? "bg-accent/10" : "bg-background"
      } ${link ? "transition hover:border-accent" : ""}`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

function RankCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <ol className="mt-4 space-y-2 text-sm">
        {rows.length === 0 && <li className="text-muted-foreground">No data yet.</li>}
        {rows.map((r, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-muted-foreground">{i + 1}.</span>
              <span className="font-medium">{r.label}</span>
            </span>
            <span className="font-mono">{r.value}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
