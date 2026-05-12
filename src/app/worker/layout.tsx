import Link from "next/link";
import type { ReactNode } from "react";
import { t, type TKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

const TABS: { href: string; key: TKey }[] = [
  { href: "/worker", key: "w.nav.today" },
  { href: "/worker/shifts", key: "w.nav.shifts" },
  { href: "/worker/hours", key: "w.nav.hours" },
  { href: "/worker/paystubs", key: "w.nav.pay" },
  { href: "/worker/documents", key: "w.nav.docs" },
  { href: "/worker/profile", key: "w.nav.profile" },
];

export default async function WorkerLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      <nav
        aria-label="Worker"
        className="sticky top-16 z-10 -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-1 sm:py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {TABS.map((tab) => (
          <WorkerLink key={tab.href} href={tab.href}>
            {t(locale, tab.key)}
          </WorkerLink>
        ))}
      </nav>
      {children}
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
