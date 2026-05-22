// Vertex Restoration is based in Florida — Eastern Time (Orlando).
// All admin/worker timestamps render in this TZ by default.
// DB always stores UTC (timestamptz); only display layer is localized.

export const VERTEX_TZ = "America/New_York";

type FmtOpts = {
  tz?: string;
  locale?: string;
};

export function fmtTime(iso: string | Date | null | undefined, opts: FmtOpts = {}): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(opts.locale ?? "en-US", {
    timeZone: opts.tz ?? VERTEX_TZ,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDate(iso: string | Date | null | undefined, opts: FmtOpts = {}): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(opts.locale ?? "en-US", {
    timeZone: opts.tz ?? VERTEX_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string | Date | null | undefined, opts: FmtOpts = {}): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(opts.locale ?? "en-US", {
    timeZone: opts.tz ?? VERTEX_TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtWeekday(iso: string | Date | null | undefined, opts: FmtOpts = {}): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(opts.locale ?? "en-US", {
    timeZone: opts.tz ?? VERTEX_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Read the user's preferred timezone from the `vertex-tz` cookie set by the client.
 * Falls back to America/New_York (Orlando).
 * Call from server components: `const tz = await readUserTimezone();`
 */
export async function readUserTimezone(): Promise<string> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const tz = store.get("vertex-tz")?.value;
  return tz && isValidTimezone(tz) ? tz : VERTEX_TZ;
}

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
