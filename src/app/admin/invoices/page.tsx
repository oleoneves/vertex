import Link from "next/link";
import { Download, Receipt } from "lucide-react";
import { listInvoices } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const all = await listInvoices();
  const invoices = sp.status ? all.filter((i) => i.status === sp.status) : all;
  const totals = all.reduce(
    (acc, i) => {
      if (i.status === "paid") acc.paid += Number(i.total);
      else if (i.status === "sent" || i.status === "overdue") acc.outstanding += Number(i.total);
      return acc;
    },
    { paid: 0, outstanding: 0 },
  );

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Billing to employers."
        count={invoices.length}
        action={{ href: "/admin/invoices/new", label: "Generate" }}
      >
        <a
          href="/api/admin/export?type=invoices"
          className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          ⇩ CSV
        </a>
      </PageHeader>

      {all.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Paid (all time)
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              ${totals.paid.toFixed(0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-accent/10 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              ${totals.outstanding.toFixed(0)}
            </p>
          </div>
        </div>
      )}

      <FilterBar
        filters={[
          {
            name: "status",
            label: "Status",
            value: sp.status,
            options: [
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "paid", label: "Paid" },
              { value: "overdue", label: "Overdue" },
              { value: "void", label: "Void" },
            ],
          },
        ]}
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-5 w-5" />}
          title="No invoices match"
          body="Generate the first invoice from approved hours in a date range."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>Number</Th>
              <Th>Employer</Th>
              <Th>Period</Th>
              <Th className="text-right">Total</Th>
              <Th>Status</Th>
              <Th></Th>
            </>
          }
        >
          {invoices.map((i) => (
            <Tr key={i.id}>
              <Td className="font-mono text-xs font-medium">{i.invoice_number}</Td>
              <Td>{i.employer?.name ?? "—"}</Td>
              <Td className="text-xs text-muted-foreground">
                {i.period_start} → {i.period_end}
              </Td>
              <Td className="text-right font-mono tabular-nums">
                ${Number(i.total).toFixed(2)}
              </Td>
              <Td>
                <StatusPill
                  status={i.status}
                  variant={
                    i.status === "paid"
                      ? "green"
                      : i.status === "overdue"
                      ? "red"
                      : i.status === "sent"
                      ? "blue"
                      : i.status === "void"
                      ? "muted"
                      : "amber"
                  }
                />
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-3">
                  <a
                    href={`/api/invoices/${i.id}/pdf?download=1`}
                    download={`${i.invoice_number}.pdf`}
                    title="Download PDF"
                    className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <Link
                    className="text-xs text-accent underline-offset-4 hover:underline"
                    href={`/admin/invoices/${i.id}`}
                  >
                    View →
                  </Link>
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
