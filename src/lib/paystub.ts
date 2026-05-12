import "server-only";
import { getSupabaseServer } from "./supabase/server";
import type { Worker } from "@/types/db";
import { payrollReference } from "./payroll";

export type PaystubSummary = {
  periodStart: string;
  periodEnd: string;
  hours: number;
  gross: number;
  paidAt: string | null;
};

export async function listWorkerPaystubs(workerId: string): Promise<PaystubSummary[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await getSupabaseServer();

  // Look at last 26 weeks (6 months) of approved entries; bucket Mon-Sun.
  const since = new Date();
  since.setDate(since.getDate() - 26 * 7);

  const { data: entries } = await supabase
    .from("time_entries")
    .select("clock_in_at, hours_worked, pay_rate_at_entry")
    .eq("worker_id", workerId)
    .eq("approved", true)
    .gte("clock_in_at", since.toISOString())
    .order("clock_in_at", { ascending: false })
    .limit(5000);

  type Row = {
    clock_in_at: string;
    hours_worked: number | null;
    pay_rate_at_entry: number | null;
  };
  const rows = (entries as Row[]) ?? [];

  // Bucket by Mon–Sun period
  const map = new Map<string, { hours: number; gross: number }>();
  for (const r of rows) {
    const d = new Date(r.clock_in_at);
    const dow = d.getDay(); // 0 = Sun
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const periodStart = new Date(d);
    periodStart.setDate(d.getDate() - mondayOffset);
    periodStart.setHours(0, 0, 0, 0);
    const key = periodStart.toISOString().slice(0, 10);
    const acc = map.get(key) ?? { hours: 0, gross: 0 };
    const hrs = Number(r.hours_worked) || 0;
    acc.hours += hrs;
    acc.gross += hrs * (Number(r.pay_rate_at_entry) || 0);
    map.set(key, acc);
  }

  // Pull related payments
  const refs = Array.from(map.keys()).map((s) => payrollReference(s));
  const { data: paymentsRaw } = await supabase
    .from("payments")
    .select("reference, occurred_at")
    .eq("direction", "out")
    .eq("worker_id", workerId)
    .in("reference", refs.length > 0 ? refs : ["__none__"]);

  const paymentByRef = new Map(
    ((paymentsRaw as Array<{ reference: string | null; occurred_at: string }>) ?? []).map((p) => [
      p.reference ?? "",
      p.occurred_at,
    ]),
  );

  return Array.from(map.entries())
    .map(([periodStart, totals]) => {
      const end = new Date(periodStart);
      end.setDate(end.getDate() + 6);
      return {
        periodStart,
        periodEnd: end.toISOString().slice(0, 10),
        hours: Math.round(totals.hours * 100) / 100,
        gross: Math.round(totals.gross * 100) / 100,
        paidAt: paymentByRef.get(payrollReference(periodStart)) ?? null,
      };
    })
    .sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1));
}

export async function loadPaystubDetail(
  workerId: string,
  periodStart: string,
): Promise<{
  worker: Pick<Worker, "full_name" | "employee_code" | "payment_method">;
  periodStart: string;
  periodEnd: string;
  lines: { date: string; placement: string; hours: number; rate: number; amount: number }[];
  totals: { hours: number; gross: number };
  paid: { at: string | null; method: string | null; reference: string | null };
} | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  const supabase = await getSupabaseServer();
  const start = new Date(periodStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const [workerRes, entriesRes, paymentRes] = await Promise.all([
    supabase
      .from("workers")
      .select("full_name, employee_code, payment_method")
      .eq("id", workerId)
      .maybeSingle(),
    supabase
      .from("time_entries")
      .select(
        "clock_in_at, hours_worked, pay_rate_at_entry, placement:placements(role_title, employer:employers(name))",
      )
      .eq("worker_id", workerId)
      .eq("approved", true)
      .gte("clock_in_at", start.toISOString())
      .lt("clock_in_at", end.toISOString())
      .order("clock_in_at", { ascending: true }),
    supabase
      .from("payments")
      .select("occurred_at, method, reference")
      .eq("direction", "out")
      .eq("worker_id", workerId)
      .eq("reference", payrollReference(periodStart))
      .maybeSingle(),
  ]);

  const worker = workerRes.data as Worker | null;
  if (!worker) return null;

  type Row = {
    clock_in_at: string;
    hours_worked: number | null;
    pay_rate_at_entry: number | null;
    placement: { role_title: string; employer: { name: string } | null } | null;
  };
  const rows = (entriesRes.data as unknown as Row[]) ?? [];
  const lines = rows.map((r) => {
    const hrs = Number(r.hours_worked) || 0;
    const rate = Number(r.pay_rate_at_entry) || 0;
    return {
      date: new Date(r.clock_in_at).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      placement: `${r.placement?.employer?.name ?? "—"} — ${r.placement?.role_title ?? "—"}`,
      hours: Math.round(hrs * 100) / 100,
      rate: Math.round(rate * 100) / 100,
      amount: Math.round(hrs * rate * 100) / 100,
    };
  });

  const totals = lines.reduce(
    (acc, l) => {
      acc.hours += l.hours;
      acc.gross += l.amount;
      return acc;
    },
    { hours: 0, gross: 0 },
  );

  const payment = paymentRes.data as
    | { occurred_at: string; method: string; reference: string }
    | null;

  return {
    worker,
    periodStart,
    periodEnd: end.toISOString().slice(0, 10),
    lines,
    totals: { hours: Math.round(totals.hours * 100) / 100, gross: Math.round(totals.gross * 100) / 100 },
    paid: {
      at: payment?.occurred_at ?? null,
      method: payment?.method ?? null,
      reference: payment?.reference ?? null,
    },
  };
}
