import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listEmployers } from "@/lib/workforce";

async function generateInvoice(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const employerId = String(formData.get("employer_id"));
  const periodStart = String(formData.get("period_start"));
  const periodEnd = String(formData.get("period_end"));
  const taxRate = Number(formData.get("tax_rate") || 0);

  // Pull approved time entries in the window for this employer
  const { data: entries } = await supabase
    .from("time_entries")
    .select(
      "id, worker_id, hours_worked, bill_rate_at_entry, placement:placements!inner(id, role_title, employer_id), worker:workers(full_name)",
    )
    .eq("approved", true)
    .gte("clock_in_at", new Date(periodStart).toISOString())
    .lte(
      "clock_in_at",
      new Date(new Date(periodEnd).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
    );

  type Row = {
    id: string;
    worker_id: string;
    hours_worked: number | null;
    bill_rate_at_entry: number | null;
    placement: { id: string; role_title: string; employer_id: string } | null;
    worker: { full_name: string } | null;
  };
  const matching = ((entries as unknown as Row[]) ?? []).filter(
    (e) => e.placement?.employer_id === employerId,
  );

  // Aggregate by worker + placement
  const groups = new Map<
    string,
    { worker_id: string; placement_id: string; description: string; hours: number; rate: number }
  >();
  for (const e of matching) {
    if (!e.placement || !e.hours_worked || !e.bill_rate_at_entry) continue;
    const key = `${e.worker_id}:${e.placement.id}`;
    const prev = groups.get(key);
    if (prev) {
      prev.hours += Number(e.hours_worked);
    } else {
      groups.set(key, {
        worker_id: e.worker_id,
        placement_id: e.placement.id,
        description: `${e.worker?.full_name ?? "Worker"} — ${e.placement.role_title}`,
        hours: Number(e.hours_worked),
        rate: Number(e.bill_rate_at_entry),
      });
    }
  }

  const lines = Array.from(groups.values()).map((g) => ({
    ...g,
    amount: Math.round(g.hours * g.rate * 100) / 100,
  }));
  const subtotal = lines.reduce((acc, l) => acc + l.amount, 0);
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const dueDate = new Date(periodEnd);
  const { data: emp } = await supabase
    .from("employers")
    .select("payment_terms_days")
    .eq("id", employerId)
    .maybeSingle();
  dueDate.setDate(dueDate.getDate() + (emp?.payment_terms_days ?? 15));

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      employer_id: employerId,
      period_start: periodStart,
      period_end: periodEnd,
      subtotal,
      tax,
      total,
      due_date: dueDate.toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (error || !invoice) throw new Error(error?.message ?? "Failed to create invoice");

  if (lines.length > 0) {
    await supabase.from("invoice_line_items").insert(
      lines.map((l) => ({ invoice_id: invoice.id, ...l })),
    );
  }

  redirect(`/admin/invoices/${invoice.id}`);
}

export default async function NewInvoicePage() {
  const employers = await listEmployers();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Generate invoice</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Aggregates approved time entries for the employer in the selected period.
      </p>
      <form action={generateInvoice} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Employer *</span>
          <select
            name="employer_id"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select employer…</option>
            {employers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Period start *</span>
          <input
            name="period_start"
            type="date"
            required
            defaultValue={weekAgo}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Period end *</span>
          <input
            name="period_end"
            type="date"
            required
            defaultValue={today}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Tax rate (%)</span>
          <input
            name="tax_rate"
            type="number"
            step="0.01"
            defaultValue="0"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Generate invoice
          </button>
        </div>
      </form>
    </div>
  );
}
