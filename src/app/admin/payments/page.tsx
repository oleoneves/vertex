import { getSupabaseServer } from "@/lib/supabase/server";

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
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track money in (from employers) and money out (to workers).
      </p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">Counterparty</th>
              <th className="px-3 py-2">Method</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No payments recorded yet.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2">{new Date(p.occurred_at).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      p.direction === "in"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                        : "rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800"
                    }
                  >
                    {p.direction === "in" ? "Received" : "Paid out"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {p.direction === "in"
                    ? p.invoice?.invoice_number ?? "—"
                    : p.worker?.full_name ?? "—"}
                </td>
                <td className="px-3 py-2 capitalize text-muted-foreground">{p.method}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.reference ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono font-medium">
                  ${Number(p.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
