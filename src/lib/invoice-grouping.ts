import type { InvoiceLineItem, InvoiceLineKind } from "@/types/db";

export type InvoiceCategoryKey = "labor" | "per_diem" | "travel" | "hotel";

export type InvoiceCategoryRow = {
  key: InvoiceCategoryKey;
  label: string;
  description: string;
  qtyText: string;
  rateText: string;
  amount: number;
  hasData: boolean;
};

function daysBetween(startISO: string, endISO: string): number {
  const a = new Date(startISO).getTime();
  const b = new Date(endISO).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtNumber(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function aggregateNonLabor(
  lines: InvoiceLineItem[],
  kind: Extract<InvoiceLineKind, "per_diem" | "travel" | "hotel">,
  label: string,
  defaultUnit: string,
): InvoiceCategoryRow {
  const matches = lines.filter((l) => l.kind === kind);
  if (matches.length === 0) {
    return {
      key: kind,
      label,
      description: "—",
      qtyText: "—",
      rateText: "—",
      amount: 0,
      hasData: false,
    };
  }
  const totalQty = matches.reduce((s, l) => s + Number(l.hours ?? 0), 0);
  const totalAmount = matches.reduce((s, l) => s + Number(l.amount ?? 0), 0);
  const avgRate = totalQty > 0 ? totalAmount / totalQty : 0;
  const unit = matches[0]?.unit || defaultUnit;
  const description =
    matches.length === 1
      ? matches[0].description
      : `${matches.length} entries`;
  return {
    key: kind,
    label,
    description,
    qtyText: totalQty > 0 ? `${fmtNumber(totalQty, 2)} ${unit}` : "—",
    rateText: avgRate > 0 ? `${fmtUsd(avgRate)}/${unit.replace(/s$/, "")}` : "—",
    amount: totalAmount,
    hasData: true,
  };
}

export function groupInvoiceLines(
  lines: InvoiceLineItem[],
  periodStart: string,
  periodEnd: string,
): InvoiceCategoryRow[] {
  const days = daysBetween(periodStart, periodEnd);

  const laborLines = lines.filter(
    (l) => (l.kind ?? "labor") === "labor" && Number(l.hours) > 0,
  );
  const people = new Set(laborLines.map((l) => l.worker_id ?? l.id)).size;
  const totalHours = laborLines.reduce((s, l) => s + Number(l.hours), 0);
  const totalLabor = laborLines.reduce((s, l) => s + Number(l.amount), 0);
  const avgRate = totalHours > 0 ? totalLabor / totalHours : 0;

  const labor: InvoiceCategoryRow = {
    key: "labor",
    label: "Labor",
    description:
      people > 0
        ? `${people} ${people === 1 ? "person" : "people"} × ${days} ${days === 1 ? "day" : "days"}`
        : "—",
    qtyText: totalHours > 0 ? `${fmtNumber(totalHours, 2)} hrs` : "—",
    rateText: avgRate > 0 ? `${fmtUsd(avgRate)}/hr` : "—",
    amount: totalLabor,
    hasData: laborLines.length > 0,
  };

  return [
    labor,
    aggregateNonLabor(lines, "per_diem", "Per Diem", "days"),
    aggregateNonLabor(lines, "travel", "Travel Time", "hrs"),
    aggregateNonLabor(lines, "hotel", "Hotel", "nights"),
  ];
}
