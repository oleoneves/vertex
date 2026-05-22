import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listEmployers } from "@/lib/workforce";
import { PageHeader } from "../../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
} from "../../_components/form";

async function generateFromHours(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const employerId = String(formData.get("employer_id"));
  const periodStart = String(formData.get("period_start"));
  const periodEnd = String(formData.get("period_end"));

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

  // Single aggregated LABOR line per worker (clean invoice — no per-day rows)
  const groups = new Map<
    string,
    {
      worker_id: string;
      placement_id: string;
      description: string;
      hours: number;
      rate: number;
    }
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
    kind: "labor" as const,
    unit: "hrs",
  }));
  const subtotal = lines.reduce((acc, l) => acc + l.amount, 0);
  const total = Math.round(subtotal * 100) / 100;

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
      tax: 0,
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

  redirect(`/admin/invoices/${invoice.id}/edit`);
}

async function createManualInvoice(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const employerId = String(formData.get("employer_id"));
  const periodStart = String(formData.get("period_start"));
  const periodEnd = String(formData.get("period_end"));
  if (!employerId || !periodStart || !periodEnd) {
    throw new Error("Employer and period are required");
  }

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
      subtotal: 0,
      tax: 0,
      total: 0,
      due_date: dueDate.toISOString().slice(0, 10),
      notes: "Manual invoice — fill in line items.",
    })
    .select("id")
    .single();
  if (error || !invoice) throw new Error(error?.message ?? "Failed to create invoice");

  redirect(`/admin/invoices/${invoice.id}/edit`);
}

export default async function NewInvoicePage() {
  const employers = await listEmployers();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      <PageHeader
        title="New invoice"
        subtitle="Generate from approved hours, or start a blank manual invoice."
      />

      {/* Auto-generate from approved hours */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Auto-generate from approved hours
          </h2>
          <p className="text-xs text-muted-foreground">
            Aggregates approved time entries in the date range — one LABOR line per worker. You can edit before sending.
          </p>
        </div>
        <form action={generateFromHours} className="space-y-4">
          <FormSection title="Employer & period">
            <FormSelect
              label="Employer"
              name="employer_id"
              required
              placeholder="Select employer…"
              span2
              options={employers.map((e) => ({ value: e.id, label: e.name }))}
            />
            <FormGrid>
              <FormField
                label="Period start"
                name="period_start"
                type="date"
                required
                defaultValue={weekAgo}
              />
              <FormField
                label="Period end"
                name="period_end"
                type="date"
                required
                defaultValue={today}
              />
            </FormGrid>
          </FormSection>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-bold text-accent-foreground hover:opacity-90"
            >
              Generate from hours
            </button>
          </div>
        </form>
      </section>

      {/* Blank manual invoice */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Manual invoice (blank)
          </h2>
          <p className="text-xs text-muted-foreground">
            Start empty and add Labor / Per Diem / Travel Time / Hotel line items yourself with custom quantities and rates.
          </p>
        </div>
        <form action={createManualInvoice} className="space-y-4">
          <FormSection title="Employer & period">
            <FormSelect
              label="Employer"
              name="employer_id"
              required
              placeholder="Select employer…"
              span2
              options={employers.map((e) => ({ value: e.id, label: e.name }))}
            />
            <FormGrid>
              <FormField
                label="Period start"
                name="period_start"
                type="date"
                required
                defaultValue={weekAgo}
              />
              <FormField
                label="Period end"
                name="period_end"
                type="date"
                required
                defaultValue={today}
              />
            </FormGrid>
          </FormSection>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-bold hover:bg-muted"
            >
              + Manual invoice
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
