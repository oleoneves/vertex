import { DollarSign } from "lucide-react";
import { loadPayroll } from "@/lib/payroll";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td } from "../_components/data-table";
import { payAllUnpaid, payWorker } from "./actions";

import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ period_start?: string; period_end?: string }>;
}) {
  const locale = await getLocale();
  const sp = await searchParams;
  const data = await loadPayroll({ periodStart: sp.period_start, periodEnd: sp.period_end });

  return (
    <div>
      <PageHeader
        title={t(locale, "a.payroll.title")}
        subtitle={`Pay period: ${data.periodStart} → ${data.periodEnd}`}
        count={data.rows.length}
      >
        {data.totals.unpaidCount > 0 && (
          <form action={payAllUnpaid}>
            <input type="hidden" name="period_start" value={data.periodStart} />
            <input type="hidden" name="period_end" value={data.periodEnd} />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-bold text-accent-foreground hover:opacity-90"
            >
              Pay all unpaid ({fmtUsd(data.totals.unpaidPay)})
            </button>
          </form>
        )}
      </PageHeader>

      {/* Period picker */}
      <form
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3"
      >
        <label className="text-xs">
          <span className="block text-muted-foreground">Period start</span>
          <input
            name="period_start"
            type="date"
            defaultValue={data.periodStart}
            className="mt-1 h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="block text-muted-foreground">Period end</span>
          <input
            name="period_end"
            type="date"
            defaultValue={data.periodEnd}
            className="mt-1 h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          className="h-9 rounded-md bg-foreground px-3 text-sm font-bold text-background hover:opacity-90"
        >
          Apply
        </button>
      </form>

      {/* Totals */}
      <section className="mb-6 grid gap-3 sm:grid-cols-4">
        <Kpi label="Workers" value={String(data.rows.length)} />
        <Kpi label="Total hours" value={fmtNum(data.totals.hours, { decimals: 1 })} unit="hrs" />
        <Kpi label="Gross payroll" value={fmtUsd(data.totals.grossPay)} />
        <Kpi
          label="Unpaid"
          value={fmtUsd(data.totals.unpaidPay)}
          accent
          subValue={`${data.totals.unpaidCount} workers`}
        />
      </section>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-5 w-5" />}
          title="No approved hours in this period"
          body="Pick a different date range or approve some hours on the Timesheet page."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>Worker</Th>
              <Th>Code</Th>
              <Th>Method</Th>
              <Th className="text-right">Hours</Th>
              <Th className="text-right">Rate</Th>
              <Th className="text-right">Gross</Th>
              <Th>Status</Th>
              <Th></Th>
            </>
          }
        >
          {data.rows.map((r) => (
            <Tr key={r.workerId}>
              <Td className="font-medium">{r.workerName}</Td>
              <Td className="text-xs font-mono text-muted-foreground">
                {r.employeeCode ?? "—"}
              </Td>
              <Td className="text-xs uppercase tracking-wider text-muted-foreground">
                {r.paymentMethod}
              </Td>
              <Td className="text-right font-mono tabular-nums">{fmtNum(r.hours, { decimals: 2 })}</Td>
              <Td className="text-right text-xs text-muted-foreground">
                {r.rateBreakdown.length === 1
                  ? `$${r.rateBreakdown[0].rate.toFixed(2)}`
                  : r.rateBreakdown.map((b) => `$${b.rate}`).join(", ")}
              </Td>
              <Td className="text-right font-mono tabular-nums font-medium">
                {fmtUsd(r.grossPay, { decimals: 2 })}
              </Td>
              <Td>
                {r.alreadyPaid ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    paid
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    unpaid
                  </span>
                )}
              </Td>
              <Td>
                {!r.alreadyPaid && (
                  <form action={payWorker} className="inline">
                    <input type="hidden" name="worker_id" value={r.workerId} />
                    <input type="hidden" name="amount" value={r.grossPay} />
                    <input type="hidden" name="method" value={r.paymentMethod} />
                    <input type="hidden" name="period_start" value={data.periodStart} />
                    <button
                      type="submit"
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                    >
                      Pay
                    </button>
                  </form>
                )}
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  accent,
  subValue,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  subValue?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border p-4 ${
        accent ? "bg-accent/10" : "bg-background"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {subValue && <p className="mt-0.5 text-xs text-muted-foreground">{subValue}</p>}
    </div>
  );
}
