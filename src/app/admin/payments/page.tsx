import { DollarSign, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td } from "../_components/data-table";

import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  direction: "in" | "out";
  amount: number;
  method: string;
  occurred_at: string;
  reference: string | null;
  invoice: { invoice_number: string } | null;
  worker: { full_name: string } | null;
};

async function load(): Promise<Row[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, direction, amount, method, occurred_at, reference, invoice:invoices(invoice_number), worker:workers(full_name)",
    )
    .order("occurred_at", { ascending: false });
  return (data as unknown as Row[]) ?? [];
}

export default async function PaymentsPage() {
  const locale = await getLocale();
  const payments = await load();
  const net = payments.reduce(
    (acc, p) => {
      const amt = Number(p.amount) || 0;
      if (p.direction === "in") acc.in += amt;
      else acc.out += amt;
      return acc;
    },
    { in: 0, out: 0 },
  );

  return (
    <div>
      <PageHeader
        title={t(locale, "a.payments.title")}
        subtitle={t(locale, "a.payments.subtitle")}
        count={payments.length}
      />

      {payments.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard label={t(locale, "a.inv.received_amt")} value={net.in} positive />
          <SummaryCard label={locale === "pt" ? "Pago" : locale === "es" ? "Pagado" : "Paid out"} value={net.out} />
          <SummaryCard label={locale === "pt" ? "Líquido" : locale === "es" ? "Neto" : "Net"} value={net.in - net.out} accent />
        </div>
      )}

      {payments.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-5 w-5" />}
          title={t(locale, "a.table.no_match")}
          body={t(locale, "a.table.adjust_filter")}
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>{t(locale, "a.col.received")}</Th>
              <Th>{locale === "pt" ? "Direção" : locale === "es" ? "Dirección" : "Direction"}</Th>
              <Th>{locale === "pt" ? "Contraparte" : locale === "es" ? "Contraparte" : "Counterparty"}</Th>
              <Th>{t(locale, "a.col.method")}</Th>
              <Th>{t(locale, "a.col.reference")}</Th>
              <Th className="text-right">{t(locale, "a.col.amount")}</Th>
            </>
          }
        >
          {payments.map((p) => (
            <Tr key={p.id}>
              <Td className="text-xs">{new Date(p.occurred_at).toLocaleDateString()}</Td>
              <Td>
                {p.direction === "in" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400">
                    <ArrowDownLeft className="h-3 w-3" /> {t(locale, "a.inv.received_amt")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400">
                    <ArrowUpRight className="h-3 w-3" /> {locale === "pt" ? "Pago" : locale === "es" ? "Pagado" : "Paid out"}
                  </span>
                )}
              </Td>
              <Td>
                {p.direction === "in"
                  ? p.invoice?.invoice_number ?? "—"
                  : p.worker?.full_name ?? "—"}
              </Td>
              <Td className="text-xs uppercase tracking-wider text-muted-foreground">
                {p.method}
              </Td>
              <Td className="text-xs text-muted-foreground">{p.reference ?? "—"}</Td>
              <Td className="text-right font-mono tabular-nums font-medium">
                {fmtUsd(p.amount, { decimals: 2 })}
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  positive,
  accent,
}: {
  label: string;
  value: number;
  positive?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border p-4 ${
        accent ? "bg-accent/10" : "bg-background"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-extrabold tabular-nums ${
          positive ? "text-green-700 dark:text-green-400" : ""
        }`}
      >
        {fmtUsd(value)}
      </p>
    </div>
  );
}
