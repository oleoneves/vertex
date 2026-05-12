import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  count,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number | string;
  action?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 border-b border-border pb-5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
            {title}
          </h1>
          {count != null && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {(children || action) && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {action && (
            <Link
              href={action.href}
              className="inline-flex h-9 items-center gap-1 rounded-md bg-accent px-3 text-sm font-bold text-accent-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> {action.label}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
