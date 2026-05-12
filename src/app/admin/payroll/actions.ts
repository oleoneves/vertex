"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { loadPayroll, payrollReference } from "@/lib/payroll";

export async function payAllUnpaid(formData: FormData) {
  const periodStart = String(formData.get("period_start"));
  const periodEnd = String(formData.get("period_end"));
  const data = await loadPayroll({ periodStart, periodEnd });
  const unpaid = data.rows.filter((r) => !r.alreadyPaid && r.grossPay > 0);
  if (unpaid.length === 0) return;

  const supabase = await getSupabaseServer();
  const reference = payrollReference(periodStart);
  const now = new Date().toISOString();

  const inserts = unpaid.map((r) => ({
    direction: "out" as const,
    worker_id: r.workerId,
    amount: r.grossPay,
    method: r.paymentMethod,
    reference,
    occurred_at: now,
  }));

  // Chunk inserts to be safe with large rosters (100+ workers fine, but stay defensive)
  const CHUNK = 500;
  for (let i = 0; i < inserts.length; i += CHUNK) {
    const slice = inserts.slice(i, i + CHUNK);
    const { error } = await supabase.from("payments").insert(slice);
    if (error) throw new Error(`Payroll insert failed at row ${i}: ${error.message}`);
  }

  revalidatePath("/admin/payroll");
  revalidatePath("/admin/payments");
}

export async function payWorker(formData: FormData) {
  const workerId = String(formData.get("worker_id"));
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") || "ach");
  const periodStart = String(formData.get("period_start"));

  if (!workerId || !amount || amount <= 0) return;

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("payments").insert({
    direction: "out",
    worker_id: workerId,
    amount,
    method,
    reference: payrollReference(periodStart),
    occurred_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/payroll");
  revalidatePath("/admin/payments");
}
