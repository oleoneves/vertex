import { Clock } from "lucide-react";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listTimeEntries } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";
import { fmtHours, fmtNum } from "@/lib/format";
import { Heatmap, CHART_COLORS } from "../../_components/charts";

import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export const dynamic = "force-dynamic";

async function bulkApprove(formData: FormData) {
  "use server";
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("time_entries")
    .update({
      approved: true,
      approved_by: user?.id ?? null,
      approved_at: new Date().toISOString(),
    })
    .in("id", ids);
  revalidatePath("/admin/timesheet");
}

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const locale = await getLocale();
  const sp = await searchParams;
  const filterArgs: { unapprovedOnly?: boolean; from?: string; to?: string } = {};
  if (sp.status === "pending") filterArgs.unapprovedOnly = true;
  if (sp.from) filterArgs.from = new Date(sp.from).toISOString();
  if (sp.to) filterArgs.to = new Date(new Date(sp.to).getTime() + 86400000 - 1).toISOString();

  const entries = await listTimeEntries(filterArgs);
  const filtered =
    sp.status === "approved"
      ? entries.filter((e) => e.approved)
      : sp.status === "open"
      ? entries.filter((e) => !e.clock_out_at)
      : entries;
  const pending = entries.filter((e) => !e.approved && e.clock_out_at).length;
  const approvable = filtered.filter((e) => !e.approved && e.clock_out_at);

  // Build the heatmap: 7 rows (Mon-Sun) × 24 cols (0-23 hour)
  // Bucket each entry's hours into its (day-of-week, clock-in hour) cell.
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const e of entries) {
    if (!e.clock_in_at || e.hours_worked == null) continue;
    const t = new Date(e.clock_in_at);
    const dow = (t.getDay() + 6) % 7; // Mon=0..Sun=6
    const h = t.getHours();
    heatmap[dow][h] += Number(e.hours_worked) || 0;
  }
  const heatmapTotal = heatmap.flat().reduce((s, v) => s + v, 0);

  const COL_LABELS = Array.from({ length: 24 }, (_, i) =>
    i === 0 ? "12a" : i < 12 ? `${i}a` : i === 12 ? "12p" : `${i - 12}p`,
  );

  return (
    <div>
      <PageHeader
        title={t(locale, "a.timesheet.title")}
        subtitle={t(locale, "a.timesheet.subtitle")}
        count={filtered.length}
      >
        {pending > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {pending} pending
          </span>
        )}
      </PageHeader>

      <FilterBar
        filters={[
          {
            name: "status",
            label: t(locale, "a.filter.status"),
            value: sp.status,
            options: [
              { value: "pending", label: t(locale, "a.filter.pending_only") },
              { value: "approved", label: t(locale, "a.status.approved") },
              { value: "open", label: t(locale, "a.filter.open") },
            ],
          },
        ]}
      />

      {/* Activity heatmap */}
      {heatmapTotal > 0 && (
        <section className="mb-6 rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.timesheet.heatmap")}
            </h2>
            <span className="text-xs text-muted-foreground">
              {fmtHours(heatmapTotal, { decimals: 0 })} · {fmtNum(entries.length)}
            </span>
          </div>
          <div className="mt-4 text-foreground overflow-x-auto">
            <Heatmap
              data={heatmap}
              rowLabels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
              colLabels={COL_LABELS}
              color={CHART_COLORS.accent}
              valueFormatter={(n) => fmtHours(n, { decimals: 1 })}
              cellSize={18}
            />
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title={t(locale, "a.table.no_match")}
          body={t(locale, "a.table.adjust_filter")}
        />
      ) : (
        <form action={bulkApprove}>
          {approvable.length > 0 && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-dashed border-accent/40 bg-accent/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Select rows to approve in bulk.
              </span>
              <button
                type="submit"
                className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-xs font-bold text-accent-foreground hover:opacity-90"
              >
                Approve selected
              </button>
            </div>
          )}
          <DataTable
            head={
              <>
                <Th className="w-8"></Th>
                <Th>{t(locale, "a.col.worker")}</Th>
                <Th>{t(locale, "a.col.placement")}</Th>
                <Th>{t(locale, "a.col.clock_in")}</Th>
                <Th>{t(locale, "a.col.clock_out")}</Th>
                <Th className="text-right">{t(locale, "a.col.hours")}</Th>
                <Th>{t(locale, "a.filter.status")}</Th>
              </>
            }
          >
            {filtered.map((e) => {
              const canApprove = !e.approved && e.clock_out_at;
              return (
                <Tr key={e.id}>
                  <Td>
                    {canApprove ? (
                      <input
                        type="checkbox"
                        name="ids"
                        value={e.id}
                        aria-label="Select to approve"
                        className="h-4 w-4 rounded border-border accent-yellow-400"
                      />
                    ) : null}
                  </Td>
                  <Td className="font-medium">{e.worker?.full_name ?? "—"}</Td>
                  <Td className="text-xs text-muted-foreground">
                    {e.placement?.employer?.name} — {e.placement?.role_title}
                  </Td>
                  <Td className="text-xs">{new Date(e.clock_in_at).toLocaleString()}</Td>
                  <Td className="text-xs">
                    {e.clock_out_at ? (
                      new Date(e.clock_out_at).toLocaleString()
                    ) : (
                      <StatusPill status="open" variant="blue" />
                    )}
                  </Td>
                  <Td className="text-right font-mono tabular-nums">
                    {e.hours_worked != null ? Number(e.hours_worked).toFixed(2) : "—"}
                  </Td>
                  <Td>
                    {e.approved ? (
                      <StatusPill status="approved" variant="green" />
                    ) : e.clock_out_at ? (
                      <StatusPill status="pending" variant="amber" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </DataTable>
        </form>
      )}
    </div>
  );
}
