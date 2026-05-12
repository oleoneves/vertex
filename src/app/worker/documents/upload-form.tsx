"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DocumentType } from "@/types/db";

export function UploadDocumentForm({
  types,
}: {
  types: { value: DocumentType; label: string }[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }
      setMessage("Uploaded ✓");
      setFileName(null);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Document type</span>
        <select
          name="type"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Choose a document…</option>
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">File</span>
        <div className="mt-1 flex items-center gap-3 rounded-md border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-sm transition hover:border-accent/60 hover:bg-accent/5">
          <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            name="file"
            type="file"
            required
            accept="application/pdf,image/png,image/jpeg,image/heic,image/heif"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            className="flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-border"
          />
        </div>
        {fileName && <p className="mt-1 text-xs text-muted-foreground">Selected: {fileName}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          PDF or photo · max 12 MB. Make sure all corners are visible and text is readable.
        </p>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Note (optional)</span>
        <input
          name="notes"
          maxLength={500}
          placeholder="e.g. expires 12/2026"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50 sm:w-auto sm:h-10"
      >
        {submitting ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
