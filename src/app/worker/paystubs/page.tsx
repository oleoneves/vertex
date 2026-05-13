import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, Receipt } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { listWorkerPaystubs } from "@/lib/paystub";
import { AreaChart, CHART_COLORS } from "../../_components/charts";

import { fmtUsd, fmtNum } from "@/lib/format";
export const dynamic = "force-dynamic";

export default async function WorkerPaystubsPage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/paystubs");

  const stubs = await listWorkerPaystubs(worker.id);
  const ytdGross = stubs.reduce((a, s) => a + s.gross, 0);
  const ytdHours = stubs.reduce((a, s) => a + s.hours, 0);

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Pay stubs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Weekly earnings statements. Download a PDF copy for your records.
      </p>

      {stubs.length > 0 && (
        <>
          <section className="mt-4 grid gap-3 sm:grid-cols-2">
            <Summary label="Last 26 weeks · gross" value={fmtUsd(ytdGross)} />
            <Summary label="Last 26 weeks · hours" value={fmtNum(ytdHours, { decimals: 1 })} unit="hrs" />
          </section>

          <section className="mt-6 rounded-xl border border-border bg-background p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Weekly gross earnings
            </h2>
            <div className="mt-4 text-foreground">
              <AreaChart
                data={[...stubs]
                  .reverse()
                  .map((s) => ({
                    label: new Date(s.periodStart).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    }),
                    value: s.gross,
                  }))}
                height={180}
                yFormatter={(n) => fmtUsd(n, { decimals: 0, compact: true })}
                color={CHART_COLORS.green}
                xLabels={Math.min(8, stubs.length)}
              />
            </div>
          </section>
        </>
      )}

      {stubs.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-muted-foreground">No pay stubs yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Approved hours will roll up into a weekly stub here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {stubs.map((s) => (
            <li
              key={s.periodStart}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4"
            >
              <div className="min-w-0">
                <div className="font-semibold">
                  {new Date(s.periodStart).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  →{" "}
                  {new Date(s.periodEnd).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {fmtNum(s.hours, { decimals: 2 })} hrs ·{" "}
                  {s.paidAt ? (
                    <span className="text-green-700 dark:text-green-400">
                      paid {new Date(s.paidAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">pending</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-lg font-extrabold">
                  {fmtUsd(s.gross, { decimals: 2 })}
                </span>
                <Link
                  href={`/api/paystubs/${s.periodStart}/pdf`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Download className="h-3 w-3" /> PDF
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Summary({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
