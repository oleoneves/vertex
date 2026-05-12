import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listTimeEntries } from "@/lib/workforce";

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
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Timesheet</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review clock-in/clock-out entries and approve hours for invoicing.
      </p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Worker</th>
              <th className="px-3 py-2">Placement</th>
              <th className="px-3 py-2">Clock in</th>
              <th className="px-3 py-2">Clock out</th>
              <th className="px-3 py-2">Hours</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No time entries yet.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{e.worker?.full_name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {e.placement?.employer?.name} — {e.placement?.role_title}
                </td>
                <td className="px-3 py-2">{new Date(e.clock_in_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {e.clock_out_at ? new Date(e.clock_out_at).toLocaleString() : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      open
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono">
                  {e.hours_worked != null ? Number(e.hours_worked).toFixed(2) : "—"}
                </td>
                <td className="px-3 py-2">
                  {e.approved ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      approved
                    </span>
                  ) : e.clock_out_at ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      pending
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {!e.approved && e.clock_out_at && (
                    <form action={approveEntry}>
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                      >
                        Approve
                      </button>
                    </form>
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
