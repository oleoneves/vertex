"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, HardHat, Building2, ClipboardList, Receipt, Loader2 } from "lucide-react";

type Result = {
  type: "worker" | "employer" | "project" | "invoice";
  id: string;
  href: string;
  primary: string;
  secondary: string | null;
};

const TYPE_META: Record<Result["type"], { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  worker: { label: "Worker", Icon: HardHat },
  employer: { label: "Employer", Icon: Building2 },
  project: { label: "Project", Icon: ClipboardList },
  invoice: { label: "Invoice", Icon: Receipt },
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setActive(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results);
        setActive(0);
      } catch {
        // ignore aborts
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(handle);
      ctrl.abort();
    };
  }, [query]);

  function go(r: Result) {
    setOpen(false);
    router.push(r.href);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open search (⌘K)"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search…</span>
        <span className="hidden sm:inline rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-8"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                go(results[active]);
              }
            }}
            placeholder="Search workers, employers, projects, invoices…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {!query ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Start typing to search workers, employers, projects, invoices.
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul className="py-2">
              {results.map((r, i) => {
                const M = TYPE_META[r.type];
                const isActive = i === active;
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => go(r)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                        isActive ? "bg-muted" : ""
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                          isActive ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <M.Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate font-medium">{r.primary}</span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {M.label}
                          </span>
                        </div>
                        {r.secondary && (
                          <div className="truncate text-xs text-muted-foreground">
                            {r.secondary}
                          </div>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="rounded border border-border bg-background px-1 font-mono">↑↓</kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded border border-border bg-background px-1 font-mono">↵</kbd>{" "}
            open
          </span>
          <span>
            <kbd className="rounded border border-border bg-background px-1 font-mono">esc</kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}
