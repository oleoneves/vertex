// Number formatting utilities — US locale (1,234.56).

export function fmtUsd(
  n: number | string | null | undefined,
  opts: { decimals?: 0 | 2; compact?: boolean } = {},
): string {
  const v = Number(n) || 0;
  const { decimals = 2, compact = false } = opts;
  if (compact && Math.abs(v) >= 10_000) {
    return v.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    });
  }
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtNum(
  n: number | string | null | undefined,
  opts: { decimals?: number } = {},
): string {
  const v = Number(n) || 0;
  const { decimals = 0 } = opts;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtHours(
  n: number | string | null | undefined,
  opts: { decimals?: number; unit?: boolean } = {},
): string {
  const v = Number(n) || 0;
  const { decimals = 2, unit = true } = opts;
  const formatted = v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return unit ? `${formatted}h` : formatted;
}

export function fmtPct(
  n: number | string | null | undefined,
  opts: { decimals?: number } = {},
): string {
  const v = Number(n) || 0;
  const { decimals = 0 } = opts;
  return `${v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}
