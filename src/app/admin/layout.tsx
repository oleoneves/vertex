import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  HardHat,
  Building2,
  Link2,
  CalendarDays,
  Clock,
  Receipt,
  DollarSign,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Radio,
  Mail,
} from "lucide-react";
import { CommandPalette } from "./_components/command-palette";
import { NotificationsBell } from "./_components/notifications-bell";
import { listRecentEvents } from "@/lib/activity";
import { loadDashboard } from "@/lib/dashboard";
import { fmtUsd } from "@/lib/format";
import { getCurrentAdminRole, can } from "@/lib/auth";
import { Sparkline, CHART_COLORS } from "../_components/charts";
import { t, type TKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

type NavItem = {
  href: string;
  labelKey: TKey;
  Icon: React.ComponentType<{ className?: string }>;
};

const RECRUIT: NavItem[] = [
  { href: "/admin", labelKey: "a.nav.dashboard", Icon: LayoutDashboard },
  { href: "/admin/inbox", labelKey: "a.nav.inbox", Icon: FileText },
  { href: "/admin/live", labelKey: "a.nav.live", Icon: Radio },
  { href: "/admin/applications", labelKey: "a.nav.applications", Icon: FileText },
  { href: "/admin/jobs", labelKey: "a.nav.jobs", Icon: Briefcase },
];

const WORKFORCE: NavItem[] = [
  { href: "/admin/projects", labelKey: "a.nav.projects", Icon: ClipboardList },
  { href: "/admin/workers", labelKey: "a.nav.workers", Icon: HardHat },
  { href: "/admin/employers", labelKey: "a.nav.employers", Icon: Building2 },
  { href: "/admin/placements", labelKey: "a.nav.placements", Icon: Link2 },
  { href: "/admin/timesheet", labelKey: "a.nav.timesheet", Icon: Clock },
  { href: "/admin/availability", labelKey: "a.nav.availability", Icon: CalendarDays },
  { href: "/admin/ratings", labelKey: "a.nav.ratings", Icon: ShieldCheck },
  { href: "/admin/messages", labelKey: "a.nav.messages", Icon: Mail },
  { href: "/admin/incidents", labelKey: "a.nav.incidents", Icon: ShieldCheck },
  { href: "/admin/referrals", labelKey: "a.nav.referrals", Icon: ShieldCheck },
];

const MONEY: NavItem[] = [
  { href: "/admin/invoices", labelKey: "a.nav.invoices", Icon: Receipt },
  { href: "/admin/payroll", labelKey: "a.nav.payroll", Icon: DollarSign },
  { href: "/admin/payments", labelKey: "a.nav.payments", Icon: DollarSign },
  { href: "/admin/reports", labelKey: "a.nav.reports", Icon: BarChart3 },
];

const ALL_ITEMS: NavItem[] = [...RECRUIT, ...WORKFORCE, ...MONEY];
const ALL_ITEMS_NO_MONEY: NavItem[] = [...RECRUIT, ...WORKFORCE];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const demoMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const locale = await getLocale();
  const role = await getCurrentAdminRole();
  const showMoney = can(role, "view_financials");
  const [events, dash, badges] = await Promise.all([
    listRecentEvents(12, locale),
    loadDashboard(),
    (async () => {
      const { getSupabaseServer } = await import("@/lib/supabase/server");
      const sb = await getSupabaseServer();
      const [inbox, incidents] = await Promise.all([
        sb
          .from("time_entries")
          .select("id", { count: "exact", head: true })
          .eq("approved", false)
          .not("clock_out_at", "is", null),
        sb
          .from("incident_reports")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "reviewing"]),
      ]);
      return {
        inbox: inbox.count ?? 0,
        incidents: incidents.count ?? 0,
      };
    })(),
  ]);
  const todaySpark = dash.revenueByDay30.slice(-7).map((d) => d.value);
  const todayRevenue = dash.revenueByDay30.at(-1)?.value ?? 0;
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:flex lg:gap-10">
      {/* Mobile: brand mark in header */}
      <Link
        href="/admin"
        className="mb-3 flex items-center gap-2 lg:hidden"
        aria-label="Vertex Restoration"
      >
        <Image
          src="/vertex-mark-navy.png"
          alt=""
          width={28}
          height={28}
          priority
          unoptimized
          className="h-7 w-auto shrink-0 dark:invert"
        />
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight">VERTEX</div>
          <div className="text-[8px] font-semibold uppercase tracking-[2px] text-muted-foreground">
            Restoration
          </div>
        </div>
      </Link>
      {demoMode && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 lg:hidden">
          🟡 <strong>Demo mode</strong> — realistic mock data. Connect Supabase to switch to real.
        </div>
      )}
      {/* Mobile: horizontal scrollable chip nav */}
      <nav
        aria-label="Admin"
        className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {(showMoney ? ALL_ITEMS : ALL_ITEMS_NO_MONEY).map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <it.Icon className="h-3.5 w-3.5 text-muted-foreground" />
            {t(locale, it.labelKey)}
          </Link>
        ))}
      </nav>

      {/* Desktop: grouped sidebar with its own scroll */}
      <aside className="hidden lg:block lg:w-60 lg:shrink-0">
        <nav className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-1 overflow-y-auto pr-2 text-sm [scrollbar-width:thin]">
          {/* Vertex brand mark + wordmark */}
          <Link
            href="/admin"
            className="mb-3 flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted"
            aria-label="Vertex Restoration"
          >
            <Image
              src="/vertex-mark-navy.png"
              alt=""
              width={32}
              height={32}
              priority
              unoptimized
              className="h-8 w-auto shrink-0 dark:invert"
            />
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-extrabold tracking-tight">VERTEX</div>
              <div className="text-[9px] font-semibold uppercase tracking-[2px] text-muted-foreground">
                Restoration
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 px-2 pb-3">
            <div className="flex-1">
              <CommandPalette />
            </div>
            <NotificationsBell
              events={events}
              labels={{
                title: t(locale, "a.bell.title"),
                allCaughtUp: t(locale, "a.bell.all_caught_up"),
                newLabel: t(locale, "a.bell.new"),
                noActivity: t(locale, "a.bell.no_activity"),
                justNow: t(locale, "a.bell.just_now"),
                mAgo: t(locale, "a.bell.minute_short"),
                hAgo: t(locale, "a.bell.hour_short"),
                dAgo: t(locale, "a.bell.day_short"),
              }}
            />
          </div>
          {todaySpark.length > 1 && (
            <div className="mx-2 mb-3 rounded-lg border border-border bg-accent/5 p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t(locale, "a.sidebar.today")}
                </p>
                <p className="font-mono text-xs font-bold tabular-nums">
                  {fmtUsd(todayRevenue, { decimals: 0, compact: true })}
                </p>
              </div>
              <div className="mt-1.5 text-foreground">
                <Sparkline
                  data={todaySpark}
                  stroke={CHART_COLORS.accent}
                  fill={CHART_COLORS.accent}
                  height={26}
                />
              </div>
              <p className="mt-1 text-[9px] text-muted-foreground">
                {t(locale, "a.sidebar.last_7d_revenue")}
              </p>
            </div>
          )}
          <Group
            label={t(locale, "a.group.recruitment")}
            items={RECRUIT}
            locale={locale}
            badges={{ "/admin/inbox": badges.inbox + badges.incidents }}
          />
          <Group
            label={t(locale, "a.group.workforce")}
            items={WORKFORCE}
            locale={locale}
            badges={{ "/admin/incidents": badges.incidents, "/admin/timesheet": badges.inbox }}
          />
          {showMoney && (
            <Group label={t(locale, "a.group.money")} items={MONEY} locale={locale} />
          )}
        </nav>
      </aside>

      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}

function Group({
  label,
  items,
  locale,
  badges,
}: {
  label: string;
  items: NavItem[];
  locale: "en" | "es" | "pt";
  badges?: Record<string, number>;
}) {
  return (
    <div className="mb-3">
      <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {items.map((it) => {
        const count = badges?.[it.href] ?? 0;
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-foreground/85 hover:bg-muted hover:text-foreground"
          >
            <it.Icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{t(locale, it.labelKey)}</span>
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
