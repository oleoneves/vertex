import Link from "next/link";
import type { ReactNode } from "react";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      <nav
        aria-label="Worker"
        className="sticky top-16 z-10 -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-1 sm:py-1"
        style={{ scrollbarWidth: "none" }}
      >
        <WorkerLink href="/worker">Today</WorkerLink>
        <WorkerLink href="/worker/shifts">Shifts</WorkerLink>
        <WorkerLink href="/worker/hours">Hours</WorkerLink>
        <WorkerLink href="/worker/paystubs">Pay</WorkerLink>
        <WorkerLink href="/worker/profile">Profile</WorkerLink>
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
