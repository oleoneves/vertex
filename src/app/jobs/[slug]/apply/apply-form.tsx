"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n-client";

export function ApplyForm({ jobId, jobSlug }: { jobId: string; jobSlug: string }) {
  const t = useT();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("job_id", jobId);
    try {
      const res = await fetch("/api/apply", { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed");
      }
      router.push(`/jobs/${jobSlug}/applied`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("apply.error"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="rounded-xl border border-border bg-background p-5">
        <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Contact
        </legend>
        <div className="space-y-4">
          <Field name="full_name" label={t("apply.name")} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="email" label={t("apply.email")} type="email" required />
            <Field name="phone" label={t("apply.phone")} type="tel" />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-border bg-background p-5">
        <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Experience
        </legend>
        <label className="block">
          <span className="text-sm font-medium">{t("apply.experience")}</span>
          <textarea
            name="experience_summary"
            rows={4}
            placeholder="3 years cleaning hotel rooms, 1 year janitor at a school…"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">{t("apply.cv")}</span>
          <div className="mt-1 flex items-center gap-3 rounded-md border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-sm transition hover:border-accent/60 hover:bg-accent/5">
            <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              name="cv"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              className="flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-border"
            />
          </div>
          {fileName && (
            <p className="mt-1 text-xs text-muted-foreground">Selected: {fileName}</p>
          )}
        </label>
      </fieldset>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-6 text-base font-extrabold text-accent-foreground hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Submitting…" : t("apply.submit")}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </label>
  );
}
