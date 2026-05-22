import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { loadDashboard } from "@/lib/dashboard";
import { getCurrentAdminRole, can } from "@/lib/auth";
import { fmtUsd, fmtNum, fmtHours, fmtPct } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import {
  Sparkline,
  AreaChart,
  BarChart,
  HorizontalBarChart,
  DonutChart,
  ForecastChart,
  CHART_COLORS,
} from "../_components/charts";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [d, locale, role] = await Promise.all([
    loadDashboard(),
    getLocale(),
    getCurrentAdminRole(),
  ]);
  const showMoney = can(role, "view_financials");

  // Derive sparkline series from the new time-series
  const revenueSpark = d.revenueByDay30.map((p) => p.value);
  const marginSpark = d.marginByDay30.map((p) => p.value);
  const appsSpark = d.applicationsByDay14.map((p) => p.value);

  return (
    <div className="space-y-8">
      {/* Branded hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#1F2A3D] text-white shadow-lg">
        {/* Decorative mark watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 opacity-20 sm:-right-4 sm:-top-4"
        >
          <Image
            src="/vertex-mark-yellow.png"
            alt=""
            width={240}
            height={240}
            priority
            className="h-44 w-auto sm:h-64"
          />
        </div>
        <div className="relative grid gap-4 p-4 sm:grid-cols-[auto,1fr] sm:items-center sm:gap-6 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image
              src="/vertex-mark-yellow.png"
              alt=""
              width={72}
              height={72}
              priority
              className="h-12 w-auto sm:h-14"
            />
            <div className="leading-tight">
              <div className="text-xl font-black tracking-[4px] sm:text-2xl">
                VERTEX
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[3px] text-[#EDB23E]">
                Restoration · Recovery
              </div>
            </div>
          </div>
          <div className="sm:border-l sm:border-white/15 sm:pl-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#EDB23E]">
              {t(locale, "a.dash.eyebrow")}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {t(locale, "a.dash.title")}
            </h1>
            <p className="mt-2 text-sm text-white/70 max-w-md">
              {locale === "pt"
                ? `${fmtUsd(d.revenueMtd, { decimals: 0 })} de receita no mês · ${d.activeWorkers} colaboradores ativos · ${d.activePlacements} alocações`
                : locale === "es"
                ? `${fmtUsd(d.revenueMtd, { decimals: 0 })} ingresos del mes · ${d.activeWorkers} trabajadores activos · ${d.activePlacements} asignaciones`
                : `${fmtUsd(d.revenueMtd, { decimals: 0 })} revenue MTD · ${d.activeWorkers} active workers · ${d.activePlacements} placements`}
            </p>
          </div>
        </div>
      </section>

      {/* Money row with sparklines */}
      {showMoney && (
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiSpark
          label={t(locale, "a.dash.revenue_mtd")}
          value={fmtUsd(d.revenueMtd)}
          delta={pctDelta(d.revenueMtd, d.prevPeriod.revenueMtd)}
          deltaLabel={t(locale, "a.delta.vs_last_month")}
          spark={revenueSpark}
          color={CHART_COLORS.accent}
          accent
        />
        <KpiSpark
          label={t(locale, "a.dash.margin_week")}
          value={fmtUsd(d.marginThisWeek)}
          delta={pctDelta(d.marginThisWeek, d.prevPeriod.marginThisWeek)}
          deltaLabel={t(locale, "a.delta.vs_last_week")}
          spark={marginSpark}
          color={CHART_COLORS.green}
        />
        <Kpi
          label={t(locale, "a.dash.outstanding")}
          value={fmtUsd(d.outstanding)}
          delta={pctDelta(d.outstanding, d.prevPeriod.outstanding)}
          deltaLabel={t(locale, "a.delta.vs_last_week")}
          deltaInverted
          link="/admin/invoices?status=open"
        />
        <KpiSpark
          label={t(locale, "a.dash.applications_24h")}
          value={`${d.newApplications24h}`}
          delta={pctDelta(d.newApplications24h, d.prevPeriod.applications24h)}
          deltaLabel={t(locale, "a.delta.vs_prev_24h")}
          spark={appsSpark}
          color={CHART_COLORS.blue}
          link="/admin/applications"
        />
      </section>
      )}

      {/* Ops row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={t(locale, "a.dash.active_workers")}
          value={`${d.activeWorkers}`}
          delta={pctDelta(d.activeWorkers, d.prevPeriod.activeWorkers)}
          deltaLabel={t(locale, "a.delta.vs_last_week")}
          link="/admin/workers"
        />
        <Kpi
          label={t(locale, "a.dash.active_placements")}
          value={`${d.activePlacements}`}
          delta={pctDelta(d.activePlacements, d.prevPeriod.activePlacements)}
          deltaLabel={t(locale, "a.delta.vs_last_week")}
          link="/admin/placements"
        />
        <Kpi
          label={t(locale, "a.dash.open_jobs")}
          value={`${d.openJobs}`}
          delta={pctDelta(d.openJobs, d.prevPeriod.openJobs)}
          deltaLabel={t(locale, "a.delta.vs_last_week")}
          link="/admin/jobs"
        />
        <Kpi
          label={t(locale, "a.dash.pending_review")}
          value={`${d.pendingTimesheets}`}
          unit={t(locale, "a.dash.pending_review_unit")}
          delta={pctDelta(d.pendingTimesheets, d.prevPeriod.pendingTimesheets)}
          deltaLabel={t(locale, "a.delta.vs_last_week")}
          deltaInverted
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
              {t(locale, "a.dash.on_clock")} ({d.liveOnTheClock.length})
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
              + {d.liveOnTheClock.length - 12} {t(locale, "a.dash.more_clocked")}
            </p>
          )}
        </section>
      )}

      {/* Revenue trend (actual + forecast) */}
      {showMoney && d.revenueByDay30.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.dash.revenue_30")}
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtUsd(d.revenueByDay30.reduce((s, x) => s + x.value, 0))} {t(locale, "a.dash.actual")} ·{" "}
              <span className="text-accent">
                {fmtUsd(d.revenueForecast14.reduce((s, x) => s + x.value, 0))} {t(locale, "a.dash.projected")}
              </span>
            </span>
          </div>
          <div className="mt-4 text-foreground">
            <ForecastChart
              actual={d.revenueByDay30}
              forecast={d.revenueForecast14}
              height={240}
              yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
              color={CHART_COLORS.accent}
              xLabels={8}
            />
          </div>
        </section>
      )}

      {/* Hours chart + activity */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.dash.hours_week")}
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtHours(d.hoursThisWeek, { decimals: 0 })} {t(locale, "a.dash.hours_total")}
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
            {t(locale, "a.dash.recent_activity")}
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {d.recentActivity.length === 0 && (
              <li className="text-muted-foreground">{t(locale, "a.dash.no_activity")}</li>
            )}
            {d.recentActivity.map((a, i) => {
              const inner = (
                <div className="flex items-baseline gap-2">
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
                </div>
              );
              return (
                <li key={i}>
                  {a.href ? (
                    <Link
                      href={a.href}
                      className="-mx-2 block rounded-md px-2 py-1 transition hover:bg-muted"
                    >
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Active projects */}
      {d.activeProjects.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.dash.active_projects")} ({d.activeProjects.length})
            </h2>
            <Link
              href="/admin/projects"
              className="text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              {t(locale, "a.dash.all_projects")} →
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
                      {p.activeWorkers} {t(locale, "a.dash.workers_count")}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t(locale, "a.dash.hours")}
                      </div>
                      <div className="font-mono tabular-nums">{fmtNum(p.hours)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t(locale, "a.dash.revenue")}
                      </div>
                      <div className="font-mono tabular-nums">{fmtUsd(p.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t(locale, "a.dash.margin")}
                      </div>
                      <div className="font-mono tabular-nums text-accent">{fmtUsd(p.margin)}</div>
                    </div>
                  </div>
                  {p.budgetPct != null && (
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                        <span>{p.budgetPct}% {t(locale, "a.dash.of_budget")}</span>
                        {p.budgetAmount && <span>{fmtUsd(p.budgetAmount)} {t(locale, "a.dash.budget_cap")}</span>}
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
            {t(locale, "a.dash.top_employers")}
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
            {t(locale, "a.dash.top_workers")}
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
            {t(locale, "a.dash.workforce_mix")}
          </h2>
          <div className="mt-4 text-foreground">
            <DonutChart
              data={[
                {
                  label: t(locale, "a.dash.active"),
                  value: d.workersByStatus.active,
                  color: CHART_COLORS.green,
                },
                {
                  label: t(locale, "a.dash.onboarding"),
                  value: d.workersByStatus.onboarding,
                  color: CHART_COLORS.amber,
                },
                {
                  label: t(locale, "a.dash.inactive"),
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

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function Delta({
  pct,
  label,
  inverted,
}: {
  pct: number | null;
  label?: string;
  inverted?: boolean;
}) {
  if (pct == null) return null;
  const isUp = pct > 0;
  const isZero = Math.abs(pct) < 0.5;
  // For "inverted" metrics (e.g. Outstanding, Pending review), up is bad.
  const isGood = isZero ? null : inverted ? !isUp : isUp;
  const color = isGood == null
    ? "text-muted-foreground"
    : isGood
    ? "text-green-700 dark:text-green-400"
    : "text-red-700 dark:text-red-400";
  const Icon = isZero ? Minus : isUp ? ArrowUp : ArrowDown;
  return (
    <p className={`mt-2 flex items-center gap-1 text-xs font-medium tabular-nums ${color}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>
        {isUp ? "+" : ""}
        {fmtPct(pct, { decimals: pct < 10 && pct > -10 ? 1 : 0 })}
      </span>
      {label && <span className="text-muted-foreground font-normal">· {label}</span>}
    </p>
  );
}

function Kpi({
  label,
  value,
  unit,
  hint,
  accent,
  link,
  delta,
  deltaLabel,
  deltaInverted,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  accent?: boolean;
  link?: string;
  delta?: number | null;
  deltaLabel?: string;
  deltaInverted?: boolean;
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
      {delta !== undefined && (
        <Delta pct={delta} label={deltaLabel} inverted={deltaInverted} />
      )}
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
  delta,
  deltaLabel,
  deltaInverted,
}: {
  label: string;
  value: string;
  hint?: string;
  spark: number[];
  color: string;
  accent?: boolean;
  link?: string;
  delta?: number | null;
  deltaLabel?: string;
  deltaInverted?: boolean;
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
      {delta !== undefined && (
        <Delta pct={delta} label={deltaLabel} inverted={deltaInverted} />
      )}
      {spark.length > 0 && (
        <div className="mt-3 -mx-1 text-foreground">
          <Sparkline data={spark} stroke={color} fill={color} height={28} />
        </div>
      )}
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}
