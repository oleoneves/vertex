import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { getCurrentEmployer } from "@/lib/employer";
import { getInvoiceDetail } from "@/lib/workforce";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function EmployerInvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const scope = await getCurrentEmployer();
  if (!scope) redirect("/employer/login");

  const { id } = await params;
  const inv = await getInvoiceDetail(id);
  if (!inv) notFound();
  // Scope guard: RLS already enforces, but double-check
  if (inv.employer_id !== scope.employerId) notFound();

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/employer/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Invoices
        </Link>
        <a
          href={`/api/invoices/${inv.id}/pdf`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm font-bold text-background hover:opacity-90"
        >
          <Download className="h-3.5 w-3.5" /> Download PDF
        </a>
      </div>

      <article className="mt-4 rounded-xl border border-border bg-background p-6 sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="inline-block h-5 w-5 rounded bg-accent" />
              {brand.name}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{brand.legalName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Invoice</p>
            <p className="font-mono text-xl font-extrabold tracking-tight">
              {inv.invoice_number}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Issued: {new Date(inv.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground">Due: {inv.due_date ?? "—"}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bill to</p>
            <p className="mt-1 font-medium">{scope.employer.name}</p>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {scope.employer.billing_address ?? ""}
            </p>
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
                  No line items.
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

        <p className="mt-8 text-xs text-muted-foreground">
          Make checks payable to {brand.legalName} or remit via ACH. Questions? Email{" "}
          <a href={`mailto:${brand.supportEmail}`} className="text-accent hover:underline">
            {brand.supportEmail}
          </a>
          .
        </p>
      </article>
    </div>
  );
}
