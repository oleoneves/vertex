import { Download, TrendingUp } from "lucide-react";
import { PrintButton } from "./print-button";
import { loadReports } from "@/lib/reports";
import { loadDashboard } from "@/lib/dashboard";
import { PageHeader } from "../_components/page-header";
import { FilterBar } from "../_components/filter-bar";
import { fmtUsd, fmtNum } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
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

const RANGE_OPTIONS = {
  "7d":   { months: 0,  label: "Last 7 days",   labelPt: "Últimos 7 dias" },
  "30d":  { months: 1,  label: "Last 30 days",  labelPt: "Últimos 30 dias" },
  "3mo":  { months: 3,  label: "Last 3 months", labelPt: "Últimos 3 meses" },
  "6mo":  { months: 6,  label: "Last 6 months", labelPt: "Últimos 6 meses" },
  "12mo": { months: 12, label: "Last 12 months", labelPt: "Últimos 12 meses" },
  "24mo": { months: 24, label: "Last 24 months", labelPt: "Últimos 24 meses" },
} as const;
type RangeKey = keyof typeof RANGE_OPTIONS;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const locale = await getLocale();
  const sp = await searchParams;
  const range: RangeKey = (Object.keys(RANGE_OPTIONS) as RangeKey[]).includes(sp.range as RangeKey)
    ? (sp.range as RangeKey)
    : "6mo";
  const months = Math.max(1, RANGE_OPTIONS[range].months);
  const [r, dash] = await Promise.all([
    loadReports({ months }),
    loadDashboard(),
  ]);
  const last = r.monthly[r.monthly.length - 1];
  const prev = r.monthly[r.monthly.length - 2];
  const marginDelta = last && prev ? last.margin - prev.margin : 0;

  // Charts respect the selected period filter — always use r.monthly (which is windowed)
  // unless r.monthly is empty AND dashboard has its own 6mo series (legacy fallback).
  const monthly =
    r.monthly.length > 0
      ? r.monthly.map((m) => ({
          month: m.month,
          label: monthLabel(m.month),
          revenue: m.revenue,
          cost: m.cost,
          margin: m.margin,
        }))
      : dash.monthlyRevenue;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t(locale, "a.reports.title")}
        subtitle={t(locale, "a.reports.subtitle")}
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
        <PrintButton />
      </PageHeader>

      <FilterBar
        filters={[
          {
            name: "range",
            label: "Period",
            value: range,
            options: (Object.keys(RANGE_OPTIONS) as RangeKey[]).map((k) => ({
              value: k,
              label: locale === "pt" ? RANGE_OPTIONS[k].labelPt : RANGE_OPTIONS[k].label,
            })),
          },
        ]}
      />

      {/* Totals */}
      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label={t(locale, "a.reports.hours")} value={fmtNum(r.totals.hours, { decimals: 1 })} unit="hrs" />
        <Kpi label={t(locale, "a.reports.revenue")} value={fmtUsd(r.totals.revenue)} />
        <Kpi label={t(locale, "a.reports.worker_pay")} value={fmtUsd(r.totals.cost)} />
        <Kpi
          label={t(locale, "a.reports.gross_margin")}
          value={fmtUsd(r.totals.margin)}
          accent
          hint={
            marginDelta !== 0
              ? `${marginDelta >= 0 ? "+" : "−"}${fmtUsd(Math.abs(marginDelta))} ${t(locale, "a.reports.vs_last_month")}`
              : undefined
          }
        />
      </section>

      {/* Revenue vs cost (stacked) */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t(locale, "a.reports.revenue_cost_margin")}
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <Legend color={CHART_COLORS.slate} label={t(locale, "a.reports.worker_pay")} />
            <Legend color={CHART_COLORS.accent} label={t(locale, "a.reports.margin")} />
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
            {t(locale, "a.reports.monthly_revenue")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {t(locale, "a.reports.total")}: {fmtUsd(monthly.reduce((s, m) => s + m.revenue, 0))}
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
            {t(locale, "a.reports.pl_6mo")}
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <Legend color={CHART_COLORS.accent} label={t(locale, "a.reports.revenue")} />
            <Legend color={CHART_COLORS.slate} label={t(locale, "a.reports.worker_pay")} />
            <Legend color={CHART_COLORS.green} label={t(locale, "a.reports.margin")} />
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
            {t(locale, "a.reports.rev_by_employer")}
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
            {t(locale, "a.reports.margin_by_employer")}
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
          {t(locale, "a.reports.by_employer_detail")}
        </h2>
        {r.byEmployer.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t(locale, "a.reports.no_hours")}</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-2">{t(locale, "a.col.employer")}</th>
                <th className="pb-2 text-right">{t(locale, "a.col.hours")}</th>
                <th className="pb-2 text-right">{t(locale, "a.reports.revenue")}</th>
                <th className="pb-2 text-right">{t(locale, "a.reports.cost")}</th>
                <th className="pb-2 text-right">{t(locale, "a.reports.margin")}</th>
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

      {/* Top 10 project managers (by employer) */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4" /> Top 10 project managers
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ranked by total invoice value in the selected period. Margin = invoice value − estimated labor cost (uses the employer's pay/bill ratio).
        </p>
        {r.byProjectManager.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
            No invoices in the selected period have a project manager assigned yet.
            Set one on the invoice edit page to see PMs ranked here.
          </p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-2">#</th>
                <th className="pb-2">Project manager</th>
                <th className="pb-2">Employer</th>
                <th className="pb-2 text-right">Invoices</th>
                <th className="pb-2 text-right">Total invoiced</th>
                <th className="pb-2 text-right">Est. cost</th>
                <th className="pb-2 text-right">Vertex margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {r.byProjectManager.slice(0, 10).map((p, i) => (
                <tr key={`${p.employer}-${p.project_manager}`}>
                  <td className="py-2 text-xs font-mono text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 font-medium">{p.project_manager}</td>
                  <td className="py-2 text-muted-foreground">{p.employer}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{p.invoice_count}</td>
                  <td className="py-2 text-right font-mono tabular-nums font-bold">
                    {fmtUsd(p.revenue)}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {fmtUsd(p.cost)}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums font-bold text-accent">
                    {fmtUsd(p.margin)}
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
          <TrendingUp className="h-4 w-4" /> {t(locale, "a.reports.top_workers_6mo")}
        </h2>
        {r.byWorker.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t(locale, "a.reports.no_hours")}</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-2">{t(locale, "a.col.worker")}</th>
                <th className="pb-2 text-right">{t(locale, "a.col.hours")}</th>
                <th className="pb-2 text-right">Worker earned</th>
                <th className="pb-2 text-right">Vertex margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {r.byWorker.map((w) => (
                <tr key={w.worker}>
                  <td className="py-2 font-medium">{w.worker}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{fmtNum(w.hours, { decimals: 1 })}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{fmtUsd(w.pay)}</td>
                  <td className="py-2 text-right font-mono tabular-nums font-bold text-accent">
                    {fmtUsd(w.margin)}
                  </td>
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
