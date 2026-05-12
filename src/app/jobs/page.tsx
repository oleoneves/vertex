import Link from "next/link";
import { listJobs, listCategories, listStates } from "@/lib/jobs";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatHourlyRange } from "@/lib/utils";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t(locale, "jobs.title")}</h1>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder={t(locale, "jobs.search.placeholder")}
          className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <label className="flex flex-col text-xs text-muted-foreground">
          {t(locale, "jobs.filter.state")}
          <select
            name="state"
            defaultValue={sp.state ?? ""}
            className="mt-1 h-10 rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="">{t(locale, "jobs.filter.all")}</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs text-muted-foreground">
          {t(locale, "jobs.filter.category")}
          <select
            name="category"
            defaultValue={sp.category ?? ""}
            className="mt-1 h-10 rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="">{t(locale, "jobs.filter.all")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          ↵
        </button>
      </form>

      {jobs.length === 0 ? (
        <p className="mt-12 text-muted-foreground">{t(locale, "jobs.empty")}</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link
                href={{ pathname: `/jobs/${j.slug}` }}
                className="block rounded-lg border border-border bg-background p-5 transition hover:border-accent hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">{j.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {j.employer} · {j.location_city}, {j.location_state}
                    </p>
                  </div>
                  {j.featured && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      ★
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                    {j.category}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                    {j.employment_type.replace(/_/g, " ")}
                  </span>
                  {(j.hourly_rate_min != null || j.hourly_rate_max != null) && (
                    <span className="rounded-full bg-muted px-2 py-1 font-medium text-foreground">
                      {formatHourlyRange(j.hourly_rate_min, j.hourly_rate_max)}
                      {t(locale, "jobs.hourly")}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
