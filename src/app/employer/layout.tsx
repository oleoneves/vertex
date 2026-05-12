import Link from "next/link";
import type { ReactNode } from "react";

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-background p-1 text-sm">
        <Tab href="/employer">Overview</Tab>
        <Tab href="/employer/workers">Workers</Tab>
        <Tab href="/employer/hours">Hours</Tab>
        <Tab href="/employer/invoices">Invoices</Tab>
      </nav>
      {children}
    </div>
  );
}

function Tab({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex-1 rounded-md px-3 py-2 text-center font-medium hover:bg-muted"
    >
      {children}
    </Link>
  );
}
