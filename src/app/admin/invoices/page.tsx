import Link from "next/link";
import { listInvoices } from "@/lib/workforce";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await listInvoices();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <Link
          href="/admin/invoices/new"
          className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          + Generate
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Employer</th>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No invoices yet.
                </td>
              </tr>
            )}
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono">{i.invoice_number}</td>
                <td className="px-3 py-2">{i.employer?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {i.period_start} → {i.period_end}
                </td>
                <td className="px-3 py-2 font-medium">${Number(i.total).toFixed(2)}</td>
                <td className="px-3 py-2 capitalize">{i.status}</td>
                <td className="px-3 py-2">
                  <Link
                    className="text-xs text-accent underline-offset-4 hover:underline"
                    href={`/admin/invoices/${i.id}`}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
