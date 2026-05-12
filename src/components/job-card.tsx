import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { Job } from "@/types/db";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { styleForCategory } from "@/lib/industries";
import { formatHourlyRange } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function JobCard({ job, locale }: { job: Job; locale: Locale }) {
  const style = styleForCategory(job.category);
  return (
    <Link
      href={{ pathname: `/jobs/${job.slug}` }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background transition hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
    >
      <span className={`h-1 w-full ${style.bar}`} aria-hidden />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-bold ${style.tint} ${style.text}`}
            aria-hidden
          >
            {initials(job.employer)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-bold tracking-tight">{job.title}</h3>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.employer}</p>
          </div>
          {job.featured && (
            <Star className="h-4 w-4 shrink-0 fill-accent text-accent" aria-label="featured" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold uppercase tracking-wider ${style.tint} ${style.text}`}>
            {job.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {job.location_city}, {job.location_state}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
            {job.employment_type.replace(/_/g, " ")}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tracking-tight">
                {formatHourlyRange(job.hourly_rate_min, job.hourly_rate_max)}
              </span>
              <span className="text-xs text-muted-foreground">{t(locale, "jobs.hourly")}</span>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/60 transition group-hover:text-accent">
            {t(locale, "jobs.apply")} →
          </span>
        </div>
      </div>
    </Link>
  );
}
