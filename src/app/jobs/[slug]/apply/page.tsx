import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase } from "lucide-react";
import { notFound } from "next/navigation";
import { getJobBySlug } from "@/lib/jobs";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { styleForCategory } from "@/lib/industries";
import { formatHourlyRange } from "@/lib/utils";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const style = styleForCategory(job.category);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[20rem_1fr]">
      {/* Job context (left) */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Link
          href={`/jobs/${job.slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to job
        </Link>
        <div className={`mt-4 rounded-xl border border-border bg-background p-5 ring-1 ${style.ring}`}>
          <p
            className={`inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${style.text}`}
          >
            {job.category}
          </p>
          <h2 className="mt-3 text-lg font-bold tracking-tight">{job.title}</h2>
          <p className="text-sm text-muted-foreground">{job.employer}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Location
              </dt>
              <dd className="text-right text-sm">
                {job.location_city}, {job.location_state}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="inline-flex items-center gap-1 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Type
              </dt>
              <dd className="text-right text-sm capitalize">
                {job.employment_type.replace(/_/g, " ")}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Pay</dt>
              <dd className="text-right">
                <span className="text-xl font-extrabold">
                  {formatHourlyRange(job.hourly_rate_min, job.hourly_rate_max)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {t(locale, "jobs.hourly")}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </aside>

      {/* Form (right) */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Step 1 of 1
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t(locale, "apply.title")}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Takes about 60 seconds. We never charge workers. Your info is shared only with the
          verified employer.
        </p>
        <div className="mt-8">
          <ApplyForm jobId={job.id} jobSlug={job.slug} />
        </div>
      </div>
    </div>
  );
}
