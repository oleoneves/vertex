import Link from "next/link";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { brand } from "@/lib/brand";

export default async function Home() {
  const locale = await getLocale();
  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-accent">
            {brand.name}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            {t(locale, "hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t(locale, "hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="inline-flex h-12 items-center rounded-md bg-accent px-6 text-base font-medium text-accent-foreground hover:opacity-90"
            >
              {t(locale, "hero.cta.jobs")}
            </Link>
            <Link
              href="/jobs"
              className="inline-flex h-12 items-center rounded-md border border-border bg-background px-6 text-base font-medium hover:bg-muted"
            >
              {t(locale, "hero.cta.apply")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6">
          <ValueCard
            title={t(locale, "value.verified.title")}
            body={t(locale, "value.verified.body")}
          />
          <ValueCard
            title={t(locale, "value.lang.title")}
            body={t(locale, "value.lang.body")}
          />
          <ValueCard
            title={t(locale, "value.fast.title")}
            body={t(locale, "value.fast.body")}
          />
        </div>
      </section>
    </>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
