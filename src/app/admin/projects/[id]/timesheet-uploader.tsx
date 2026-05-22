"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileCheck2 } from "lucide-react";

export function TimesheetUploader({
  projectId,
  defaultEmployerName,
  kind = "timesheet",
  label,
}: {
  projectId: string;
  defaultEmployerName?: string;
  kind?: "timesheet" | "contract";
  label?: string;
}) {
  const buttonLabel = label ?? (kind === "contract" ? "Upload contract" : "Upload timesheet");
  const headline = kind === "contract" ? "Upload signed contract" : "Upload signed timesheet";
  const hint =
    kind === "contract"
      ? "Signed contract (DocuSign export, signed PDF, scan). Super-admin only."
      : "Proof-of-hours document from the hiring company. PDF, image, or spreadsheet.";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("project_id", projectId);
      fd.set("kind", kind);
      const res = await fetch("/api/admin/timesheets/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Upload failed (${res.status})`);
      }
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
      >
        <Upload className="h-3.5 w-3.5" /> {buttonLabel}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold">
              <FileCheck2 className="h-4 w-4" /> {headline}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {hint}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              File <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,.xlsx,.xls,.csv"
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted/70"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Period start</label>
              <input
                name="period_start"
                type="date"
                className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Period end</label>
              <input
                name="period_end"
                type="date"
                className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Source / sent by
              </label>
              <input
                name="source_company"
                type="text"
                defaultValue={defaultEmployerName ?? ""}
                placeholder="Hiring company name"
                className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Total hours claimed
              </label>
              <input
                name="total_hours_claimed"
                type="number"
                step="0.25"
                min="0"
                placeholder="e.g. 1600"
                className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Optional context (crew, site, anomalies…)"
              className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-400 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
