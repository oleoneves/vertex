import { DollarSign, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td } from "../_components/data-table";

import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
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
        title="Payments"
        subtitle="Money in (from employers) and money out (to workers)."
        count={payments.length}
      />

      {payments.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Received" value={net.in} positive />
          <SummaryCard label="Paid out" value={net.out} />
          <SummaryCard label="Net" value={net.in - net.out} accent />
        </div>
      )}

      {payments.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-5 w-5" />}
          title="No payments recorded"
          body="Receipts and payouts will appear here."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>When</Th>
              <Th>Direction</Th>
              <Th>Counterparty</Th>
              <Th>Method</Th>
              <Th>Reference</Th>
              <Th className="text-right">Amount</Th>
            </>
          }
        >
          {payments.map((p) => (
            <Tr key={p.id}>
              <Td className="text-xs">{new Date(p.occurred_at).toLocaleDateString()}</Td>
              <Td>
                {p.direction === "in" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400">
                    <ArrowDownLeft className="h-3 w-3" /> Received
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400">
                    <ArrowUpRight className="h-3 w-3" /> Paid out
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
