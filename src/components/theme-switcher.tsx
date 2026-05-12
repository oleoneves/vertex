"use client";

import { useTransition } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { setTheme } from "@/app/actions/theme";
import type { Theme } from "@/lib/theme";

export function ThemeSwitcher({ current }: { current: Theme }) {
  const [pending, start] = useTransition();
  const next: Theme = current === "light" ? "dark" : current === "dark" ? "system" : "light";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;
  const label =
    current === "light" ? "Light mode" : current === "dark" ? "Dark mode" : "System theme";

  return (
    <button
      aria-label={`Switch theme (currently ${label})`}
      title={label}
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("theme", next);
        start(() => setTheme(fd));
      }}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
    >
      <Icon size={16} />
    </button>
  );
}
