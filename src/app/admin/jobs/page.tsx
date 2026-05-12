import Link from "next/link";
import { Briefcase } from "lucide-react";
import { listJobs } from "@/lib/jobs";
import { styleForCategory } from "@/lib/industries";
import { formatHourlyRange } from "@/lib/utils";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const jobs = await listJobs();
  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Public job listings."
        count={jobs.length}
        action={{ href: "/admin/jobs/new", label: "New job" }}
      />
      {jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="No jobs posted"
          body="Add your first job to start receiving applications."
          action={
            <Link
              href="/admin/jobs/new"
              className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-bold text-accent-foreground hover:opacity-90"
            >
              + New job
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {jobs.map((j) => {
            const style = styleForCategory(j.category);
            return (
              <li
                key={j.id}
                className="overflow-hidden rounded-xl border border-border bg-background transition hover:border-foreground/30"
              >
                <span className={`block h-1 ${style.bar}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold tracking-tight">{j.title}</h2>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {j.employer} · {j.location_city}, {j.location_state}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold tabular-nums">
                        {formatHourlyRange(j.hourly_rate_min, j.hourly_rate_max)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        /hour
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${style.tint} ${style.text}`}
                    >
                      {j.category}
                    </span>
                    <Link
                      href={`/jobs/${j.slug}`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      Public →
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
