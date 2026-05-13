import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Download, ExternalLink, Receipt } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getInvoiceDetail, listInvoicePayments, supabaseReady } from "@/lib/workforce";
import { emailReady } from "@/lib/email";
import { SendInvoiceButton } from "./send-button";
import { RecordPaymentForm } from "./record-payment-form";

export const dynamic = "force-dynamic";

async function recordPaymentAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  "use server";

  if (!supabaseReady()) {
    return {
      ok: false,
      error: "Demo mode — connect Supabase to record real payments.",
    };
  }

  const id = String(formData.get("id"));
  const amount = Number(formData.get("amount"));
  const methodRaw = String(formData.get("method"));
  const allowed = ["ach", "check", "wire", "zelle", "cashapp", "stripe"] as const;
  const method = (allowed as readonly string[]).includes(methodRaw)
    ? (methodRaw as (typeof allowed)[number])
    : "ach";
  const reference = String(formData.get("reference") || "");
  const occurredAt = String(formData.get("occurred_at") || "");
  const notes = String(formData.get("notes") || "");

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  if (!occurredAt) {
    return { ok: false, error: "Pick the date the payment was received." };
  }

  const supabase = await getSupabaseServer();
  const { error: payErr } = await supabase.from("payments").insert({
    direction: "in",
    invoice_id: id,
    worker_id: null,
    amount,
    method,
    reference: reference || null,
    occurred_at: new Date(occurredAt).toISOString(),
    notes: notes || null,
  });
  if (payErr) return { ok: false, error: payErr.message };

  const { error: invErr } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date(occurredAt).toISOString() })
    .eq("id", id);
  if (invErr) return { ok: false, error: invErr.message };

  revalidatePath(`/admin/invoices/${id}`);
  revalidatePath(`/admin/invoices`);
  return { ok: true };
}

async function markSentAction(formData: FormData) {
  "use server";
  if (!supabaseReady()) return;
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/admin/invoices/${id}`);
}

function fmtMoney(n: number | string): string {
  return (Number(n) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusPill(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    paid: { bg: "bg-green-100 dark:bg-green-900/30", fg: "text-green-700 dark:text-green-300" },
    sent: { bg: "bg-blue-100 dark:bg-blue-900/30", fg: "text-blue-700 dark:text-blue-300" },
    overdue: { bg: "bg-red-100 dark:bg-red-900/30", fg: "text-red-700 dark:text-red-300" },
    void: { bg: "bg-red-100 dark:bg-red-900/30", fg: "text-red-700 dark:text-red-300" },
    draft: { bg: "bg-amber-100 dark:bg-amber-900/30", fg: "text-amber-700 dark:text-amber-300" },
  };
  return map[status] ?? map.draft;
}

const METHOD_LABEL: Record<string, string> = {
  ach: "ACH",
  check: "Check",
  wire: "Wire",
  zelle: "Zelle",
  cashapp: "Cash App",
  stripe: "Stripe",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [inv, payments] = await Promise.all([
    getInvoiceDetail(id),
    listInvoicePayments(id),
  ]);
  if (!inv) notFound();

  const employer = inv.employer;
  const pill = statusPill(inv.status);
  const paidTotal = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Math.max(0, Number(inv.total) - paidTotal);
  const billingEmail = employer?.billing_email ?? null;
  const totalHours = inv.lines.reduce((s, l) => s + (Number(l.hours) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> All invoices
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            {inv.invoice_number}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {employer?.name ?? "—"} · {fmtDate(inv.period_start)} → {fmtDate(inv.period_end)}
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pill.bg} ${pill.fg}`}
          >
            {inv.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/invoices/${inv.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Print view
          </Link>
          <a
            href={`/api/invoices/${inv.id}/pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </a>
          <SendInvoiceButton
            invoiceId={inv.id}
            billingEmail={billingEmail}
            disabled={!emailReady() || !billingEmail}
          />
          <form action={markSentAction}>
            <input type="hidden" name="id" value={inv.id} />
            <button
              type="submit"
              disabled={inv.status !== "draft" || !supabaseReady()}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              Mark sent
            </button>
          </form>
          <RecordPaymentForm
            invoiceId={inv.id}
            defaultAmount={balance > 0 ? balance : Number(inv.total)}
            defaultReference={`ACH-${inv.invoice_number}`}
            disabled={inv.status === "paid"}
            action={recordPaymentAction}
          />
        </div>
      </div>

      {/* Status banner */}
      {!emailReady() && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <strong>Email sending disabled:</strong> set{" "}
          <code className="font-mono">RESEND_API_KEY</code> (and optionally{" "}
          <code className="font-mono">INVOICE_FROM_EMAIL</code>) in Vercel env to enable
          &quot;Send to employer&quot;.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total invoiced" value={fmtMoney(inv.total)} />
        <SummaryCard
          label="Received"
          value={fmtMoney(paidTotal)}
          accent={paidTotal > 0 ? "green" : undefined}
        />
        <SummaryCard
          label="Balance due"
          value={fmtMoney(balance)}
          accent={balance > 0 ? "amber" : "muted"}
        />
      </div>

      {/* Two columns: bill-to / period+meta */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bill to
          </p>
          <p className="mt-2 text-base font-bold">{employer?.name ?? "—"}</p>
          {employer?.contact_name && (
            <p className="mt-1 text-sm">Attn: {employer.contact_name}</p>
          )}
          {employer?.billing_address && (
            <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
              {employer.billing_address}
            </p>
          )}
          {employer?.billing_email && (
            <p className="mt-2 text-sm text-muted-foreground">{employer.billing_email}</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Period & terms
          </p>
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Service period:</span>{" "}
            <strong>{fmtDate(inv.period_start)} → {fmtDate(inv.period_end)}</strong>
          </p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Issued:</span>{" "}
            <strong>{fmtDate(inv.created_at)}</strong>
          </p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Due:</span>{" "}
            <strong>{fmtDate(inv.due_date)}</strong>
          </p>
          {inv.sent_at && (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">Sent:</span>{" "}
              <strong>{fmtDate(inv.sent_at)}</strong>
            </p>
          )}
          {inv.paid_at && (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">Paid:</span>{" "}
              <strong>{fmtDate(inv.paid_at)}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Line items
          </p>
          <p className="text-xs text-muted-foreground">
            {inv.lines.length} lines · {totalHours.toFixed(2)} hours total
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2 font-bold">Worker / description</th>
                <th className="px-5 py-2 text-right font-bold">Hours</th>
                <th className="px-5 py-2 text-right font-bold">Rate</th>
                <th className="px-5 py-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                    No approved hours in this period.
                  </td>
                </tr>
              ) : (
                inv.lines.map((l, i) => (
                  <tr
                    key={l.id}
                    className={`border-b border-border/60 ${i % 2 === 1 ? "bg-muted/30" : ""}`}
                  >
                    <td className="px-5 py-2.5">
                      <div className="font-medium">{l.worker?.full_name ?? "Labor services"}</div>
                      <div className="text-xs text-muted-foreground">{l.description}</div>
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono tabular-nums">
                      {Number(l.hours).toFixed(2)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono tabular-nums">
                      {fmtMoney(l.rate)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono font-bold tabular-nums">
                      {fmtMoney(l.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t border-border bg-muted/20">
              <tr>
                <td colSpan={3} className="px-5 py-2 text-right text-sm text-muted-foreground">
                  Subtotal
                </td>
                <td className="px-5 py-2 text-right font-mono tabular-nums">
                  {fmtMoney(inv.subtotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-5 py-1.5 text-right text-sm text-muted-foreground">
                  Tax
                </td>
                <td className="px-5 py-1.5 text-right font-mono tabular-nums">
                  {fmtMoney(inv.tax)}
                </td>
              </tr>
              <tr className="border-t border-border">
                <td colSpan={3} className="px-5 py-3 text-right text-base font-bold">
                  Total due
                </td>
                <td className="px-5 py-3 text-right font-mono text-lg font-extrabold tabular-nums">
                  {fmtMoney(inv.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payments received */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Payments received
          </p>
          <p className="text-xs text-muted-foreground">
            {payments.length} · {fmtMoney(paidTotal)} total
          </p>
        </div>
        {payments.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Receipt className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No payments recorded yet for this invoice.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2 font-bold">Received</th>
                <th className="px-5 py-2 font-bold">Method</th>
                <th className="px-5 py-2 font-bold">Reference</th>
                <th className="px-5 py-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="px-5 py-2.5">{fmtDate(p.occurred_at)}</td>
                  <td className="px-5 py-2.5">
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {METHOD_LABEL[p.method] ?? p.method}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs">{p.reference ?? "—"}</td>
                  <td className="px-5 py-2.5 text-right font-mono font-bold tabular-nums text-green-700 dark:text-green-400">
                    {fmtMoney(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {inv.notes && (
        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Notes
          </p>
          <p className="mt-2 text-sm whitespace-pre-line">{inv.notes}</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "amber" | "muted";
}) {
  const colors: Record<string, string> = {
    green: "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/30",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30",
    muted: "border-border bg-muted/30",
  };
  return (
    <div
      className={`rounded-lg border p-4 ${accent ? colors[accent] : "border-border bg-background"}`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}
