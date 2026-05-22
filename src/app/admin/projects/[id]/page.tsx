import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, FileCheck2 } from "lucide-react";
import { getProjectDetail } from "@/lib/projects";
import { listProjectTimesheets } from "@/lib/timesheets";
import { getCurrentAdminRole, can } from "@/lib/auth";
import { TimesheetUploader } from "./timesheet-uploader";
import { PageHeader } from "../../_components/page-header";
import { StatusPill } from "../../_components/data-table";
import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { AreaChart, HorizontalBarChart, DonutChart, CHART_COLORS } from "../../../_components/charts";

const ROLE_COLORS = [
  CHART_COLORS.accent,
  CHART_COLORS.green,
  CHART_COLORS.blue,
  CHART_COLORS.amber,
  CHART_COLORS.red,
  CHART_COLORS.slate,
];

export const dynamic = "force-dynamic";

export default async function ProjectDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const [raw, timesheets, role] = await Promise.all([
    getProjectDetail(id),
    listProjectTimesheets(id),
    getCurrentAdminRole(),
  ]);
  if (!raw) notFound();
  const showMoney = can(role, "view_financials");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = raw as any;
  const { project, placements, activeWorkers, totalWorkers, totals, days, roleRows, recentEntries } = data as {
    project: { name: string; budget_hours: number | null; budget_amount: number | null; status: string; employer: { name: string } | null; location: string | null; start_date: string | null; end_date: string | null };
    placements: Array<{ id: string; worker_id: string; status: string; role_title: string; worker: { full_name: string } | null }>;
    activeWorkers: number;
    totalWorkers: number;
    totals: { hours: number; revenue: number; margin: number; pendingHours: number };
    days: Array<{ day: string; label: string; hours: number }>;
    roleRows: Array<{ role: string; headcount: number; hours: number }>;
    recentEntries: Array<{ id: string; clock_in_at: string; clock_out_at: string | null; hours_worked: number | null; approved: boolean; worker: { full_name: string } | null }>;
  };

  const budgetHoursPct = project.budget_hours
    ? Math.min(100, Math.round((totals.hours / Number(project.budget_hours)) * 100))
    : null;
  const budgetAmountPct = project.budget_amount
    ? Math.min(100, Math.round((totals.revenue / Number(project.budget_amount)) * 100))
    : null;

  return (
    <div>
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Projects
      </Link>

      <PageHeader
        title={project.name}
        subtitle={project.employer?.name ?? ""}
      >
        <StatusPill
          status={project.status}
          variant={
            project.status === "active"
              ? "green"
              : project.status === "completed"
              ? "muted"
              : project.status === "paused"
              ? "amber"
              : "red"
          }
        />
        <Link
          href="/admin/shifts/bulk"
          className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-bold text-accent-foreground hover:opacity-90"
        >
          Bulk schedule
        </Link>
        <Link
          href={`/admin/invoices/new`}
          className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          + Invoice
        </Link>
        <TimesheetUploader projectId={id} defaultEmployerName={project.employer?.name} />
      </PageHeader>

      {/* Meta strip */}
      <section className="mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        {project.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {project.location}
          </span>
        )}
        {project.start_date && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {project.start_date} → {project.end_date ?? "ongoing"}
          </span>
        )}
      </section>

      {/* KPI row */}
      <section className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Active workers" value={String(activeWorkers)} subValue={`${totalWorkers} placed total`} />
        <Kpi
          label="Approved hours"
          value={project.budget_hours ? fmtNum(Number(project.budget_hours)) : "—"}
          unit={project.budget_hours ? "hrs" : undefined}
          subValue="contracted / estimate"
        />
        <Kpi
          label="Used hours (so far)"
          value={fmtNum(totals.hours)}
          unit="hrs"
          accent
          subValue={
            project.budget_hours
              ? `${Math.round((totals.hours / Number(project.budget_hours)) * 100)}% of approved`
              : totals.pendingHours > 0
              ? `+${fmtNum(totals.pendingHours)} pending`
              : undefined
          }
        />
        {showMoney ? (
          <Kpi
            label={t(locale, "a.dash.revenue")}
            value={fmtUsd(totals.revenue)}
            accent
            subValue={`${fmtUsd(totals.margin)} margin`}
          />
        ) : (
          <Kpi
            label="Pending hours"
            value={fmtNum(totals.pendingHours)}
            unit="hrs"
            subValue="awaiting approval"
          />
        )}
      </section>

      {/* Budgets — only if super_admin sees financials, or just hours when not */}
      {(project.budget_hours || (showMoney && project.budget_amount)) && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {project.budget_hours && (
            <Budget
              label={t(locale, "a.proj.hours_budget")}
              used={totals.hours}
              cap={Number(project.budget_hours)}
              pct={budgetHoursPct ?? 0}
              unit="hrs"
            />
          )}
          {showMoney && project.budget_amount && (
            <Budget
              label={t(locale, "a.proj.dollar_budget")}
              used={totals.revenue}
              cap={Number(project.budget_amount)}
              pct={budgetAmountPct ?? 0}
              unit="$"
              prefix
            />
          )}
        </section>
      )}

      {/* Hours trend + burn-down */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.proj.hours_14")}
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtHours(days.reduce((s, d) => s + d.hours, 0), { decimals: 0 })} {t(locale, "a.dash.hours_total")}
            </span>
          </div>
          <div className="mt-4 text-foreground">
            <AreaChart
              data={days.map((d) => ({ label: d.label, value: d.hours }))}
              height={200}
              yFormatter={(n) => fmtNum(n)}
              color={CHART_COLORS.accent}
              xLabels={7}
            />
          </div>
        </div>

        {showMoney && project.budget_amount && (
          <div className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t(locale, "a.proj.budget_burn")}
              </h2>
              <span className="text-xs text-muted-foreground">
                {budgetAmountPct ?? 0}% {t(locale, "a.proj.used")}
              </span>
            </div>
            <div className="mt-4 text-foreground">
              <AreaChart
                data={(() => {
                  // Cumulative revenue derived from daily hours × bill rate ($25)
                  let cum = 0;
                  return days.map((d) => {
                    cum += d.hours * 25;
                    return {
                      label: d.label,
                      value: Math.min(cum, Number(project.budget_amount) || 0),
                    };
                  });
                })()}
                height={200}
                yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
                color={
                  (budgetAmountPct ?? 0) > 90
                    ? CHART_COLORS.red
                    : (budgetAmountPct ?? 0) > 75
                    ? CHART_COLORS.amber
                    : CHART_COLORS.green
                }
                xLabels={7}
              />
            </div>
          </div>
        )}
      </section>

      {/* Role breakdown + recent activity */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.proj.hours_by_role")}
            </h2>
          </div>
          {roleRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t(locale, "a.proj.no_hours")}</p>
          ) : (
            <div className="mt-4 space-y-5 text-foreground">
              <DonutChart
                data={roleRows.slice(0, 6).map((r, i) => ({
                  label: r.role,
                  value: Math.round(r.hours),
                  color: ROLE_COLORS[i % ROLE_COLORS.length],
                }))}
              />
              <HorizontalBarChart
                data={roleRows.map((r) => ({
                  label: r.role,
                  value: r.hours,
                  sub: `${r.headcount} ${t(locale, "a.proj.workers")}`,
                }))}
                formatter={(n) => fmtHours(n, { decimals: 0 })}
                color={CHART_COLORS.accent}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t(locale, "a.proj.recent_clockins")} ({recentEntries.length})
          </h2>
          {recentEntries.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t(locale, "a.proj.no_clockins")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60 text-sm">
              {recentEntries.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{e.worker?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.clock_in_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="font-mono tabular-nums text-xs">
                    {e.hours_worked != null ? fmtHours(e.hours_worked) : "open"}
                  </span>
                  {e.approved ? (
                    <StatusPill status="approved" variant="green" />
                  ) : e.clock_out_at ? (
                    <StatusPill status="pending" variant="amber" />
                  ) : (
                    <StatusPill status="open" variant="blue" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Workers on this project */}
      <section className="mt-6 rounded-xl border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t(locale, "a.nav.workers")} ({placements.length})
          </h2>
          <Link
            href="/admin/placements/new"
            className="text-xs text-accent underline-offset-4 hover:underline"
          >
            + Add to project
          </Link>
        </div>
        {placements.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No workers placed yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {placements.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/workers/${p.worker_id}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-foreground/30"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.worker?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.role_title}</div>
                  </div>
                  <span
                    className={
                      p.status === "active"
                        ? "rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-300"
                        : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                    }
                  >
                    {p.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Timesheets — proof-of-hours sent by hiring company */}
      <section className="mt-8 rounded-xl border border-border bg-background p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Timesheets</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {timesheets.length} {timesheets.length === 1 ? "document" : "documents"}
          </p>
        </div>
        {timesheets.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
            No timesheets yet — use the <strong>Upload timesheet</strong> button above to attach proof-of-hours sent by the hiring company.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-bold">File</th>
                  <th className="px-3 py-2 font-bold">Period</th>
                  <th className="px-3 py-2 font-bold">Source</th>
                  <th className="px-3 py-2 text-right font-bold">Hours claimed</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                  <th className="px-3 py-2 font-bold">Uploaded</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-border/60 ${i % 2 === 1 ? "bg-muted/30" : ""}`}
                  >
                    <td className="px-3 py-2 font-medium">{t.filename}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {t.period_start && t.period_end
                        ? `${t.period_start} → ${t.period_end}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">{t.source_company ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {t.total_hours_claimed != null
                        ? Number(t.total_hours_claimed).toLocaleString("en-US")
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill
                        status={t.status}
                        variant={
                          t.status === "reconciled"
                            ? "green"
                            : t.status === "disputed"
                            ? "red"
                            : t.status === "archived"
                            ? "muted"
                            : "amber"
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(t.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {t.signedUrl && (
                        <a
                          href={t.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent underline-offset-4 hover:underline"
                        >
                          Open ↗
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  subValue,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  subValue?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border p-4 ${
        accent ? "bg-accent/10" : "bg-background"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {subValue && <p className="mt-0.5 text-xs text-muted-foreground">{subValue}</p>}
    </div>
  );
}

function Budget({
  label,
  used,
  cap,
  pct,
  unit,
  prefix,
}: {
  label: string;
  used: number;
  cap: number;
  pct: number;
  unit: string;
  prefix?: boolean;
}) {
  const over = used > cap;
  const display = (n: number) => (prefix ? fmtUsd(n) : `${fmtNum(n)}${unit ? unit : ""}`);
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-sm tabular-nums">
          {display(used)}{" "}
          <span className="text-muted-foreground">/ {display(cap)}</span>
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${over ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-accent"}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {pct}% used {over && "· over budget"}
      </p>
    </div>
  );
}
