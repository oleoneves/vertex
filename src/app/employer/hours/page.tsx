import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getCurrentEmployer, listEmployerHours } from "@/lib/employer";

import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
export const dynamic = "force-dynamic";

export default async function EmployerHours() {
  const scope = await getCurrentEmployer();
  if (!scope) redirect("/employer/login");

  const entries = await listEmployerHours(scope.employerId);

  const totalHours = entries.reduce(
    (acc, e) => acc + (Number(e.hours_worked) || 0),
    0,
  );
  const totalBilled = entries.reduce((acc, e) => {
    if (!e.hours_worked || !e.placement) return acc;
    return acc + Number(e.hours_worked) * Number(e.placement.bill_rate);
  }, 0);

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Hours (last 30 days)</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Summary label="Total hours" value={fmtNum(totalHours, { decimals: 1 })} unit="hrs" />
        <Summary label="Billable (gross)" value={fmtUsd(totalBilled)} accent />
        <Summary label="Entries" value={String(entries.length)} />
      </div>

      {entries.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-muted-foreground">No hours logged in the last 30 days.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/60 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">When</th>
                <th className="px-3 py-2.5">Worker</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5 text-right">Hours</th>
                <th className="px-3 py-2.5 text-right">Bill</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {entries.map((e) => {
                const hrs = Number(e.hours_worked) || 0;
                const bill = e.placement ? hrs * Number(e.placement.bill_rate) : 0;
                return (
                  <tr key={e.id} className="bg-background hover:bg-muted/30">
                    <td className="px-3 py-3 text-xs">
                      <div>{new Date(e.clock_in_at).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {new Date(e.clock_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        {" → "}
                        {e.clock_out_at
                          ? new Date(e.clock_out_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                          : "open"}
                      </div>
                    </td>
                    <td className="px-3 py-3">{e.worker?.full_name ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {e.placement?.role_title ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {fmtNum(hrs, { decimals: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {fmtUsd(bill, { decimals: 2 })}
                    </td>
                    <td className="px-3 py-3">
                      {e.approved ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          approved
                        </span>
                      ) : e.clock_out_at ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          pending
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          open
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Summary({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border p-5 ${
        accent ? "bg-accent/10" : "bg-background"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
