import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { listShifts } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { cancelShift } from "../_actions";

export const dynamic = "force-dynamic";

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ bulk?: string }>;
}) {
  const sp = await searchParams;
  const shifts = await listShifts({ upcoming: true });
  return (
    <div>
      <PageHeader
        title="Upcoming shifts"
        subtitle="Scheduled within the next several days."
        count={shifts.length}
        action={{ href: "/admin/shifts/new", label: "Schedule shift" }}
      >
        <Link
          href="/admin/shifts/bulk"
          className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          Bulk schedule
        </Link>
      </PageHeader>
      {sp.bulk && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
          ✓ Created {sp.bulk} shifts.
        </div>
      )}
      {shifts.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="No upcoming shifts"
          body="Schedule a shift against an active placement."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>When</Th>
              <Th>Worker</Th>
              <Th>Employer</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th></Th>
            </>
          }
        >
          {shifts.map((s) => {
            const start = new Date(s.scheduled_start);
            const end = new Date(s.scheduled_end);
            return (
              <Tr key={s.id}>
                <Td>
                  <div className="font-medium">
                    {start.toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} —{" "}
                    {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                </Td>
                <Td>{s.placement?.worker?.full_name ?? "—"}</Td>
                <Td>{s.placement?.employer?.name ?? "—"}</Td>
                <Td className="text-muted-foreground">{s.placement?.role_title ?? "—"}</Td>
                <Td>
                  <StatusPill
                    status={s.status}
                    variant={
                      s.status === "completed"
                        ? "green"
                        : s.status === "in_progress"
                        ? "amber"
                        : s.status === "no_show" || s.status === "cancelled"
                        ? "red"
                        : "blue"
                    }
                  />
                </Td>
                <Td>
                  {(s.status === "scheduled" || s.status === "in_progress") && (
                    <form action={cancelShift} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </Td>
              </Tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
