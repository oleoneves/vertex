"use client";

import { useTransition } from "react";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n-client";
import { setLocale } from "@/app/actions/locale";

export function LocaleSwitcher() {
  const current = useLocale();
  const [pending, start] = useTransition();

  return (
    <select
      aria-label="Language"
      value={current}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("locale", e.target.value);
        start(() => setLocale(fd));
      }}
      className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
