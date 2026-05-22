import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  preservedParams = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  preservedParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(preservedParams)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-sm">
      <div className="text-xs text-muted-foreground">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of{" "}
        <strong>{total}</strong>
      </div>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 hover:bg-muted"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-muted/30 px-2 text-muted-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </span>
        )}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={i} className="px-2 text-muted-foreground">
              …
            </span>
          ) : p === page ? (
            <span
              key={p}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-foreground px-2 font-mono text-xs font-bold text-background tabular-nums"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 font-mono text-xs tabular-nums hover:bg-muted"
            >
              {p}
            </Link>
          ),
        )}
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 hover:bg-muted"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-muted/30 px-2 text-muted-foreground">
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
}
