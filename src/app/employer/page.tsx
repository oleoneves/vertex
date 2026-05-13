import Link from "next/link";
import { redirect } from "next/navigation";
import { TrendingUp, Clock, Receipt, AlertCircle } from "lucide-react";
import { getCurrentEmployer, getEmployerDashboard } from "@/lib/employer";
import { fmtUsd, fmtHours, fmtNum } from "@/lib/format";
import {
  AreaChart,
  BarChart,
  Sparkline,
  CHART_COLORS,
} from "../_components/charts";

export const dynamic = "force-dynamic";

export default async function EmployerOverview() {
  const scope = await getCurrentEmployer();
  if (!scope) redirect("/employer/login");
  const d = await getEmployerDashboard(scope.employerId);

  const hoursSpark = d.hoursByDay14.map((p) => p.value);
  const spendSpark = d.spendByDay14.map((p) => p.value);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {scope.employer.name}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Overview</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiSpark
          icon={<TrendingUp className="h-4 w-4" />}
          label="Active workers"
          value={String(d.activePlacements)}
          spark={[]}
          color={CHART_COLORS.accent}
          link="/employer/workers"
        />
        <KpiSpark
          icon={<Clock className="h-4 w-4" />}
          label="Hours (last 7d)"
          value={fmtNum(d.hoursWeek, { decimals: 0 })}
          unit="hrs"
          spark={hoursSpark.slice(-7)}
          color={CHART_COLORS.accent}
          link="/employer/hours"
        />
        <KpiSpark
          icon={<Receipt className="h-4 w-4" />}
          label="Outstanding"
          value={fmtUsd(d.outstanding)}
          accent
          spark={spendSpark.slice(-7)}
          color={CHART_COLORS.green}
          link="/employer/invoices"
        />
      </section>

      {/* Hours chart */}
      {d.hoursByDay14.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Hours · last 14 days
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtHours(d.hoursByDay14.reduce((s, x) => s + x.value, 0), { decimals: 0 })} total
            </span>
          </div>
          <div className="mt-4 text-foreground">
            <AreaChart
              data={d.hoursByDay14}
              height={200}
              yFormatter={(n) => fmtNum(n)}
              color={CHART_COLORS.accent}
              xLabels={7}
            />
          </div>
        </section>
      )}

      {/* Weekly spend (6w bars) */}
      {d.weeklySpend6w.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Weekly spend · last 6 weeks
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtUsd(d.weeklySpend6w.reduce((s, x) => s + x.value, 0))} total
            </span>
          </div>
          <div className="mt-4 text-foreground">
            <BarChart
              data={d.weeklySpend6w}
              height={200}
              yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
              color={CHART_COLORS.green}
            />
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <Link
            href="/employer/hours"
            className="text-xs font-medium text-accent underline-offset-4 hover:underline"
          >
            All hours →
          </Link>
        </div>
        {d.recentEntries.length === 0 ? (
          <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/30 p-4 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            No clock-ins yet from the workers placed with you.
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {d.recentEntries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {e.worker?.full_name ?? "Worker"} — {e.placement?.role_title ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.clock_in_at).toLocaleString()}{" "}
                    {e.clock_out_at && (
                      <>
                        → {new Date(e.clock_out_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono tabular-nums font-semibold">
                    {e.hours_worked != null ? fmtHours(e.hours_worked) : "open"}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider">
                    {e.approved ? (
                      <span className="text-green-700 dark:text-green-400">approved</span>
                    ) : e.clock_out_at ? (
                      <span className="text-amber-700 dark:text-amber-400">pending</span>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-400">live</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KpiSpark({
  icon,
  label,
  value,
  unit,
  accent,
  link,
  spark,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  link?: string;
  spark: number[];
  color: string;
}) {
  const inner = (
    <div
      className={`rounded-xl border border-border p-5 ${
        accent ? "bg-accent/10" : "bg-background"
      } ${link ? "transition hover:border-foreground/30" : ""}`}
    >
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {spark.length > 1 && (
        <div className="mt-3 -mx-1 text-foreground">
          <Sparkline data={spark} stroke={color} fill={color} height={28} />
        </div>
      )}
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}
