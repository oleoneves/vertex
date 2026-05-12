import Link from "next/link";
import { listShifts } from "@/lib/workforce";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const shifts = await listShifts({ upcoming: true });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Upcoming shifts</h1>
        <Link
          href="/admin/shifts/new"
          className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          + New
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Worker</th>
              <th className="px-3 py-2">Employer</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No upcoming shifts.
                </td>
              </tr>
            )}
            {shifts.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <div>{new Date(s.scheduled_start).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    → {new Date(s.scheduled_end).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-3 py-2">{s.placement?.worker?.full_name ?? "—"}</td>
                <td className="px-3 py-2">{s.placement?.employer?.name ?? "—"}</td>
                <td className="px-3 py-2">{s.placement?.role_title ?? "—"}</td>
                <td className="px-3 py-2 capitalize">{s.status.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
