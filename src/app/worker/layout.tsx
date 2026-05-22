import Link from "next/link";
import type { ReactNode } from "react";
import { t, type TKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { LogoutButton } from "../admin/_components/logout-button";

const TABS: { href: string; key: TKey }[] = [
  { href: "/worker", key: "w.nav.today" },
  { href: "/worker/clock", key: "w.nav.clock" },
  { href: "/worker/availability", key: "w.nav.availability" },
  { href: "/worker/time-off", key: "w.nav.timeoff" },
  { href: "/worker/shifts", key: "w.nav.shifts" },
  { href: "/worker/hours", key: "w.nav.hours" },
  { href: "/worker/paystubs", key: "w.nav.pay" },
  { href: "/worker/rate", key: "w.nav.rate" },
  { href: "/worker/report", key: "w.nav.report" },
  { href: "/worker/refer", key: "w.nav.refer" },
  { href: "/worker/sign", key: "w.nav.sign" },
  { href: "/worker/documents", key: "w.nav.docs" },
  { href: "/worker/profile", key: "w.nav.profile" },
  { href: "/worker/help", key: "w.nav.help" },
];

export default async function WorkerLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6 sm:pb-16">
      {/* Mobile: tiny top bar so logout is always reachable */}
      <div className="mb-3 flex items-center justify-between sm:hidden">
        <span className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
          Worker
        </span>
        <LogoutButton variant="icon" redirectTo="/worker/login" />
      </div>
      {/* Desktop: top horizontal scroll nav */}
      <nav
        aria-label="Worker"
        className="sticky top-16 z-10 -mx-4 mb-5 hidden gap-1 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:flex sm:rounded-lg sm:border sm:px-1 sm:py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {TABS.map((tab) => (
          <WorkerLink key={tab.href} href={tab.href}>
            {t(locale, tab.key)}
          </WorkerLink>
        ))}
        <div className="ml-auto shrink-0 self-center pl-2">
          <LogoutButton variant="icon" redirectTo="/worker/login" />
        </div>
      </nav>
      {children}
      {/* Mobile: bottom tab bar (5 most used) */}
      <nav
        aria-label="Worker (mobile)"
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-background/95 py-1.5 backdrop-blur sm:hidden"
      >
        {[
          { href: "/worker", label: "Hoje", icon: "🏠" },
          { href: "/worker/clock", label: "Ponto", icon: "⏱" },
          { href: "/worker/shifts", label: "Turnos", icon: "📅" },
          { href: "/worker/hours", label: "Horas", icon: "🕐" },
          { href: "/worker/profile", label: "Perfil", icon: "👤" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-foreground/70"
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function WorkerLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
