import Link from "next/link";
import { listPlacements } from "@/lib/workforce";

export const dynamic = "force-dynamic";

export default async function PlacementsPage() {
  const placements = await listPlacements();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Placements</h1>
        <Link
          href="/admin/placements/new"
          className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          + New
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Worker</th>
              <th className="px-3 py-2">Employer</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Pay / Bill</th>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {placements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No placements yet.
                </td>
              </tr>
            )}
            {placements.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{p.worker?.full_name ?? "—"}</td>
                <td className="px-3 py-2">{p.employer?.name ?? "—"}</td>
                <td className="px-3 py-2">{p.role_title}</td>
                <td className="px-3 py-2">
                  ${p.pay_rate} <span className="text-muted-foreground">/ ${p.bill_rate}</span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {p.start_date} → {p.end_date ?? "ongoing"}
                </td>
                <td className="px-3 py-2 capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
