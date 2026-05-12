import Link from "next/link";
import { listJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const jobs = await listJobs();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <Link
          href="/admin/jobs/new"
          className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          + New
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-border rounded-lg border border-border bg-background">
        {jobs.map((j) => (
          <li key={j.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium">{j.title}</div>
              <div className="text-xs text-muted-foreground">
                {j.employer} · {j.location_city}, {j.location_state}
              </div>
            </div>
            <Link
              href={`/jobs/${j.slug}`}
              className="text-sm text-accent underline-offset-4 hover:underline"
            >
              View public →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
