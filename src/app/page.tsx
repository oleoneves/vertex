import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { listJobs } from "@/lib/jobs";
import { INDUSTRIES } from "@/lib/industries";
import { JobCard } from "@/components/job-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const allJobs = await listJobs();
  const featured = allJobs.filter((j) => j.featured).slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-black text-white logo-on-dark">
        <Image
          src="/photos/hero-worker.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-32">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent sm:mb-4 sm:text-xs">
            {t(locale, "hero.eyebrow")}
          </p>
          <h1 className="max-w-3xl text-3xl font-black leading-[1.1] tracking-tight sm:text-6xl sm:leading-[1.05]">
            {t(locale, "hero.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 sm:mt-6 sm:text-xl">
            {t(locale, "hero.subtitle")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <Link
              href="/jobs"
              className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-7 text-base font-bold text-black hover:opacity-90"
            >
              {t(locale, "hero.cta.jobs")} →
            </Link>
            <Link
              href="/jobs"
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/30 bg-white/5 px-7 text-base font-medium text-white backdrop-blur hover:bg-white/10"
            >
              {t(locale, "hero.cta.apply")}
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-4 py-10 text-center sm:grid-cols-4 sm:px-6">
          <Stat value="12,400+" label={t(locale, "stats.workers")} />
          <Stat value="380+" label={t(locale, "stats.employers")} />
          <Stat value="32" label={t(locale, "stats.states")} />
          <Stat value="94%" label={t(locale, "stats.fill")} />
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t(locale, "industries.title")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((ind) => (
              <Link
                key={ind.slug}
                href={{ pathname: "/jobs", query: { category: ind.jobCategory } }}
                className="group relative isolate aspect-[5/3] overflow-hidden rounded-xl bg-muted"
              >
                <Image
                  src={ind.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <h3 className="text-lg font-bold text-white">
                    {t(locale, ind.i18nKey)}
                  </h3>
                  <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-black opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t(locale, "how.title")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Step n={1} title={t(locale, "how.step1.title")} body={t(locale, "how.step1.body")} />
            <Step n={2} title={t(locale, "how.step2.title")} body={t(locale, "how.step2.body")} />
            <Step n={3} title={t(locale, "how.step3.title")} body={t(locale, "how.step3.body")} />
          </div>
        </div>
      </section>

      {/* FEATURED JOBS */}
      {featured.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t(locale, "jobs.featured")}
              </h2>
              <Link
                href="/jobs"
                className="text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                {t(locale, "jobs.see_all")} →
              </Link>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((j) => (
                <li key={j.id} className="flex">
                  <JobCard job={j} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section className="bg-accent text-black">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-20">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t(locale, "cta.bottom.title")}
            </h2>
            <p className="mt-2 max-w-xl text-black/80">{t(locale, "cta.bottom.body")}</p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex h-12 items-center rounded-md bg-black px-7 text-base font-bold text-accent hover:bg-black/85"
          >
            {t(locale, "hero.cta.jobs")} →
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="relative rounded-lg border border-border bg-background p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-extrabold text-black">
        {n}
      </div>
      <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
