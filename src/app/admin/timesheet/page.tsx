import { Clock } from "lucide-react";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listTimeEntries } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";

export const dynamic = "force-dynamic";

async function approveEntry(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
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
    .eq("id", id);
  revalidatePath("/admin/timesheet");
}

export default async function TimesheetPage() {
  const entries = await listTimeEntries();
  const pending = entries.filter((e) => !e.approved && e.clock_out_at).length;
  return (
    <div>
      <PageHeader
        title="Timesheet"
        subtitle="Review and approve clock entries before invoicing."
        count={entries.length}
      >
        {pending > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {pending} pending
          </span>
        )}
      </PageHeader>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title="No time entries"
          body="Entries appear here as workers clock in and out."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>Worker</Th>
              <Th>Placement</Th>
              <Th>Clock in</Th>
              <Th>Clock out</Th>
              <Th className="text-right">Hours</Th>
              <Th>Status</Th>
              <Th></Th>
            </>
          }
        >
          {entries.map((e) => (
            <Tr key={e.id}>
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
              <Td>
                {!e.approved && e.clock_out_at && (
                  <form action={approveEntry}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                    >
                      Approve
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
