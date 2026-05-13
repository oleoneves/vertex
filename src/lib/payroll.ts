import "server-only";
import { getSupabaseServer } from "./supabase/server";
import { isDemoMode, demoPayroll } from "./demo";

export type PayrollRow = {
  workerId: string;
  workerName: string;
  employeeCode: string | null;
  paymentMethod: string;
  hours: number;
  grossPay: number;
  alreadyPaid: boolean;
  paymentId: string | null;
  rateBreakdown: { rate: number; hours: number }[];
};

export type PayrollData = {
  periodStart: string;
  periodEnd: string;
  rows: PayrollRow[];
  totals: { hours: number; grossPay: number; unpaidPay: number; unpaidCount: number };
};

function defaultPeriod() {
  // Default to last completed Mon–Sun
  const now = new Date();
  const day = now.getDay();
  const sundayOffset = day === 0 ? 7 : day; // days since last Sunday
  const periodEnd = new Date(now);
  periodEnd.setDate(now.getDate() - sundayOffset);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodEnd.getDate() - 6);
  return {
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
  };
}

export function payrollReference(periodStart: string): string {
  return `PAYROLL-${periodStart}`;
}

export async function loadPayroll({
  periodStart,
  periodEnd,
}: {
  periodStart?: string;
  periodEnd?: string;
} = {}): Promise<PayrollData> {
  const fallback = defaultPeriod();
  const start = periodStart || fallback.periodStart;
  const end = periodEnd || fallback.periodEnd;

  if (isDemoMode()) {
    return demoPayroll() as PayrollData;
  }

  const supabase = await getSupabaseServer();
  const startIso = new Date(start).toISOString();
  const endIso = new Date(new Date(end).getTime() + 86400000 - 1).toISOString();
  const reference = payrollReference(start);

  const [entriesRes, paymentsRes] = await Promise.all([
    supabase
      .from("time_entries")
      .select(
        "worker_id, hours_worked, pay_rate_at_entry, worker:workers(full_name, employee_code, payment_method)",
      )
      .eq("approved", true)
      .gte("clock_in_at", startIso)
      .lt("clock_in_at", endIso)
      .limit(20000),
    supabase
      .from("payments")
      .select("id, worker_id, amount")
      .eq("direction", "out")
      .eq("reference", reference),
  ]);

  type EntryRow = {
    worker_id: string;
    hours_worked: number | null;
    pay_rate_at_entry: number | null;
    worker: { full_name: string; employee_code: string | null; payment_method: string } | null;
  };
  const entries = (entriesRes.data as unknown as EntryRow[]) ?? [];
  const payments = (paymentsRes.data as Array<{ id: string; worker_id: string; amount: number }>) ?? [];

  type RowAcc = {
    workerId: string;
    workerName: string;
    employeeCode: string | null;
    paymentMethod: string;
    hours: number;
    grossPay: number;
    rates: Map<number, number>; // rate → hours
  };
  const map = new Map<string, RowAcc>();
  for (const e of entries) {
    const hrs = Number(e.hours_worked) || 0;
    const rate = Number(e.pay_rate_at_entry) || 0;
    if (!hrs || !e.worker) continue;
    let row = map.get(e.worker_id);
    if (!row) {
      row = {
        workerId: e.worker_id,
        workerName: e.worker.full_name,
        employeeCode: e.worker.employee_code,
        paymentMethod: e.worker.payment_method,
        hours: 0,
        grossPay: 0,
        rates: new Map(),
      };
      map.set(e.worker_id, row);
    }
    row.hours += hrs;
    row.grossPay += hrs * rate;
    row.rates.set(rate, (row.rates.get(rate) ?? 0) + hrs);
  }

  const paymentByWorker = new Map(payments.map((p) => [p.worker_id, p]));

  const rows: PayrollRow[] = Array.from(map.values())
    .map((r) => {
      const pmt = paymentByWorker.get(r.workerId);
      return {
        workerId: r.workerId,
        workerName: r.workerName,
        employeeCode: r.employeeCode,
        paymentMethod: r.paymentMethod,
        hours: Math.round(r.hours * 100) / 100,
        grossPay: Math.round(r.grossPay * 100) / 100,
        alreadyPaid: !!pmt,
        paymentId: pmt?.id ?? null,
        rateBreakdown: Array.from(r.rates.entries())
          .sort(([a], [b]) => b - a)
          .map(([rate, hours]) => ({ rate, hours: Math.round(hours * 100) / 100 })),
      };
    })
    .sort((a, b) => b.grossPay - a.grossPay);

  const totals = rows.reduce(
    (acc, r) => {
      acc.hours += r.hours;
      acc.grossPay += r.grossPay;
      if (!r.alreadyPaid) {
        acc.unpaidPay += r.grossPay;
        acc.unpaidCount += 1;
      }
      return acc;
    },
    { hours: 0, grossPay: 0, unpaidPay: 0, unpaidCount: 0 },
  );

  return {
    periodStart: start,
    periodEnd: end,
    rows,
    totals,
  };
}
