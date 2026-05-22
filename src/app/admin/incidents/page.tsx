import { AlertTriangle } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "../_components/page-header";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";
import { updateIncident } from "../_actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  photo_paths: string[] | null;
  file_paths: string[] | null;
  admin_notes: string | null;
  created_at: string;
  worker: { id: string; full_name: string } | null;
  project: { name: string } | null;
};

async function signed(path: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = getSupabaseAdmin();
  const { data } = await admin.storage.from("incidents").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("incident_reports")
    .select(
      "id, title, description, severity, status, photo_paths, file_paths, admin_notes, created_at, worker:workers(id, full_name), project:projects(name)",
    )
    .order("created_at", { ascending: false });
  if (sp.status) q = q.eq("status", sp.status);
  const { data } = await q;
  const rows = (data as unknown as Row[]) ?? [];

  // Pre-sign first photo for each row (preview)
  const rowsWithPreview = await Promise.all(
    rows.map(async (r) => {
      const previewUrl = r.photo_paths && r.photo_paths.length > 0 ? await signed(r.photo_paths[0]) : null;
      return { ...r, previewUrl };
    }),
  );

  return (
    <div>
      <PageHeader
        title="Incident reports"
        subtitle="Reportes enviados pelos workers — acidentes, conflitos, problemas."
        count={rows.length}
      />

      <FilterBar
        filters={[
          {
            name: "status",
            label: "Status",
            value: sp.status,
            options: [
              { value: "open", label: "Open" },
              { value: "reviewing", label: "Reviewing" },
              { value: "resolved", label: "Resolved" },
              { value: "dismissed", label: "Dismissed" },
            ],
          },
        ]}
      />

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum reporte com este filtro.
        </p>
      ) : (
        <div className="space-y-3">
          {rowsWithPreview.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="truncate font-bold">{r.title}</h3>
                    <StatusPill
                      status={r.severity}
                      variant={
                        r.severity === "critical"
                          ? "red"
                          : r.severity === "high"
                          ? "red"
                          : r.severity === "medium"
                          ? "amber"
                          : "muted"
                      }
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.worker?.full_name ?? "—"} ·{" "}
                    {new Date(r.created_at).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {r.project?.name && ` · ${r.project.name}`}
                  </p>
                </div>
                <StatusPill
                  status={r.status}
                  variant={
                    r.status === "resolved"
                      ? "green"
                      : r.status === "reviewing"
                      ? "blue"
                      : r.status === "dismissed"
                      ? "muted"
                      : "amber"
                  }
                />
              </div>

              <p className="mt-2 whitespace-pre-line text-sm">{r.description}</p>

              {r.previewUrl && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={r.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-20 w-20 overflow-hidden rounded-md border border-border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.previewUrl} alt="Foto" className="h-full w-full object-cover" />
                  </a>
                  {r.photo_paths && r.photo_paths.length > 1 && (
                    <span className="self-center text-xs text-muted-foreground">
                      +{r.photo_paths.length - 1} foto(s)
                    </span>
                  )}
                </div>
              )}

              <form action={updateIncident} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <input type="hidden" name="id" value={r.id} />
                <input
                  name="admin_notes"
                  defaultValue={r.admin_notes ?? ""}
                  placeholder="Resposta ou nota do admin"
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                />
                <select
                  name="status"
                  defaultValue={r.status}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <button
                  type="submit"
                  className="rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground hover:opacity-90"
                >
                  Salvar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
