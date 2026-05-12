"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n-client";

export function ApplyForm({ jobId, jobSlug }: { jobId: string; jobSlug: string }) {
  const t = useT();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <form onSubmit={onSubmit} className="space-y-5">
      <Field name="full_name" label={t("apply.name")} required />
      <Field name="email" label={t("apply.email")} type="email" required />
      <Field name="phone" label={t("apply.phone")} type="tel" />

      <label className="block">
        <span className="text-sm font-medium">{t("apply.experience")}</span>
        <textarea
          name="experience_summary"
          rows={4}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t("apply.cv")}</span>
        <input
          name="cv"
          type="file"
          accept="application/pdf"
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm hover:file:bg-border"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "…" : t("apply.submit")}
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
