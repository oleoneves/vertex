import { MapPin, Shield } from "lucide-react";
import { demoLiveBoard, type LiveShiftEntry } from "@/lib/demo";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";

// Auto-refresh every 60s
export const revalidate = 60;

function relativeMinutesFromNow(iso: string): { mins: number; label: string } {
  const target = +new Date(iso);
  const diff = Math.round((target - Date.now()) / 60000);
  return { mins: diff, label: diff >= 0 ? `${diff}m` : `${-diff}m ago` };
}

function elapsedFrom(iso: string): string {
  const mins = Math.floor((Date.now() - +new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function LiveBoardPage() {
  const [locale] = await Promise.all([getLocale()]);
  const board = demoLiveBoard();

  const scheduled = board.filter((e) => e.status === "scheduled");
  const enroute = board.filter((e) => e.status === "en_route");
  const onsite = board.filter((e) => e.status === "on_site");
  const completed = board.filter((e) => e.status === "completed");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#1F2A3D] text-white shadow-lg">
        <div className="relative grid gap-3 p-4 sm:flex sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[3px] text-red-400">
                  {t(locale, "a.live.live")}
                </span>
                <span className="text-[10px] text-white/40">
                  · {t(locale, "a.live.refreshes")}
                </span>
              </div>
              <h1 className="mt-0.5 text-xl font-black tracking-tight sm:text-2xl">
                {t(locale, "a.live.title")}
              </h1>
              <p className="mt-0.5 text-xs text-white/60">
                {t(locale, "a.live.subtitle")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            <HeroStat label={t(locale, "a.live.total_clocked")} value={onsite.length} accent="green" />
            <HeroStat label={t(locale, "a.live.starting_4h")} value={scheduled.length + enroute.length} accent="amber" />
            <HeroStat label={t(locale, "a.live.done_today")} value={completed.length} accent="white" />
          </div>
        </div>
      </section>

      {/* 4-column board */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Column
          title={t(locale, "a.live.scheduled")}
          count={scheduled.length}
          dotColor="bg-slate-400"
          accentBorder="border-slate-300"
          entries={scheduled}
          variant="scheduled"
          locale={locale}
        />
        <Column
          title={t(locale, "a.live.en_route")}
          count={enroute.length}
          dotColor="bg-blue-500"
          accentBorder="border-blue-400"
          entries={enroute}
          variant="enroute"
          locale={locale}
        />
        <Column
          title={t(locale, "a.live.on_site")}
          count={onsite.length}
          dotColor="bg-green-500"
          accentBorder="border-green-400"
          entries={onsite}
          variant="onsite"
          locale={locale}
          live
        />
        <Column
          title={t(locale, "a.live.completed")}
          count={completed.length}
          dotColor="bg-zinc-500"
          accentBorder="border-zinc-300"
          entries={completed}
          variant="completed"
          locale={locale}
        />
      </section>
    </div>
  );
}

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "green" | "amber" | "white";
}) {
  const colors = {
    green: "text-green-400",
    amber: "text-amber-400",
    white: "text-white",
  };
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-extrabold tabular-nums ${colors[accent]}`}>
        {fmtNum(value)}
      </p>
    </div>
  );
}

function Column({
  title,
  count,
  dotColor,
  accentBorder,
  entries,
  variant,
  locale,
  live = false,
}: {
  title: string;
  count: number;
  dotColor: string;
  accentBorder: string;
  entries: LiveShiftEntry[];
  variant: "scheduled" | "enroute" | "onsite" | "completed";
  locale: "en" | "es" | "pt";
  live?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-background">
      <header className={`flex items-center justify-between border-b-2 ${accentBorder} px-4 py-3`}>
        <div className="flex items-center gap-2">
          {live ? (
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-60`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotColor}`} />
            </span>
          ) : (
            <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          )}
          <h2 className="text-xs font-bold uppercase tracking-wider">{title}</h2>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">
          {count}
        </span>
      </header>
      <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto p-1.5 sm:max-h-[70vh]">
        {entries.length === 0 ? (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">
            {t(locale, "a.live.no_active")}
          </li>
        ) : (
          entries.map((e) => (
            <EntryCard key={e.id} entry={e} variant={variant} locale={locale} />
          ))
        )}
      </ul>
    </div>
  );
}

function EntryCard({
  entry,
  variant,
  locale,
}: {
  entry: LiveShiftEntry;
  variant: "scheduled" | "enroute" | "onsite" | "completed";
  locale: "en" | "es" | "pt";
}) {
  let timing: { primary: string; label: string; tone: string } = {
    primary: "",
    label: "",
    tone: "text-muted-foreground",
  };

  if (variant === "scheduled") {
    const { mins } = relativeMinutesFromNow(entry.scheduledStart);
    timing = {
      primary: `${mins}m`,
      label: t(locale, "a.live.starts_in"),
      tone: "text-slate-700 dark:text-slate-300",
    };
  } else if (variant === "enroute") {
    const { mins } = relativeMinutesFromNow(entry.scheduledStart);
    timing = {
      primary: `${mins}m`,
      label: t(locale, "a.live.eta"),
      tone: "text-blue-700 dark:text-blue-400",
    };
  } else if (variant === "onsite" && entry.clockInAt) {
    timing = {
      primary: elapsedFrom(entry.clockInAt),
      label: t(locale, "a.live.on_clock"),
      tone: "text-green-700 dark:text-green-400",
    };
  } else if (variant === "completed" && entry.hours != null) {
    timing = {
      primary: `${entry.hours}h`,
      label: t(locale, "a.live.finished"),
      tone: "text-muted-foreground",
    };
  }

  return (
    <li className="rounded-lg px-3 py-2.5 transition hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{entry.worker}</p>
            {entry.isCrewLead && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <Shield className="h-2.5 w-2.5" />
                {t(locale, "a.live.crew_lead")}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.role}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-mono font-bold tabular-nums ${timing.tone}`}>
            {timing.primary}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {timing.label}
          </p>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate" title={entry.project ?? entry.employer}>
          {entry.project ?? entry.employer}
        </span>
        {entry.location && (
          <span className="inline-flex items-center gap-0.5 shrink-0">
            <MapPin className="h-2.5 w-2.5" />
            {entry.location.split(",")[0]}
          </span>
        )}
      </div>
    </li>
  );
}
