import { notFound } from "next/navigation";
import { getJobBySlug } from "@/lib/jobs";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
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

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <p className="text-sm text-muted-foreground">{job.employer}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {t(locale, "apply.title")}: {job.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {job.location_city}, {job.location_state}
      </p>
      <div className="mt-8">
        <ApplyForm jobId={job.id} jobSlug={job.slug} />
      </div>
    </div>
  );
}
