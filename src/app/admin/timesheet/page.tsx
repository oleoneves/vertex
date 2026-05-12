import { Clock } from "lucide-react";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listTimeEntries } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";

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

  return (
    <div>
      <PageHeader
        title="Timesheet"
        subtitle="Review and approve clock entries before invoicing."
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
            label: "Status",
            value: sp.status,
            options: [
              { value: "pending", label: "Pending only" },
              { value: "approved", label: "Approved" },
              { value: "open", label: "Open (in progress)" },
            ],
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title="No time entries match"
          body="Entries appear here as workers clock in and out."
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
                <Th>Worker</Th>
                <Th>Placement</Th>
                <Th>Clock in</Th>
                <Th>Clock out</Th>
                <Th className="text-right">Hours</Th>
                <Th>Status</Th>
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
