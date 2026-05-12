import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function AppliedPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6 sm:py-28">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent">
        <CheckCircle2 className="h-10 w-10" strokeWidth={2.2} />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t(locale, "apply.success")}
      </h1>
      <p className="mt-3 text-muted-foreground">
        We&apos;ll review your application and reach out by phone or email if there&apos;s a match.
        Usually within 1–3 business days.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/jobs"
          className="inline-flex h-11 items-center rounded-md bg-foreground px-5 text-sm font-bold text-background hover:opacity-90"
        >
          {t(locale, "jobs.title")} →
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md border border-border bg-background px-5 text-sm font-medium hover:bg-muted"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
