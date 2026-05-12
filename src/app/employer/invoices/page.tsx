import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { getCurrentEmployer, listEmployerInvoices } from "@/lib/employer";

export const dynamic = "force-dynamic";

export default async function EmployerInvoices() {
  const scope = await getCurrentEmployer();
  if (!scope) redirect("/employer/login");

  const invoices = await listEmployerInvoices(scope.employerId);

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Invoices</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vertex bills you weekly or per the terms in your contract.
      </p>

      {invoices.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-muted-foreground">No invoices yet.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {invoices.map((i) => (
            <li key={i.id}>
              <Link
                href={`/employer/invoices/${i.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-foreground/30"
              >
                <div>
                  <div className="font-mono text-sm font-medium">{i.invoice_number}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.period_start} → {i.period_end}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold tabular-nums">
                    ${Number(i.total).toFixed(2)}
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider">
                    {i.status === "paid" ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 font-bold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        paid
                      </span>
                    ) : i.status === "overdue" ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                        overdue
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                        {i.status}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
