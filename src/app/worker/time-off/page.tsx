import { redirect } from "next/navigation";
import { CalendarOff, CheckCircle2, X, Clock } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requestTimeOff, cancelTimeOff } from "../actions";

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
};

export default async function TimeOffPage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/time-off");
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("time_off_requests")
    .select("*")
    .eq("worker_id", worker.id)
    .order("start_date", { ascending: false });
  const requests = (data as Row[]) ?? [];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <CalendarOff className="inline h-6 w-6 text-accent" /> Pedido de folga
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Avise a Vertex com antecedência se precisar tirar folga, férias ou ficar de licença.
        </p>
      </header>

      <form
        action={requestTimeOff}
        className="space-y-3 rounded-xl border border-border bg-background p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Data início</span>
            <input
              type="date"
              name="start_date"
              required
              min={today}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Data fim</span>
            <input
              type="date"
              name="end_date"
              required
              min={today}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium">Tipo</span>
          <select
            name="kind"
            defaultValue="unpaid"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="vacation">Férias</option>
            <option value="sick">Atestado / doença</option>
            <option value="personal">Pessoal</option>
            <option value="unpaid">Sem remuneração</option>
            <option value="other">Outro</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Motivo (opcional)</span>
          <textarea
            name="reason"
            rows={2}
            placeholder="Conte o motivo se quiser dar contexto"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-extrabold text-accent-foreground hover:opacity-90"
        >
          Enviar pedido
        </button>
      </form>

      {requests.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Seus pedidos
          </h2>
          <ul className="mt-3 divide-y divide-border/60">
            {requests.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {r.start_date} → {r.end_date}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.kind}{r.reason ? ` · ${r.reason}` : ""}
                    </p>
                    {r.admin_notes && (
                      <p className="mt-1 rounded-md border-l-2 border-accent bg-accent/5 px-2 py-1 text-xs">
                        Resposta admin: {r.admin_notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      r.status === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : r.status === "declined"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : r.status === "cancelled"
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}
                  >
                    {r.status === "approved" && <CheckCircle2 className="inline h-3 w-3" />}
                    {r.status === "declined" && <X className="inline h-3 w-3" />}
                    {r.status === "pending" && <Clock className="inline h-3 w-3" />}{" "}
                    {r.status}
                  </span>
                </div>
                {r.status === "pending" && (
                  <form action={cancelTimeOff} className="mt-2">
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-xs text-muted-foreground hover:text-red-500"
                    >
                      Cancelar este pedido
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
