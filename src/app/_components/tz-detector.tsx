"use client";

import { useEffect } from "react";

/**
 * Sets a `vertex-tz` cookie with the browser's resolved timezone on mount.
 * Server reads it via readUserTimezone() to localize date/time displays.
 * Falls back to America/New_York server-side if the cookie is missing.
 */
export function TimezoneDetector() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const current = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("vertex-tz="))
        ?.split("=")[1];
      if (current !== tz) {
        const maxAge = 60 * 60 * 24 * 365; // 1 year
        document.cookie = `vertex-tz=${encodeURIComponent(tz)}; path=/; max-age=${maxAge}; samesite=lax`;
        // Reload once so server components pick up the new TZ on next render.
        // Guard against infinite loops with a sessionStorage flag.
        if (!sessionStorage.getItem("vertex-tz-reloaded")) {
          sessionStorage.setItem("vertex-tz-reloaded", "1");
          location.reload();
        }
      }
    } catch {
      // ignore — fall back to server default
    }
  }, []);
  return null;
}
