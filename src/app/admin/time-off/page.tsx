import { CalendarOff } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";
import { updateTimeOff } from "../_actions";
import { FilterBar } from "../_components/filter-bar";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  start_date: string;
  end_date: string;
  kind: string;
  status: string;
  reason: string | null;
  admin_notes: string | null;
  created_at: string;
  worker: { id: string; full_name: string } | null;
};

export default async function AdminTimeOffPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("time_off_requests")
    .select("*, worker:workers(id, full_name)")
    .order("created_at", { ascending: false });
  if (sp.status) q = q.eq("status", sp.status);
  const { data } = await q;
  const rows = (data as unknown as Row[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Time off requests"
        subtitle="Pedidos de folga, férias e licença dos colaboradores."
        count={rows.length}
      />

      <FilterBar
        filters={[
          {
            name: "status",
            label: "Status",
            value: sp.status,
            options: [
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "declined", label: "Declined" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
        ]}
      />

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
          <CalendarOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
          Nenhum pedido com esse filtro.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-bold">
                    {r.worker?.full_name ?? "—"}
                    <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                      {r.start_date} → {r.end_date}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.kind} · pedido em {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.reason && <p className="mt-1 text-sm">{r.reason}</p>}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.status === "approved"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : r.status === "declined"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : r.status === "cancelled"
                      ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              {r.status === "pending" && (
                <form action={updateTimeOff} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    name="admin_notes"
                    defaultValue={r.admin_notes ?? ""}
                    placeholder="Resposta ao worker"
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    name="action"
                    value="approve"
                    className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-green-700"
                  >
                    ✓ Aprovar
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="decline"
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-bold hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30"
                  >
                    ✗ Recusar
                  </button>
                </form>
              )}
              {r.admin_notes && r.status !== "pending" && (
                <p className="mt-2 rounded-md border-l-2 border-accent bg-accent/5 px-3 py-2 text-xs">
                  <strong>Sua resposta:</strong> {r.admin_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
