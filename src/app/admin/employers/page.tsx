import Link from "next/link";
import { listEmployers } from "@/lib/workforce";

export const dynamic = "force-dynamic";

export default async function EmployersPage() {
  const employers = await listEmployers();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Employers</h1>
        <Link
          href="/admin/employers/new"
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
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Bill multiplier</th>
              <th className="px-3 py-2">Terms</th>
            </tr>
          </thead>
          <tbody>
            {employers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  No employers yet.
                </td>
              </tr>
            )}
            {employers.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{e.name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {e.contact_name} {e.billing_email && `· ${e.billing_email}`}
                </td>
                <td className="px-3 py-2">{e.bill_rate_multiplier}×</td>
                <td className="px-3 py-2 text-muted-foreground">Net {e.payment_terms_days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
