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
} from "lucide-react";
import { CommandPalette } from "./_components/command-palette";
import { NotificationsBell } from "./_components/notifications-bell";
import { listRecentEvents } from "@/lib/activity";
import { loadDashboard } from "@/lib/dashboard";
import { fmtUsd } from "@/lib/format";
import { Sparkline, CHART_COLORS } from "../_components/charts";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const RECRUIT: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", Icon: FileText },
  { href: "/admin/jobs", label: "Jobs", Icon: Briefcase },
];

const WORKFORCE: NavItem[] = [
  { href: "/admin/projects", label: "Projects", Icon: ClipboardList },
  { href: "/admin/workers", label: "Workers", Icon: HardHat },
  { href: "/admin/employers", label: "Employers", Icon: Building2 },
  { href: "/admin/placements", label: "Placements", Icon: Link2 },
  { href: "/admin/shifts", label: "Shifts", Icon: CalendarDays },
  { href: "/admin/timesheet", label: "Timesheet", Icon: Clock },
  { href: "/admin/documents", label: "Documents", Icon: ShieldCheck },
];

const MONEY: NavItem[] = [
  { href: "/admin/invoices", label: "Invoices", Icon: Receipt },
  { href: "/admin/payroll", label: "Payroll", Icon: DollarSign },
  { href: "/admin/payments", label: "Payments", Icon: DollarSign },
  { href: "/admin/reports", label: "Reports", Icon: BarChart3 },
];

const ALL_ITEMS: NavItem[] = [...RECRUIT, ...WORKFORCE, ...MONEY];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const demoMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [events, dash] = await Promise.all([
    listRecentEvents(12),
    loadDashboard(),
  ]);
  const todaySpark = dash.revenueByDay30.slice(-7).map((d) => d.value);
  const todayRevenue = dash.revenueByDay30.at(-1)?.value ?? 0;
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:flex lg:gap-10">
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
        {ALL_ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <it.Icon className="h-3.5 w-3.5 text-muted-foreground" />
            {it.label}
          </Link>
        ))}
      </nav>

      {/* Desktop: grouped sidebar */}
      <aside className="hidden lg:block lg:w-60 lg:shrink-0">
        <nav className="sticky top-24 flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2 px-2 pb-3">
            <div className="flex-1">
              <CommandPalette />
            </div>
            <NotificationsBell events={events} />
          </div>
          {todaySpark.length > 1 && (
            <div className="mx-2 mb-3 rounded-lg border border-border bg-accent/5 p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Today
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
                Last 7d revenue
              </p>
            </div>
          )}
          <Group label="Recruitment" items={RECRUIT} />
          <Group label="Workforce" items={WORKFORCE} />
          <Group label="Money" items={MONEY} />
        </nav>
      </aside>

      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}

function Group({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="mb-3">
      <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-foreground/85 hover:bg-muted hover:text-foreground"
        >
          <it.Icon className="h-4 w-4 text-muted-foreground" />
          {it.label}
        </Link>
      ))}
    </div>
  );
}
