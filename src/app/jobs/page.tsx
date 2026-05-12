import { Search } from "lucide-react";
import { listJobs, listCategories, listStates } from "@/lib/jobs";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { JobCard } from "@/components/job-card";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const jobs = await listJobs(sp);
  const allJobs = await listJobs();
  const states = listStates(allJobs);
  const categories = listCategories(allJobs);
  const activeFilters = [sp.q, sp.state, sp.category].filter(Boolean).length;

  return (
    <div>
      {/* Filter bar */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t(locale, "jobs.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
            </p>
          </div>

          <form
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
            method="GET"
          >
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder={t(locale, "jobs.search.placeholder")}
                className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <select
              name="state"
              defaultValue={sp.state ?? ""}
              aria-label={t(locale, "jobs.filter.state")}
              className="h-11 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">{t(locale, "jobs.filter.state")}: {t(locale, "jobs.filter.all")}</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="category"
              defaultValue={sp.category ?? ""}
              aria-label={t(locale, "jobs.filter.category")}
              className="h-11 rounded-md border border-border bg-background px-3 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">{t(locale, "jobs.filter.category")}: {t(locale, "jobs.filter.all")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-bold text-background hover:opacity-90"
            >
              Search
            </button>
          </form>

          {activeFilters > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              <a
                href="/jobs"
                className="rounded-full bg-background px-3 py-1 hover:bg-muted"
              >
                ✕ Clear filters
              </a>
            </p>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {jobs.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-muted-foreground">{t(locale, "jobs.empty")}</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <li key={j.id} className="flex">
                <JobCard job={j} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
