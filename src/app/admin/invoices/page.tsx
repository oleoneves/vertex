import Link from "next/link";
import { Download, Receipt } from "lucide-react";
import { listInvoices } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";
import { fmtUsd } from "@/lib/format";

import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const locale = await getLocale();
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
        title={t(locale, "a.invoices.title")}
        subtitle={t(locale, "a.invoices.subtitle")}
        count={invoices.length}
        action={{ href: "/admin/invoices/new", label: t(locale, "a.invoices.generate") }}
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
              {t(locale, "a.invoices.paid_all")}
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              {fmtUsd(totals.paid)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-accent/10 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(locale, "a.invoices.outstanding")}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              {fmtUsd(totals.outstanding)}
            </p>
          </div>
        </div>
      )}

      <FilterBar
        filters={[
          {
            name: "status",
            label: t(locale, "a.filter.status"),
            value: sp.status,
            options: [
              { value: "draft", label: t(locale, "a.status.draft") },
              { value: "sent", label: t(locale, "a.status.sent") },
              { value: "paid", label: t(locale, "a.status.paid") },
              { value: "overdue", label: t(locale, "a.status.overdue") },
              { value: "void", label: t(locale, "a.status.void") },
            ],
          },
        ]}
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-5 w-5" />}
          title={t(locale, "a.table.no_match")}
          body={t(locale, "a.table.adjust_filter")}
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>{t(locale, "a.col.number")}</Th>
              <Th>{t(locale, "a.col.employer")}</Th>
              <Th>{t(locale, "a.col.period")}</Th>
              <Th className="text-right">{t(locale, "a.col.total")}</Th>
              <Th>{t(locale, "a.filter.status")}</Th>
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
                {fmtUsd(i.total, { decimals: 2 })}
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
