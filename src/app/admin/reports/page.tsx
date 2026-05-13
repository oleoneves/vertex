import { Download, TrendingUp } from "lucide-react";
import { loadReports } from "@/lib/reports";
import { loadDashboard } from "@/lib/dashboard";
import { PageHeader } from "../_components/page-header";
import { fmtUsd, fmtNum } from "@/lib/format";
import {
  AreaChart,
  StackedBarChart,
  HorizontalBarChart,
  MultiLineChart,
  CHART_COLORS,
} from "../../_components/charts";

export const dynamic = "force-dynamic";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map((s) => Number(s));
  return `${MONTH_LABELS[m - 1]} ${String(y).slice(2)}`;
}

export default async function ReportsPage() {
  const [r, dash] = await Promise.all([
    loadReports({ months: 6 }),
    loadDashboard(),
  ]);
  const last = r.monthly[r.monthly.length - 1];
  const prev = r.monthly[r.monthly.length - 2];
  const marginDelta = last && prev ? last.margin - prev.margin : 0;

  // Use the richer monthlyRevenue from demo when available, else fallback to reports.monthly
  const monthly =
    dash.monthlyRevenue.length > 0
      ? dash.monthlyRevenue
      : r.monthly.map((m) => ({
          month: m.month,
          label: monthLabel(m.month),
          revenue: m.revenue,
          cost: m.cost,
          margin: m.margin,
        }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        subtitle="P&L summary, last 6 months. All figures based on approved hours."
      >
        <a
          href="/api/admin/export?type=timesheet"
          className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" /> Timesheet CSV
        </a>
        <a
          href="/api/admin/export?type=invoices"
          className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" /> Invoices CSV
        </a>
      </PageHeader>

      {/* Totals */}
      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Hours" value={fmtNum(r.totals.hours, { decimals: 1 })} unit="hrs" />
        <Kpi label="Revenue" value={fmtUsd(r.totals.revenue)} />
        <Kpi label="Worker pay" value={fmtUsd(r.totals.cost)} />
        <Kpi
          label="Gross margin"
          value={fmtUsd(r.totals.margin)}
          accent
          hint={
            marginDelta !== 0
              ? `${marginDelta >= 0 ? "+" : "−"}${fmtUsd(Math.abs(marginDelta))} vs last month`
              : undefined
          }
        />
      </section>

      {/* Revenue vs cost (stacked) */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Revenue · cost · margin (6mo)
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <Legend color={CHART_COLORS.slate} label="Worker pay" />
            <Legend color={CHART_COLORS.accent} label="Margin" />
          </div>
        </div>
        <div className="mt-6 text-foreground">
          <StackedBarChart
            data={monthly.map((m) => ({
              label: m.label,
              values: [m.cost, m.margin],
            }))}
            series={[
              { name: "Worker pay", color: CHART_COLORS.slate },
              { name: "Margin", color: CHART_COLORS.accent },
            ]}
            height={240}
            yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
          />
        </div>
      </section>

      {/* Revenue trend line */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Monthly revenue trend
          </h2>
          <span className="text-xs text-muted-foreground">
            Total: {fmtUsd(monthly.reduce((s, m) => s + m.revenue, 0))}
          </span>
        </div>
        <div className="mt-4 text-foreground">
          <AreaChart
            data={monthly.map((m) => ({ label: m.label, value: m.revenue }))}
            height={200}
            yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
            color={CHART_COLORS.accent}
          />
        </div>
      </section>

      {/* Multi-line revenue vs cost vs margin */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            P&L · trailing 6 months
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <Legend color={CHART_COLORS.accent} label="Revenue" />
            <Legend color={CHART_COLORS.slate} label="Worker pay" />
            <Legend color={CHART_COLORS.green} label="Margin" />
          </div>
        </div>
        <div className="mt-4 text-foreground">
          <MultiLineChart
            data={monthly.map((m) => m.label)}
            series={[
              { name: "Revenue", color: CHART_COLORS.accent, values: monthly.map((m) => m.revenue) },
              { name: "Worker pay", color: CHART_COLORS.slate, values: monthly.map((m) => m.cost) },
              { name: "Margin", color: CHART_COLORS.green, values: monthly.map((m) => m.margin) },
            ]}
            height={240}
            yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
          />
        </div>
      </section>

      {/* By employer (chart + table) */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Revenue by employer (6mo)
          </h2>
          <div className="mt-4 text-foreground">
            <HorizontalBarChart
              data={r.byEmployer.slice(0, 8).map((e) => ({
                label: e.employer,
                value: e.revenue,
              }))}
              formatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
              color={CHART_COLORS.accent}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Margin by employer (6mo)
          </h2>
          <div className="mt-4 text-foreground">
            <HorizontalBarChart
              data={r.byEmployer.slice(0, 8).map((e) => ({
                label: e.employer,
                value: e.margin,
              }))}
              formatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
              color={CHART_COLORS.green}
            />
          </div>
        </div>
      </section>

      {/* By employer table */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          By employer · detail
        </h2>
        {r.byEmployer.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No approved hours yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-2">Employer</th>
                <th className="pb-2 text-right">Hours</th>
                <th className="pb-2 text-right">Revenue</th>
                <th className="pb-2 text-right">Cost</th>
                <th className="pb-2 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {r.byEmployer.map((e) => (
                <tr key={e.employer}>
                  <td className="py-2 font-medium">{e.employer}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{fmtNum(e.hours, { decimals: 1 })}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{fmtUsd(e.revenue)}</td>
                  <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {fmtUsd(e.cost)}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums font-semibold text-accent">
                    {fmtUsd(e.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Top workers */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4" /> Top workers (6mo)
        </h2>
        {r.byWorker.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No approved hours yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-2">Worker</th>
                <th className="pb-2 text-right">Hours</th>
                <th className="pb-2 text-right">Pay earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {r.byWorker.map((w) => (
                <tr key={w.worker}>
                  <td className="py-2 font-medium">{w.worker}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{fmtNum(w.hours, { decimals: 1 })}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{fmtUsd(w.pay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  hint,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border p-5 ${
        accent ? "bg-accent/10" : "bg-background"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span
        className="h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
