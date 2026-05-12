import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobBySlug } from "@/lib/jobs";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatHourlyRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/jobs"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← {t(locale, "jobs.title")}
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{job.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {job.employer} · {job.location_city}, {job.location_state}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-2.5 py-1">{job.category}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">
            {job.employment_type.replace(/_/g, " ")}
          </span>
          {(job.hourly_rate_min != null || job.hourly_rate_max != null) && (
            <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium text-accent">
              {formatHourlyRange(job.hourly_rate_min, job.hourly_rate_max)}
              {t(locale, "jobs.hourly")}
            </span>
          )}
        </div>
      </header>

      <section className="prose prose-slate mt-8 max-w-none">
        <p className="whitespace-pre-line text-base leading-7">{job.description}</p>

        {job.requirements && (
          <>
            <h2 className="mt-8 text-lg font-semibold">{t(locale, "jobs.requirements")}</h2>
            <p className="whitespace-pre-line text-base leading-7 text-muted-foreground">
              {job.requirements}
            </p>
          </>
        )}

        {job.benefits && (
          <>
            <h2 className="mt-8 text-lg font-semibold">Benefits</h2>
            <p className="whitespace-pre-line text-base leading-7 text-muted-foreground">
              {job.benefits}
            </p>
          </>
        )}
      </section>

      <div className="mt-10">
        <Link
          href={`/jobs/${job.slug}/apply`}
          className="inline-flex h-12 items-center rounded-md bg-accent px-6 text-base font-medium text-accent-foreground hover:opacity-90"
        >
          {t(locale, "jobs.apply")} →
        </Link>
      </div>
    </article>
  );
}
