import type { InvoiceLineItem } from "@/types/db";

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

export function groupInvoiceLines(
  lines: InvoiceLineItem[],
  periodStart: string,
  periodEnd: string,
): InvoiceCategoryRow[] {
  const days = daysBetween(periodStart, periodEnd);

  const laborLines = lines.filter((l) => Number(l.hours) > 0);
  const people = new Set(laborLines.map((l) => l.worker_id)).size;
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

  const placeholder = (key: InvoiceCategoryKey, label: string): InvoiceCategoryRow => ({
    key,
    label,
    description: "—",
    qtyText: "—",
    rateText: "—",
    amount: 0,
    hasData: false,
  });

  return [
    labor,
    placeholder("per_diem", "Per Diem"),
    placeholder("travel", "Travel Time"),
    placeholder("hotel", "Hotel"),
  ];
}
