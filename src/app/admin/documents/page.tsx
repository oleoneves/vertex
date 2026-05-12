import Link from "next/link";
import { FileWarning } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { DOCUMENT_LABELS, signedDocumentUrl } from "@/lib/documents";
import type { WorkerDocument } from "@/types/db";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { FilterBar } from "../_components/filter-bar";
import { reviewDocument } from "../_actions";

export const dynamic = "force-dynamic";

type Row = WorkerDocument & {
  worker: { id: string; full_name: string; employee_code: string | null } | null;
  signedUrl?: string | null;
};

async function load(filters: { status?: string; type?: string }): Promise<Row[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("documents")
    .select(
      "*, worker:workers(id, full_name, employee_code)",
    )
    .order("uploaded_at", { ascending: false })
    .limit(200);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.type) q = q.eq("type", filters.type);
  const { data } = await q;
  const rows = (data as unknown as Row[]) ?? [];

  // Sign URLs in parallel
  const signed = await Promise.all(
    rows.map((r) => signedDocumentUrl(r.storage_path)),
  );
  return rows.map((r, i) => ({ ...r, signedUrl: signed[i] }));
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const docs = await load(sp);
  const pending = docs.filter((d) => d.status === "pending").length;
  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Worker uploaded compliance documents."
        count={docs.length}
      >
        {pending > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {pending} pending review
          </span>
        )}
      </PageHeader>

      <FilterBar
        filters={[
          {
            name: "status",
            label: "Status",
            value: sp.status,
            options: [
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "expired", label: "Expired" },
            ],
          },
          {
            name: "type",
            label: "Type",
            value: sp.type,
            options: Object.entries(DOCUMENT_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
      />

      {docs.length === 0 ? (
        <EmptyState
          icon={<FileWarning className="h-5 w-5" />}
          title="No documents match"
          body="Workers upload compliance docs from /worker/documents."
        />
      ) : (
        <ul className="space-y-3">
          {docs.map((d) => (
            <li
              key={d.id}
              className="rounded-xl border border-border bg-background p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/workers/${d.worker?.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {d.worker?.full_name ?? "—"}
                    </Link>
                    {d.worker?.employee_code && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {d.worker.employee_code}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {DOCUMENT_LABELS[d.type]}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {d.filename} · uploaded {new Date(d.uploaded_at).toLocaleDateString()}
                  </div>
                  {d.notes && (
                    <p className="mt-2 text-xs italic text-muted-foreground">
                      &ldquo;{d.notes}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {d.signedUrl && (
                    <a
                      href={d.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Open
                    </a>
                  )}
                  {d.status === "pending" ? (
                    <>
                      <form action={reviewDocument} className="inline">
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <button
                          type="submit"
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={reviewDocument} className="inline">
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <button
                          type="submit"
                          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                        >
                          Reject
                        </button>
                      </form>
                    </>
                  ) : (
                    <span
                      className={
                        d.status === "approved"
                          ? "rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : d.status === "rejected"
                          ? "rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          : "rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }
                    >
                      {d.status}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
