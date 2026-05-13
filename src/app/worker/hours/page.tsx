import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

import { fmtNum } from "@/lib/format";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  hours_worked: number | null;
  approved: boolean;
  placement: { role_title: string; employer: { name: string } | null } | null;
};

export default async function WorkerHoursPage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/hours");
  const locale = await getLocale();

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("time_entries")
    .select(
      "id, clock_in_at, clock_out_at, hours_worked, approved, placement:placements(role_title, employer:employers(name))",
    )
    .eq("worker_id", worker.id)
    .order("clock_in_at", { ascending: false })
    .limit(40);

  const rows = (data as unknown as Row[]) ?? [];
  const totalApproved = rows
    .filter((r) => r.approved)
    .reduce((acc, r) => acc + (Number(r.hours_worked) || 0), 0);
  const totalPending = rows
    .filter((r) => !r.approved && r.clock_out_at)
    .reduce((acc, r) => acc + (Number(r.hours_worked) || 0), 0);

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t(locale, "w.hours.title")}</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SummaryCard label={t(locale, "w.hours.approved")} value={totalApproved} accent />
        <SummaryCard label={t(locale, "w.hours.pending_review")} value={totalPending} />
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-muted-foreground">{t(locale, "w.hours.no_entries")}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-semibold">
                    {new Date(r.clock_in_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(r.clock_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    {" → "}
                    {r.clock_out_at
                      ? new Date(r.clock_out_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                      : "in progress"}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {r.placement?.employer?.name ?? "—"} · {r.placement?.role_title ?? "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold tabular-nums">
                  {r.hours_worked != null ? Number(r.hours_worked).toFixed(2) : "—"}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">hrs</span>
                </div>
                <div className="mt-0.5">
                  {r.approved ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      approved
                    </span>
                  ) : r.clock_out_at ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      pending
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      open
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border p-5 ${accent ? "bg-accent/10" : "bg-background"}`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums">
        {fmtNum(value, { decimals: 2 })}
        <span className="ml-1 text-sm font-medium text-muted-foreground">hrs</span>
      </p>
    </div>
  );
}
