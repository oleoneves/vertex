import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { addRating } from "../actions";

export const dynamic = "force-dynamic";

type RatingRow = {
  id: string;
  target_kind: string;
  target_name: string | null;
  stars: number;
  comment: string | null;
  created_at: string;
};

export default async function RatePage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/rate");
  const supabase = await getSupabaseServer();

  const [projectsRes, peersRes, mineRes] = await Promise.all([
    supabase
      .from("placements")
      .select("project:projects(id, name)")
      .eq("worker_id", worker.id)
      .not("project_id", "is", null)
      .limit(20),
    supabase
      .from("placements")
      .select("worker:workers(id, full_name)")
      .neq("worker_id", worker.id)
      .eq("status", "active")
      .limit(100),
    supabase
      .from("worker_ratings_given")
      .select("id, target_kind, target_name, stars, comment, created_at")
      .eq("rater_worker_id", worker.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  type ProjRel = { project: { id: string; name: string } | null };
  type PeerRel = { worker: { id: string; full_name: string } | null };
  const projects = Array.from(
    new Map(
      ((projectsRes.data as unknown as ProjRel[]) ?? [])
        .map((r) => r.project)
        .filter((p): p is { id: string; name: string } => p !== null)
        .map((p) => [p.id, p]),
    ).values(),
  );
  const peers = Array.from(
    new Map(
      ((peersRes.data as unknown as PeerRel[]) ?? [])
        .map((r) => r.worker)
        .filter((w): w is { id: string; full_name: string } => w !== null)
        .map((w) => [w.id, w]),
    ).values(),
  );
  const mine = (mineRes.data as RatingRow[]) ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <Star className="inline h-6 w-6 text-yellow-500" /> Avaliar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Avalie o trabalho, o supervisor ou outros colaboradores. Suas avaliações ajudam a Vertex a melhorar.
        </p>
      </header>

      <form
        action={addRating}
        className="space-y-3 rounded-xl border border-border bg-background p-5"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Nova avaliação
        </h2>

        <label className="block text-sm">
          <span className="font-medium">O que você quer avaliar?</span>
          <select
            name="target_kind"
            required
            defaultValue="job"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="job">Trabalho/Serviço</option>
            <option value="project">Projeto</option>
            <option value="supervisor">Supervisor</option>
            <option value="peer">Outro labor</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Projeto (opcional)</span>
          <select
            name="project_id"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="">— selecione —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">
            Nome do supervisor / labor (se aplicável)
          </span>
          <input
            name="target_name"
            placeholder="ex: João Silva"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>

        {peers.length > 0 && (
          <label className="block text-sm">
            <span className="font-medium">Ou escolha um colega</span>
            <select
              name="target_worker_id"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            >
              <option value="">— nenhum —</option>
              {peers.slice(0, 50).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <fieldset className="block">
          <legend className="text-sm font-medium">Estrelas</legend>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-border bg-background hover:bg-yellow-50 has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-100"
              >
                <input type="radio" name="stars" value={n} className="sr-only" defaultChecked={n === 5} />
                <span className="font-bold">{n}★</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="font-medium">Comentário (opcional)</span>
          <textarea
            name="comment"
            rows={3}
            placeholder="O que você gostou ou não gostou?"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-extrabold text-accent-foreground hover:opacity-90"
        >
          Enviar avaliação
        </button>
      </form>

      {mine.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Suas avaliações
          </h2>
          <ul className="mt-3 divide-y divide-border/60">
            {mine.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {r.target_kind}
                  </span>
                  <span className="font-mono text-yellow-600">
                    {"★".repeat(r.stars)}
                    {"☆".repeat(5 - r.stars)}
                  </span>
                </div>
                {r.target_name && (
                  <p className="mt-1 text-sm font-medium">{r.target_name}</p>
                )}
                {r.comment && (
                  <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
