import { Clock, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listTimeEntries } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";
import { fmtHours, fmtNum } from "@/lib/format";
import { Heatmap, CHART_COLORS } from "../../_components/charts";
import { updateTimeEntry, deleteTimeEntry } from "../_actions";
import { PrintButton } from "../_components/print-button";
import { Pagination } from "../_components/pagination";

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
  searchParams: Promise<{ status?: string; from?: string; to?: string; page?: string }>;
}) {
  const locale = await getLocale();
  const sp = await searchParams;
  const filterArgs: { unapprovedOnly?: boolean; from?: string; to?: string } = {};
  if (sp.status === "pending") filterArgs.unapprovedOnly = true;
  if (sp.from) filterArgs.from = new Date(sp.from).toISOString();
  if (sp.to) filterArgs.to = new Date(new Date(sp.to).getTime() + 86400000 - 1).toISOString();

  const entries = await listTimeEntries(filterArgs);
  const allFiltered =
    sp.status === "approved"
      ? entries.filter((e) => e.approved)
      : sp.status === "open"
      ? entries.filter((e) => !e.clock_out_at)
      : entries;
  const PAGE_SIZE = 100;
  const page = Math.max(1, Number(sp.page) || 1);
  const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print, nav, aside, header, .print-hide { display: none !important; }
              body { background: white !important; }
              input[type="time"], input[type="number"] { border: none !important; background: transparent !important; padding: 0 !important; }
              button { display: none !important; }
            }
          `,
        }}
      />
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
        <PrintButton />
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
        <>
          <form id="bulk-approve-form" action={bulkApprove} className="no-print">
            {approvable.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-accent/40 bg-accent/5 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {approvable.length} entries pending. Select rows or approve all at once.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-bold hover:bg-muted"
                  >
                    Approve selected
                  </button>
                </div>
              </div>
            )}
            {/* Hidden inputs to allow "approve all visible" without checking each box */}
            {approvable.map((e) => (
              <input key={`hidden-${e.id}`} type="hidden" name="ids_pool" value={e.id} />
            ))}
          </form>
          {approvable.length > 0 && (
            <form action={bulkApprove} className="no-print mb-3 inline-block">
              {approvable.map((e) => (
                <input key={`all-${e.id}`} type="hidden" name="ids" value={e.id} />
              ))}
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1 rounded-md bg-accent px-4 text-sm font-bold text-accent-foreground hover:opacity-90"
                onClick={undefined}
              >
                ✓ Aprovar TODAS as {approvable.length} pendentes
              </button>
            </form>
          )}
          <DataTable
            head={
              <>
                <Th className="w-8 no-print"></Th>
                <Th>{t(locale, "a.col.worker")}</Th>
                <Th>{t(locale, "a.col.placement")}</Th>
                <Th>Date</Th>
                <Th>{t(locale, "a.col.clock_in")} → {t(locale, "a.col.clock_out")}</Th>
                <Th className="text-right">{t(locale, "a.col.hours")}</Th>
                <Th>{t(locale, "a.filter.status")}</Th>
                <Th className="no-print"></Th>
              </>
            }
          >
            {filtered.map((e) => {
              const canApprove = !e.approved && e.clock_out_at;
              const inDate = new Date(e.clock_in_at);
              const dateIso = inDate.toISOString().slice(0, 10);
              const fmtTime = (iso: string | null) => {
                if (!iso) return "";
                const d = new Date(iso);
                return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              };
              return (
                <Tr key={e.id}>
                  <Td className="no-print">
                    {canApprove ? (
                      <input
                        type="checkbox"
                        form="bulk-approve-form"
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
                  <Td className="text-xs tabular-nums">
                    {inDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                  </Td>
                  <Td>
                    <form
                      action={updateTimeEntry}
                      className="flex items-center gap-1.5"
                    >
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="date" value={dateIso} />
                      <input
                        type="time"
                        name="clock_in"
                        defaultValue={fmtTime(e.clock_in_at)}
                        className="w-20 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs tabular-nums"
                      />
                      <span className="text-muted-foreground">→</span>
                      <input
                        type="time"
                        name="clock_out"
                        defaultValue={fmtTime(e.clock_out_at)}
                        className="w-20 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs tabular-nums"
                      />
                      <input
                        type="number"
                        name="break_minutes"
                        defaultValue={e.break_minutes ?? 0}
                        min="0"
                        step="5"
                        placeholder="brk"
                        title="Break (minutes)"
                        className="w-12 rounded border border-border bg-background px-1 py-0.5 text-right font-mono text-xs tabular-nums"
                      />
                      <button
                        type="submit"
                        className="no-print rounded bg-foreground px-2 py-0.5 text-[10px] font-bold text-background hover:opacity-80"
                      >
                        Save
                      </button>
                    </form>
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
                  <Td className="no-print">
                    <form action={deleteTimeEntry}>
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        aria-label="Delete entry"
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </Td>
                </Tr>
              );
            })}
          </DataTable>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={allFiltered.length}
            basePath="/admin/timesheet"
            preservedParams={{ status: sp.status, from: sp.from, to: sp.to }}
          />
        </>
      )}
    </div>
  );
}
