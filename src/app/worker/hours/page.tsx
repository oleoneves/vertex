import { redirect } from "next/navigation";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";

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
      <h1 className="text-xl font-bold tracking-tight">Your hours</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Approved</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {totalApproved.toFixed(2)} <span className="text-sm font-medium text-muted-foreground">hrs</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending review</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {totalPending.toFixed(2)} <span className="text-sm font-medium text-muted-foreground">hrs</span>
          </p>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Placement</th>
              <th className="px-3 py-2 text-right">Hours</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  No time entries yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <div>{new Date(r.clock_in_at).toLocaleDateString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.clock_in_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" → "}
                    {r.clock_out_at
                      ? new Date(r.clock_out_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "in progress"}
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {r.placement?.employer?.name ?? "—"} — {r.placement?.role_title ?? "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {r.hours_worked != null ? Number(r.hours_worked).toFixed(2) : "—"}
                </td>
                <td className="px-3 py-2">
                  {r.approved ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      approved
                    </span>
                  ) : r.clock_out_at ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      pending
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      open
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
