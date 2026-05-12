import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Plus,
  HardHat,
  Building2,
  Link2,
  CalendarDays,
  Clock,
  Receipt,
  DollarSign,
} from "lucide-react";

const RECRUIT = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", Icon: FileText },
  { href: "/admin/jobs", label: "Jobs", Icon: Briefcase },
  { href: "/admin/jobs/new", label: "New job", Icon: Plus },
];

const WORKFORCE = [
  { href: "/admin/workers", label: "Workers", Icon: HardHat },
  { href: "/admin/employers", label: "Employers", Icon: Building2 },
  { href: "/admin/placements", label: "Placements", Icon: Link2 },
  { href: "/admin/shifts", label: "Shifts", Icon: CalendarDays },
  { href: "/admin/timesheet", label: "Timesheet", Icon: Clock },
];

const MONEY = [
  { href: "/admin/invoices", label: "Invoices", Icon: Receipt },
  { href: "/admin/payments", label: "Payments", Icon: DollarSign },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10">
      <aside className="lg:w-60 lg:shrink-0">
        <nav className="lg:sticky lg:top-24 flex flex-col gap-1 text-sm">
          <Group label="Recruitment" items={RECRUIT} />
          <Group label="Workforce" items={WORKFORCE} />
          <Group label="Money" items={MONEY} />
        </nav>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}

function Group({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; Icon: React.ComponentType<{ className?: string }> }[];
}) {
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
