import { redirect } from "next/navigation";
import { CheckCircle2, FileWarning, Clock } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { complianceFor, listWorkerDocuments, DOCUMENT_TYPES } from "@/lib/documents";
import { UploadDocumentForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function WorkerDocumentsPage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/documents");

  const docs = await listWorkerDocuments(worker.id);
  const compliance = complianceFor(docs);
  const required = compliance.filter((c) => c.required);
  const missing = required.filter((c) => !c.uploaded);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your compliance documents. Vertex reviews them within 1 business day.
        </p>
      </header>

      {/* Required progress */}
      <section
        className={`rounded-xl border p-5 ${
          missing.length === 0
            ? "border-green-500/40 bg-green-500/5"
            : "border-amber-500/40 bg-amber-500/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {missing.length === 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" /> All required documents uploaded
              </>
            ) : (
              <>
                <FileWarning className="h-4 w-4 text-amber-600" /> {missing.length} required document
                {missing.length === 1 ? "" : "s"} missing
              </>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {required.length - missing.length} / {required.length}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background/60">
          <div
            className={`h-full transition-all ${
              missing.length === 0 ? "bg-green-500" : "bg-amber-500"
            }`}
            style={{
              width: `${((required.length - missing.length) / required.length) * 100}%`,
            }}
          />
        </div>
      </section>

      {/* Upload form */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Upload a document
        </h2>
        <div className="mt-4">
          <UploadDocumentForm types={DOCUMENT_TYPES} />
        </div>
      </section>

      {/* Required list */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Required
        </h2>
        <ul className="mt-3 space-y-2">
          {required.map((c) => (
            <DocRow key={c.type} status={c} />
          ))}
        </ul>
      </section>

      {/* Optional */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Optional / role-specific
        </h2>
        <ul className="mt-3 space-y-2">
          {compliance
            .filter((c) => !c.required)
            .map((c) => (
              <DocRow key={c.type} status={c} />
            ))}
        </ul>
      </section>
    </div>
  );
}

function DocRow({
  status: c,
}: {
  status: ReturnType<typeof complianceFor>[number];
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{c.label}</div>
        {c.doc && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            <Clock className="mr-1 inline h-3 w-3" />
            {new Date(c.doc.uploaded_at).toLocaleDateString()} ·{" "}
            <span className="truncate">{c.doc.filename}</span>
          </div>
        )}
      </div>
      <div>
        {!c.uploaded ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Not uploaded
          </span>
        ) : c.doc?.status === "approved" ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Approved
          </span>
        ) : c.doc?.status === "rejected" ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-800 dark:bg-red-900/40 dark:text-red-300">
            Rejected
          </span>
        ) : c.doc?.status === "expired" ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Expired
          </span>
        ) : (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Pending
          </span>
        )}
      </div>
    </li>
  );
}
