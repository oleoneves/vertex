import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type IncidentRow = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  photo_paths: string[] | null;
  file_paths: string[] | null;
  created_at: string;
  admin_notes: string | null;
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/report");
  const sp = await searchParams;

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("incident_reports")
    .select("id, title, description, severity, status, photo_paths, file_paths, created_at, admin_notes")
    .eq("worker_id", worker.id)
    .order("created_at", { ascending: false });
  const mine = (data as IncidentRow[]) ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <AlertTriangle className="inline h-6 w-6 text-red-500" /> Reportar incidente
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acidente, conflito, atraso de pagamento, problema de segurança — registre aqui. A Vertex responde no painel admin.
        </p>
      </header>

      {sp.ok === "1" && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4" /> Reporte enviado com sucesso.
        </div>
      )}

      <form
        action="/api/worker/incident"
        method="post"
        encType="multipart/form-data"
        className="space-y-3 rounded-xl border border-border bg-background p-5"
      >
        <label className="block text-sm">
          <span className="font-medium">Título</span>
          <input
            name="title"
            required
            placeholder="O que aconteceu?"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Severidade</span>
          <select
            name="severity"
            defaultValue="low"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica (emergência)</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Descrição detalhada</span>
          <textarea
            name="description"
            required
            rows={5}
            placeholder="Conte o que aconteceu, onde, quando, quem estava envolvido..."
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Fotos (opcional, até 12MB cada)</span>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            capture="environment"
            className="mt-1 block w-full text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Outros arquivos (PDF, vídeo, opcional)</span>
          <input
            type="file"
            name="files"
            multiple
            className="mt-1 block w-full text-sm"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-base font-extrabold text-white hover:bg-red-700"
        >
          Enviar reporte
        </button>
      </form>

      {mine.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Seus reportes
          </h2>
          <ul className="mt-3 divide-y divide-border/60">
            {mine.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-medium">{r.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      r.status === "resolved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : r.status === "reviewing"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : r.status === "dismissed"
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                  <span>Severidade: {r.severity}</span>
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                  {(r.photo_paths?.length ?? 0) > 0 && (
                    <span>{r.photo_paths!.length} foto(s)</span>
                  )}
                </div>
                {r.admin_notes && (
                  <p className="mt-2 rounded-md border-l-2 border-accent bg-accent/5 px-3 py-2 text-xs">
                    <strong>Resposta admin:</strong> {r.admin_notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
