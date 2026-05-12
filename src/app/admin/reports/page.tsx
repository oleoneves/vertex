import { Download, TrendingUp } from "lucide-react";
import { loadReports } from "@/lib/reports";
import { PageHeader } from "../_components/page-header";

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
  const r = await loadReports({ months: 6 });
  const maxMargin = Math.max(1, ...r.monthly.map((m) => m.margin));
  const last = r.monthly[r.monthly.length - 1];
  const prev = r.monthly[r.monthly.length - 2];
  const marginDelta = last && prev ? last.margin - prev.margin : 0;

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
        <Kpi label="Hours" value={r.totals.hours.toFixed(1)} unit="hrs" />
        <Kpi label="Revenue" value={`$${r.totals.revenue.toFixed(0)}`} />
        <Kpi label="Worker pay" value={`$${r.totals.cost.toFixed(0)}`} />
        <Kpi
          label="Gross margin"
          value={`$${r.totals.margin.toFixed(0)}`}
          accent
          hint={marginDelta !== 0 ? `${marginDelta >= 0 ? "+" : ""}${marginDelta.toFixed(0)} vs last month` : undefined}
        />
      </section>

      {/* Monthly bars */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Monthly margin
        </h2>
        <div className="mt-6 grid grid-cols-6 items-end gap-3 h-44">
          {r.monthly.map((m) => {
            const heightPct = Math.round((m.margin / maxMargin) * 100);
            return (
              <div key={m.month} className="flex h-full flex-col items-center justify-end">
                <div
                  className="w-full rounded-t bg-accent transition-all"
                  style={{ height: `${heightPct}%`, minHeight: m.margin > 0 ? "6px" : 0 }}
                  title={`$${m.margin.toFixed(0)}`}
                />
                <div className="mt-2 text-xs text-muted-foreground">{monthLabel(m.month)}</div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  ${Math.round(m.margin)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* By employer */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          By employer (6mo)
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
                  <td className="py-2 text-right font-mono tabular-nums">{e.hours.toFixed(1)}</td>
                  <td className="py-2 text-right font-mono tabular-nums">${e.revenue.toFixed(0)}</td>
                  <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                    ${e.cost.toFixed(0)}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums font-semibold text-accent">
                    ${e.margin.toFixed(0)}
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
                  <td className="py-2 text-right font-mono tabular-nums">{w.hours.toFixed(1)}</td>
                  <td className="py-2 text-right font-mono tabular-nums">${w.pay.toFixed(0)}</td>
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
