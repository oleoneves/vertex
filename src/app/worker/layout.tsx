import Link from "next/link";
import type { ReactNode } from "react";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-background p-1 text-sm">
        <WorkerLink href="/worker">Today</WorkerLink>
        <WorkerLink href="/worker/shifts">Shifts</WorkerLink>
        <WorkerLink href="/worker/hours">Hours</WorkerLink>
      </nav>
      {children}
    </div>
  );
}

function WorkerLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex-1 rounded-md px-3 py-2 text-center font-medium hover:bg-muted"
    >
      {children}
    </Link>
  );
}
