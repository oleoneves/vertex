import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Download } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getInvoiceDetail } from "@/lib/workforce";
import { brand } from "@/lib/brand";
import { emailReady } from "@/lib/email";
import { SendInvoiceButton } from "./send-button";

export const dynamic = "force-dynamic";

async function markAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const action = String(formData.get("action"));
  const supabase = await getSupabaseServer();
  if (action === "send") {
    await supabase
      .from("invoices")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);
  } else if (action === "paid") {
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id);
  }
  revalidatePath(`/admin/invoices/${id}`);
}

export default async function InvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getInvoiceDetail(id);
  if (!inv) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="font-mono text-xl font-bold tracking-tight">{inv.invoice_number}</h1>
        <div className="flex flex-wrap gap-2">
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
            billingEmail={(inv.employer as { billing_email?: string | null } | null)?.billing_email ?? null}
            disabled={!emailReady() || !((inv.employer as { billing_email?: string | null } | null)?.billing_email)}
          />
          <form action={markAction}>
            <input type="hidden" name="id" value={inv.id} />
            <input type="hidden" name="action" value="send" />
            <button
              type="submit"
              disabled={inv.status !== "draft"}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              Mark sent
            </button>
          </form>
          <form action={markAction}>
            <input type="hidden" name="id" value={inv.id} />
            <input type="hidden" name="action" value="paid" />
            <button
              type="submit"
              disabled={inv.status === "paid"}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Mark paid
            </button>
          </form>
        </div>
      </div>

      {!emailReady() && (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <strong>Email sending disabled:</strong> set <code className="font-mono">RESEND_API_KEY</code>{" "}
          (and optionally <code className="font-mono">INVOICE_FROM_EMAIL</code>) in your Vercel env to enable &quot;Send to employer&quot;.
        </div>
      )}

      <article className="mt-8 rounded-lg border border-border bg-background p-8">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <span className="inline-block h-5 w-5 rounded bg-accent" />
              {brand.name}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{brand.legalName}</p>
            <p className="text-xs text-muted-foreground">{brand.supportEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Invoice</p>
            <p className="text-2xl font-extrabold tracking-tight">{inv.invoice_number}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Issued: {new Date(inv.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground">Due: {inv.due_date ?? "—"}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bill to</p>
            <p className="mt-1 font-medium">{inv.employer?.name}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {(inv.employer as { billing_address?: string } | null)?.billing_address ?? ""}
            </p>
            <p className="text-sm text-muted-foreground">{inv.employer?.billing_email}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Period</p>
            <p className="mt-1 font-medium">
              {inv.period_start} → {inv.period_end}
            </p>
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Status</p>
            <p className="mt-1 capitalize">{inv.status}</p>
          </div>
        </section>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Hours</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  No approved hours in this period.
                </td>
              </tr>
            )}
            {inv.lines.map((l) => (
              <tr key={l.id} className="border-b border-border/60">
                <td className="py-3">{l.description}</td>
                <td className="py-3 text-right font-mono">{Number(l.hours).toFixed(2)}</td>
                <td className="py-3 text-right font-mono">${Number(l.rate).toFixed(2)}</td>
                <td className="py-3 text-right font-mono font-medium">
                  ${Number(l.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-right text-sm text-muted-foreground">
                Subtotal
              </td>
              <td className="pt-4 text-right font-mono">${Number(inv.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="text-right text-sm text-muted-foreground">
                Tax
              </td>
              <td className="text-right font-mono">${Number(inv.tax).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="pt-2 text-right text-base font-bold">
                Total due
              </td>
              <td className="pt-2 text-right font-mono text-xl font-extrabold">
                ${Number(inv.total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </article>
    </div>
  );
}
