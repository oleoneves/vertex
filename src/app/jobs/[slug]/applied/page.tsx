import Link from "next/link";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function AppliedPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent text-2xl">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        {t(locale, "apply.success")}
      </h1>
      <p className="mt-6">
        <Link
          href="/jobs"
          className="inline-flex h-11 items-center rounded-md border border-border bg-background px-5 text-sm font-medium hover:bg-muted"
        >
          ← {t(locale, "jobs.title")}
        </Link>
      </p>
    </div>
  );
}
