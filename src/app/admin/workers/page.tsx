import Link from "next/link";
import { listWorkers } from "@/lib/workforce";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const workers = await listWorkers();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Workers</h1>
        <Link
          href="/admin/workers/new"
          className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          + New
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Pay rate</th>
              <th className="px-3 py-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No workers yet.
                </td>
              </tr>
            )}
            {workers.map((w) => (
              <tr key={w.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{w.full_name}</td>
                <td className="px-3 py-2 text-muted-foreground">{w.employee_code ?? "—"}</td>
                <td className="px-3 py-2 capitalize">
                  <span
                    className={
                      w.status === "active"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    }
                  >
                    {w.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {w.default_pay_rate ? `$${w.default_pay_rate}/hr` : "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {w.email ?? w.phone ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
