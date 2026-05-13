import type { ReactNode } from "react";

export function DataTable({
  head,
  children,
}: {
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="-mx-4 overflow-x-auto rounded-xl border-y border-border sm:mx-0 sm:rounded-xl sm:border">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-muted/60 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-border/70">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th className={`whitespace-nowrap px-3 py-2.5 ${className}`}>{children}</th>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="bg-background transition hover:bg-muted/30">{children}</tr>;
}

export function Td({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}

import { t, type TKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

// Maps a raw status value to a TKey, returning the original string if no match.
const STATUS_KEY_MAP: Record<string, TKey> = {
  active: "a.status.active",
  inactive: "a.status.inactive",
  onboarding: "a.status.onboarding",
  pending: "a.status.pending",
  approved: "a.status.approved",
  paid: "a.status.paid",
  sent: "a.status.sent",
  draft: "a.status.draft",
  overdue: "a.status.overdue",
  void: "a.status.void",
  completed: "a.status.completed",
  scheduled: "a.status.scheduled",
};

export async function StatusPill({
  status,
  variant,
}: {
  status: string;
  variant: "green" | "amber" | "red" | "blue" | "muted" | "violet";
}) {
  const locale = await getLocale();
  const cls = {
    green:  "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    amber:  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    red:    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    blue:   "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
    muted:  "bg-muted text-muted-foreground",
  }[variant];
  const key = STATUS_KEY_MAP[status];
  const label = key ? t(locale, key) : status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}
