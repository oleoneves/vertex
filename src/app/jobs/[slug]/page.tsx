import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Briefcase, Star, CheckCircle2 } from "lucide-react";
import { getJobBySlug, listJobs } from "@/lib/jobs";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { styleForCategory } from "@/lib/industries";
import { formatHourlyRange } from "@/lib/utils";
import { JobCard } from "@/components/job-card";

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

  const style = styleForCategory(job.category);
  const all = await listJobs();
  const related = all
    .filter((j) => j.id !== job.id && j.category === job.category)
    .slice(0, 3);

  return (
    <article>
      {/* HERO */}
      <section className={`relative isolate overflow-hidden border-b border-border ${style.tint}`}>
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t(locale, "jobs.title")}
          </Link>
          <p
            className={`mt-5 inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${style.ring} ${style.text}`}
          >
            {job.category}
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {job.title}
          </h1>
          <p className="mt-3 text-lg text-foreground/80">{job.employer}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location_city}, {job.location_state}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {job.employment_type.replace(/_/g, " ")}
            </span>
            {job.featured && (
              <span className="inline-flex items-center gap-1 text-accent">
                <Star className="h-4 w-4 fill-accent" /> Featured
              </span>
            )}
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <Block title="Description">
            <p className="whitespace-pre-line text-base leading-7 text-foreground/85">
              {job.description}
            </p>
          </Block>

          {job.requirements && (
            <Block title={t(locale, "jobs.requirements")}>
              <ul className="space-y-2">
                {splitLines(job.requirements).map((line, i) => (
                  <li key={i} className="flex gap-2 text-base leading-7 text-foreground/85">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {job.benefits && (
            <Block title="Benefits">
              <ul className="space-y-2">
                {splitLines(job.benefits).map((line, i) => (
                  <li key={i} className="flex gap-2 text-base leading-7 text-foreground/85">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>

        {/* Sticky apply card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pay</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight">
                {formatHourlyRange(job.hourly_rate_min, job.hourly_rate_max)}
              </span>
              <span className="text-sm text-muted-foreground">{t(locale, "jobs.hourly")}</span>
            </p>

            <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <Fact label="Type" value={job.employment_type.replace(/_/g, " ")} />
              <Fact label="Location" value={`${job.location_city}, ${job.location_state}`} />
              <Fact label="Employer" value={job.employer} />
            </dl>

            <Link
              href={`/jobs/${job.slug}/apply`}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-6 text-base font-extrabold text-accent-foreground hover:opacity-90"
            >
              {t(locale, "jobs.apply")} →
            </Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              60-second form · no fees · we never charge workers
            </p>
          </div>
        </aside>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
            <h2 className="text-lg font-bold tracking-tight">Similar jobs</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((j) => (
                <li key={j.id} className="flex">
                  <JobCard job={j} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n|•|·/)
    .map((s) => s.trim())
    .filter(Boolean);
}
