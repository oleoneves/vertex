import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getInvoiceDetail } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  updateInvoiceMeta,
  updateInvoiceLine,
  addInvoiceLine,
  deleteInvoiceLine,
} from "../../../_actions";

export const dynamic = "force-dynamic";

const KIND_OPTIONS = [
  { value: "labor", label: "Labor", unit: "hrs" },
  { value: "per_diem", label: "Per Diem", unit: "days" },
  { value: "travel", label: "Travel Time", unit: "hrs" },
  { value: "hotel", label: "Hotel", unit: "nights" },
  { value: "other", label: "Other", unit: "" },
];

function fmtMoney(n: number | string): string {
  return (Number(n) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getInvoiceDetail(id);
  if (!inv) notFound();

  // Load employer contacts to populate the PM datalist
  const supabase = await getSupabaseServer();
  const { data: contactsRaw } = inv.employer
    ? await supabase
        .from("employer_contacts")
        .select("full_name, position")
        .eq("employer_id", (inv as { employer_id: string }).employer_id)
        .order("position", { ascending: true })
    : { data: null };
  const contacts =
    (contactsRaw as { full_name: string; position: string }[] | null) ?? [];

  const linesByKind: Record<string, typeof inv.lines> = {
    labor: [],
    per_diem: [],
    travel: [],
    hotel: [],
    other: [],
  };
  for (const l of inv.lines) {
    const k = (l.kind ?? "labor") as keyof typeof linesByKind;
    (linesByKind[k] ?? linesByKind.other).push(l);
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/invoices/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to invoice
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Edit invoice {inv.invoice_number}
        </h1>
        <p className="text-sm text-muted-foreground">
          Adjust dates, line items and totals before sending. Totals auto-recalculate on save.
        </p>
      </div>

      {/* Meta */}
      <form
        action={updateInvoiceMeta}
        className="rounded-xl border border-border bg-background p-5"
      >
        <input type="hidden" name="id" value={inv.id} />
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Period & terms
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">Period start</span>
            <input
              required
              name="period_start"
              type="date"
              defaultValue={inv.period_start}
              className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">Period end</span>
            <input
              required
              name="period_end"
              type="date"
              defaultValue={inv.period_end}
              className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">Due date</span>
            <input
              name="due_date"
              type="date"
              defaultValue={inv.due_date ?? ""}
              className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">Project manager</span>
            <input
              name="project_manager"
              list="pm-list"
              defaultValue={(inv as { project_manager?: string | null }).project_manager ?? ""}
              placeholder="Name from contractor"
              className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5"
            />
            <datalist id="pm-list">
              {contacts.map((c, i) => (
                <option key={i} value={c.full_name}>
                  {c.position.replace("_", " ")}
                </option>
              ))}
            </datalist>
          </label>
        </div>
        <input type="hidden" name="tax" value={inv.tax} />
        <label className="mt-3 block text-sm">
          <span className="text-xs text-muted-foreground">Notes</span>
          <textarea
            name="notes"
            rows={2}
            defaultValue={inv.notes ?? ""}
            className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5"
          />
        </label>
        <button
          type="submit"
          className="mt-4 rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground hover:opacity-90"
        >
          Save period & terms
        </button>
      </form>

      {/* Line items by category */}
      {KIND_OPTIONS.filter((k) => k.value !== "other" || linesByKind.other.length > 0).map(
        (k) => (
          <section
            key={k.value}
            className="rounded-xl border border-border bg-background p-5"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider">
                {k.label}
              </h2>
              <span className="text-xs text-muted-foreground">
                {linesByKind[k.value]?.length ?? 0} line
                {linesByKind[k.value]?.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {(linesByKind[k.value] ?? []).map((l) => (
                <form
                  key={l.id}
                  action={updateInvoiceLine}
                  className="grid grid-cols-12 items-center gap-2 rounded-md border border-border/70 bg-muted/20 p-2"
                >
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="invoice_id" value={inv.id} />
                  <input
                    name="description"
                    defaultValue={l.description}
                    className="col-span-12 rounded-md border border-border bg-background px-2 py-1 text-sm sm:col-span-5"
                    placeholder="Description"
                  />
                  <input
                    name="hours"
                    type="number"
                    step="0.01"
                    defaultValue={l.hours}
                    className="col-span-3 rounded-md border border-border bg-background px-2 py-1 text-sm font-mono tabular-nums sm:col-span-2"
                    placeholder="Qty"
                  />
                  <input
                    name="unit"
                    defaultValue={l.unit ?? k.unit}
                    className="col-span-3 rounded-md border border-border bg-background px-2 py-1 text-sm sm:col-span-1"
                    placeholder="unit"
                  />
                  <input
                    name="rate"
                    type="number"
                    step="0.01"
                    defaultValue={l.rate}
                    className="col-span-3 rounded-md border border-border bg-background px-2 py-1 text-sm font-mono tabular-nums sm:col-span-2"
                    placeholder="Rate"
                  />
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={l.amount}
                    className="col-span-3 rounded-md border border-border bg-background px-2 py-1 text-sm font-mono tabular-nums sm:col-span-2"
                    placeholder="Amount"
                  />
                  <div className="col-span-12 flex items-center justify-end gap-2 pt-1 sm:col-span-12">
                    <button
                      type="submit"
                      className="rounded-md bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent/30"
                    >
                      Save
                    </button>
                    <form action={deleteInvoiceLine}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="invoice_id" value={inv.id} />
                      <button
                        type="submit"
                        aria-label="Delete line"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </form>
                  </div>
                </form>
              ))}
            </div>

            {/* Add new line in this category */}
            <form
              action={addInvoiceLine}
              className="mt-3 grid grid-cols-12 items-center gap-2 border-t border-border pt-3"
            >
              <input type="hidden" name="invoice_id" value={inv.id} />
              <input type="hidden" name="kind" value={k.value} />
              <input
                name="description"
                required
                placeholder={`Add ${k.label.toLowerCase()} line…`}
                className="col-span-12 rounded-md border border-border bg-background px-2 py-1 text-sm sm:col-span-5"
              />
              <input
                name="hours"
                type="number"
                step="0.01"
                placeholder="Qty"
                className="col-span-3 rounded-md border border-border bg-background px-2 py-1 text-sm font-mono tabular-nums sm:col-span-2"
              />
              <input
                name="unit"
                defaultValue={k.unit}
                placeholder="unit"
                className="col-span-3 rounded-md border border-border bg-background px-2 py-1 text-sm sm:col-span-1"
              />
              <input
                name="rate"
                type="number"
                step="0.01"
                placeholder="Rate"
                className="col-span-3 rounded-md border border-border bg-background px-2 py-1 text-sm font-mono tabular-nums sm:col-span-2"
              />
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Amount (auto)"
                className="col-span-3 rounded-md border border-border bg-background px-2 py-1 text-sm font-mono tabular-nums sm:col-span-2"
              />
              <div className="col-span-12 flex justify-end pt-1">
                <button
                  type="submit"
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-bold hover:bg-muted"
                >
                  + Add {k.label}
                </button>
              </div>
            </form>
          </section>
        ),
      )}

      {/* Running totals */}
      <section className="rounded-xl border border-border bg-accent/5 p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Subtotal
            </p>
            <p className="font-mono text-lg font-bold tabular-nums">
              {fmtMoney(inv.subtotal)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Tax
            </p>
            <p className="font-mono text-lg font-bold tabular-nums">
              {fmtMoney(inv.tax)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Total
            </p>
            <p className="font-mono text-xl font-extrabold tabular-nums text-accent">
              {fmtMoney(inv.total)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
