"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Briefcase, Receipt, Clock, FileText } from "lucide-react";

export type ActivityEvent = {
  type: "application" | "invoice" | "time" | "doc";
  label: string;
  href?: string;
  at: string;
};

const TYPE_META: Record<
  ActivityEvent["type"],
  { Icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  application: { Icon: Briefcase, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400" },
  invoice: { Icon: Receipt, color: "text-yellow-700 bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400" },
  time: { Icon: Clock, color: "text-green-700 bg-green-100 dark:bg-green-950/40 dark:text-green-400" },
  doc: { Icon: FileText, color: "text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400" },
};

export type BellLabels = {
  title: string;
  allCaughtUp: string;
  newLabel: string;
  noActivity: string;
  justNow: string;
  mAgo: string;
  hAgo: string;
  dAgo: string;
};

function relativeTime(iso: string, l: BellLabels): string {
  const diffMs = Date.now() - +new Date(iso);
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return l.justNow;
  if (m < 60) return `${m}${l.mAgo}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${l.hAgo}`;
  const d = Math.floor(h / 24);
  return `${d}${l.dAgo}`;
}

export function NotificationsBell({
  events,
  labels,
}: {
  events: ActivityEvent[];
  labels: BellLabels;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Unread count: anything in the last 1 hour
  const oneHourAgo = Date.now() - 3600 * 1000;
  const unread = events.filter((e) => +new Date(e.at) >= oneHourAgo).length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-2xl lg:left-auto lg:right-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {labels.title}
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {unread > 0 ? `${unread} ${labels.newLabel}` : labels.allCaughtUp}
            </span>
          </div>
          <ul className="max-h-96 divide-y divide-border/60 overflow-y-auto">
            {events.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {labels.noActivity}
              </li>
            ) : (
              events.map((e, i) => {
                const meta = TYPE_META[e.type];
                const Icon = meta.Icon;
                const isNew = +new Date(e.at) >= oneHourAgo;
                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 text-sm ${
                      e.href ? "hover:bg-muted" : ""
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${meta.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2">{e.label}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {relativeTime(e.at, labels)}
                      </p>
                    </div>
                    {isNew && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    )}
                  </div>
                );
                return (
                  <li key={i}>
                    {e.href ? (
                      <Link href={e.href} onClick={() => setOpen(false)}>
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
