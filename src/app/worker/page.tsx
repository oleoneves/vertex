import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  XCircle,
  Award,
  Bell,
  FileWarning,
} from "lucide-react";
import { getCurrentWorker, getOpenTimeEntry, getWorkerWeek } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { loadWorkerStats, reliabilityTier } from "@/lib/worker-stats";
import { t, type TKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { clockIn, clockOut } from "./actions";
import { ClockForm } from "./clock-form";

import { fmtNum, fmtUsd } from "@/lib/format";
import { AreaChart, BarChart, CHART_COLORS } from "../_components/charts";
export const dynamic = "force-dynamic";

export default async function WorkerDashboard() {
  const worker = await getCurrentWorker();
  if (!worker) {
    redirect("/worker/login?next=/worker");
  }
  const locale = await getLocale();
  const supabase = await getSupabaseServer();

  const since14d = new Date(Date.now() - 14 * 86400000).toISOString();
  const [open, placements, week, projectsRes, entries14dRes, upcomingShiftsRes, stats] =
    await Promise.all([
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
      supabase
        .from("time_entries")
        .select("hours_worked, clock_in_at, pay_rate_at_entry")
        .eq("worker_id", worker.id)
        .gte("clock_in_at", since14d)
        .order("clock_in_at", { ascending: false })
        .limit(500),
      supabase
        .from("shifts")
        .select(
          "id, scheduled_start, scheduled_end, location, status, placement:placements!inner(role_title, employer:employers(name), worker_id)",
        )
        .eq("placement.worker_id", worker.id)
        .gte("scheduled_start", new Date().toISOString())
        .order("scheduled_start", { ascending: true })
        .limit(5),
      loadWorkerStats(worker.id),
    ]);

  const activePlacements =
    (placements.data as unknown as Array<{
      id: string;
      role_title: string;
      employer: { name: string } | null;
      project: { name: string } | null;
    }>) ?? [];

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

  // 14d daily bucket
  const days14: { label: string; iso: string; value: number; earnings: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days14.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 0,
      earnings: 0,
    });
  }
  type Entry14 = { hours_worked: number | null; clock_in_at: string; pay_rate_at_entry: number | null };
  for (const e of ((entries14dRes.data as Entry14[]) ?? [])) {
    const key = e.clock_in_at.slice(0, 10);
    const bucket = days14.find((d) => d.iso === key);
    if (bucket) {
      const h = Number(e.hours_worked ?? 0);
      bucket.value += h;
      bucket.earnings += h * Number(e.pay_rate_at_entry ?? 0);
    }
  }

  type UpcomingShift = {
    id: string;
    scheduled_start: string;
    scheduled_end: string;
    location: string | null;
    status: string;
    placement: { role_title: string; employer: { name: string } | null } | null;
  };
  const upcomingShifts = (upcomingShiftsRes.data as unknown as UpcomingShift[]) ?? [];
  const nextShift = upcomingShifts[0] ?? null;

  const firstName = worker.full_name.split(" ")[0];
  const greeting = greetingKeyFor(new Date());

  const tier = reliabilityTier(stats.rating, stats.ratingsCount);
  const weekDeltaPct =
    stats.earningsPrevWeek > 0
      ? Math.round(((stats.earningsThisWeek - stats.earningsPrevWeek) / stats.earningsPrevWeek) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            {t(locale, greeting)}, {firstName} 👋
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {open ? t(locale, "w.today.on_the_clock") : t(locale, "w.today.ready")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {stats.pendingShiftOffers > 0 && (
            <Link
              href="/worker/shifts"
              className="relative inline-flex h-9 items-center gap-1 rounded-md border border-amber-400 bg-amber-50 px-3 text-xs font-bold text-amber-900 dark:bg-amber-900/30 dark:text-amber-300"
            >
              <Bell className="h-3.5 w-3.5" />
              {stats.pendingShiftOffers} {stats.pendingShiftOffers === 1 ? "turno" : "turnos"} pra responder
            </Link>
          )}
        </div>
      </header>

      {/* Reliability + ranking badge row */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-2xl border-2 p-4 ${
            tier.color === "yellow"
              ? "border-yellow-400/60 bg-yellow-500/10"
              : tier.color === "green"
              ? "border-green-500/40 bg-green-500/10"
              : tier.color === "blue"
              ? "border-blue-500/40 bg-blue-500/10"
              : "border-border bg-muted/30"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Award className="inline h-3 w-3" /> Tier de confiança
          </p>
          <p className="mt-1 flex items-baseline gap-2 text-xl font-extrabold tracking-tight">
            <span className="text-2xl">{tier.emoji}</span> {tier.tier}
            {stats.rating != null && (
              <span className="text-sm font-mono text-muted-foreground tabular-nums">
                ⭐ {stats.rating.toFixed(1)} · {stats.ratingsCount} avaliações
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{tier.desc}</p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="inline h-3 w-3" /> Sua posição esta semana
          </p>
          <p className="mt-1 text-xl font-extrabold tracking-tight">
            {stats.totalPeers > 0
              ? `#${stats.rankAmongPeers} de ${stats.totalPeers}`
              : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Entre {stats.peerRoleLabel}s ativos · ranking por horas semanais
          </p>
        </div>
      </section>

      {/* Clock in/out panel */}
      {open ? (
        <ClockedInPanel open={open} locale={locale} />
      ) : (
        <ClockInPanel placements={activePlacements} locale={locale} />
      )}

      {/* Next shift card */}
      {nextShift && (
        <section className="rounded-2xl border-2 border-accent/40 bg-accent/10 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            <Calendar className="inline h-3 w-3" /> Próximo turno
          </p>
          <div className="mt-2">
            <p className="text-lg font-extrabold">
              {new Date(nextShift.scheduled_start).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(nextShift.scheduled_start).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              →{" "}
              {new Date(nextShift.scheduled_end).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {nextShift.placement?.employer?.name} — {nextShift.placement?.role_title}
            </p>
          </div>
        </section>
      )}

      {/* Big earnings card with week-over-week delta */}
      <section className="rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
          <DollarSign className="inline h-3 w-3" /> Você ganhou esta semana
        </p>
        <p className="mt-2 font-mono text-4xl font-extrabold tabular-nums text-green-700 dark:text-green-400">
          {fmtUsd(stats.earningsThisWeek)}
        </p>
        <p className="mt-1 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {fmtNum(stats.hoursThisWeek, { decimals: 2 })} hrs trabalhadas
          </span>
          {stats.earningsPrevWeek > 0 && (
            <span
              className={`font-mono font-bold tabular-nums ${
                weekDeltaPct >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {weekDeltaPct >= 0 ? "+" : ""}
              {weekDeltaPct}% vs semana passada
            </span>
          )}
        </p>
      </section>

      {/* Lifetime KPI strip */}
      <section className="grid gap-3 sm:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Ganhos no mês"
          value={fmtUsd(stats.earningsMtd, { decimals: 0 })}
          unit={`${fmtNum(stats.hoursMtd, { decimals: 0 })} hrs`}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Ganhos no ano"
          value={fmtUsd(stats.earningsYtd, { decimals: 0 })}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Horas total (lifetime)"
          value={fmtNum(stats.hoursLifetime, { decimals: 0 })}
          unit="hrs"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
          label="Ganhos total (lifetime)"
          value={fmtUsd(stats.earningsLifetime, { decimals: 0 })}
        />
      </section>

      {/* Next payment + approval + streak */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Próximo pagamento (estimativa)
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-accent">
            {fmtUsd(stats.nextPaymentEstimate, { decimals: 0 })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.pendingHours > 0
              ? `${fmtNum(stats.pendingHours, { decimals: 1 })} hrs aguardando aprovação`
              : "Nenhuma hora pendente"}
            {stats.nextPaymentDate && ` · ~${stats.nextPaymentDate}`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            % aprovação de horas
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums">
            {Math.round(stats.approvalRate * 100)}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fmtNum(stats.approvedHours, { decimals: 0 })} aprovadas ·{" "}
            {fmtNum(stats.pendingHours, { decimals: 0 })} pendentes
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Sequência consecutiva
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums">
            {stats.consecutiveDaysStreak} 🔥
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            dias seguidos trabalhando · média de{" "}
            {fmtNum(stats.avgHoursPerWorkedDay, { decimals: 1 })} hrs/dia
          </p>
        </div>
      </section>

      {/* Week breakdown */}
      <section className="grid gap-3 sm:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          label="Dias trabalhados"
          value={String(stats.daysWorkedThisWeek)}
          unit="esta semana"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          label="Dias não trabalhados"
          value={String(stats.daysMissedThisWeek)}
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

      {/* Compliance status */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Status de cadastro
          </h2>
          <Link
            href="/worker/profile"
            className="text-xs font-medium text-accent underline-offset-4 hover:underline"
          >
            Atualizar perfil →
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ComplianceItem ok={stats.hasW9} label="W-9" missing="Faltando — envie no perfil" ok_text="Enviado" />
          <ComplianceItem ok={stats.hasSSN} label="SSN" missing="Não cadastrado" ok_text="Cadastrado" />
          <ComplianceItem ok={stats.hasZelle} label="Zelle" missing="Configure no perfil" ok_text="Configurado" />
        </div>
      </section>

      {/* My projects */}
      {myProjects.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Meus projetos
          </h2>
          <ul className="mt-4 space-y-2">
            {myProjects.map((p) => {
              const total = p.approved + p.pending;
              return (
                <li
                  key={p.name}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    {p.employer && (
                      <div className="truncate text-xs text-muted-foreground">
                        {p.employer} · {Math.round((total / stats.hoursLifetime) * 100)}% do lifetime
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
              );
            })}
          </ul>
        </section>
      )}

      {/* Hours last 14 days chart */}
      {days14.some((d) => d.value > 0) && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Horas — últimos 14 dias
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtNum(days14.reduce((s, d) => s + d.value, 0), { decimals: 1 })} hrs ·{" "}
              {fmtUsd(days14.reduce((s, d) => s + d.earnings, 0))}
            </span>
          </div>
          <div className="mt-4 text-foreground">
            <AreaChart
              data={days14}
              height={180}
              yFormatter={(n) => `${fmtNum(n, { decimals: 0 })}h`}
              color={CHART_COLORS.accent}
              xLabels={7}
            />
          </div>
        </section>
      )}

      {/* Monthly earnings — 12 months */}
      {stats.monthlyEarnings.some((m) => m.value > 0) && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Ganhos por mês — últimos 12 meses
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtUsd(stats.monthlyEarnings.reduce((s, m) => s + m.value, 0))}
            </span>
          </div>
          <div className="mt-4 text-foreground">
            <BarChart
              data={stats.monthlyEarnings.map((m) => ({ label: m.label, value: m.value }))}
              height={200}
              yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
              color={CHART_COLORS.green}
            />
          </div>
        </section>
      )}

      {/* Performance: no-shows */}
      {stats.noShowCount > 0 && (
        <section className="rounded-xl border border-red-400/40 bg-red-500/5 p-5">
          <div className="flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              {stats.noShowCount} no-show{stats.noShowCount === 1 ? "" : "s"} registrados
            </h2>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Faltas sem aviso prejudicam seu tier de confiança. Avise sempre que precisar faltar.
          </p>
        </section>
      )}
    </div>
  );
}

function ComplianceItem({
  ok,
  label,
  missing,
  ok_text,
}: {
  ok: boolean;
  label: string;
  missing: string;
  ok_text: string;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        ok
          ? "border-green-500/30 bg-green-500/5"
          : "border-amber-400/40 bg-amber-50 dark:bg-amber-900/20"
      }`}
    >
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-600" />
        )}
        <span className="font-bold">{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{ok ? ok_text : missing}</p>
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
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
            {t(locale, "w.today.clocked_in")}
          </p>
          <p className="text-2xl font-extrabold">
            {since.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <RunningCounter from={open.clock_in_at} />
      </div>
      <label className="mt-4 block text-sm">
        <span className="font-medium">{t(locale, "w.today.break_minutes")}</span>
        <input
          type="number"
          name="break_minutes"
          defaultValue="0"
          min="0"
          step="5"
          className="mt-1 w-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <button
        type="submit"
        className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-xl bg-foreground px-6 text-lg font-extrabold text-background hover:opacity-90"
      >
        {t(locale, "w.today.clock_out")} →
      </button>
    </ClockForm>
  );
}

function RunningCounter({ from }: { from: string }) {
  const since = new Date(from);
  const ms = Date.now() - since.getTime();
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return (
    <div className="text-right font-mono text-sm tabular-nums">
      <div className="text-3xl font-extrabold">
        {hrs}h {String(mins).padStart(2, "0")}m
      </div>
      <div className="text-xs text-muted-foreground">elapsed</div>
    </div>
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
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-6">
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
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-extrabold tabular-nums">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function greetingKeyFor(d: Date): TKey {
  const h = d.getHours();
  if (h < 12) return "w.greeting.morning";
  if (h < 18) return "w.greeting.afternoon";
  return "w.greeting.evening";
}
