import Link from "next/link";
import { Star, TrendingUp } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  target_kind: string;
  target_name: string | null;
  stars: number;
  comment: string | null;
  created_at: string;
  rater: { full_name: string } | null;
  target: { full_name: string; id: string } | null;
  project: { name: string } | null;
};

export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("worker_ratings_given")
    .select(
      "id, target_kind, target_name, stars, comment, created_at, rater:workers!worker_ratings_given_rater_worker_id_fkey(full_name), target:workers!worker_ratings_given_target_worker_id_fkey(full_name, id), project:projects(name)",
    )
    .order("created_at", { ascending: false });
  if (sp.kind) q = q.eq("target_kind", sp.kind);
  const { data } = await q;
  const rows = (data as unknown as Row[]) ?? [];

  // Aggregate by kind
  const byKind = new Map<string, { count: number; avg: number; sum: number }>();
  for (const r of rows) {
    const e = byKind.get(r.target_kind) ?? { count: 0, avg: 0, sum: 0 };
    e.count += 1;
    e.sum += r.stars;
    e.avg = e.sum / e.count;
    byKind.set(r.target_kind, e);
  }

  // Top rated peers (only target_kind=peer with worker linked)
  type PeerRow = { id: string; name: string; ratings: number; avg: number };
  const peerMap = new Map<string, PeerRow>();
  for (const r of rows) {
    if (r.target_kind !== "peer" || !r.target?.id) continue;
    const e = peerMap.get(r.target.id) ?? {
      id: r.target.id,
      name: r.target.full_name,
      ratings: 0,
      avg: 0,
    };
    e.ratings += 1;
    e.avg = ((e.avg * (e.ratings - 1)) + r.stars) / e.ratings;
    peerMap.set(r.target.id, e);
  }
  const topPeers = Array.from(peerMap.values())
    .sort((a, b) => b.avg - a.avg || b.ratings - a.ratings)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Worker ratings"
        subtitle="Avaliações dadas pelos workers — job, supervisor, projeto, colegas."
        count={rows.length}
      />

      <section className="grid gap-3 sm:grid-cols-4">
        {(["job", "supervisor", "peer", "project"] as const).map((k) => {
          const e = byKind.get(k);
          return (
            <div key={k} className="rounded-xl border border-border bg-background p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {k}
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums">
                {e ? e.avg.toFixed(1) : "—"} <span className="text-yellow-500">★</span>
              </p>
              <p className="text-xs text-muted-foreground">{e?.count ?? 0} avaliações</p>
            </div>
          );
        })}
      </section>

      {topPeers.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Top 10 colegas mais bem avaliados
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-2">Worker</th>
                <th className="pb-2 text-right">Avaliações</th>
                <th className="pb-2 text-right">Média</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {topPeers.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 font-medium">
                    <Link href={`/admin/workers/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums">{p.ratings}</td>
                  <td className="py-2 text-right font-mono font-bold tabular-nums text-yellow-600">
                    {p.avg.toFixed(2)} ★
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Star className="h-4 w-4" /> Todas as avaliações
          </h2>
          <div className="flex gap-1 text-xs">
            <Link href="/admin/ratings" className={!sp.kind ? "font-bold underline" : "text-muted-foreground"}>
              all
            </Link>
            {["job", "supervisor", "peer", "project"].map((k) => (
              <Link
                key={k}
                href={`/admin/ratings?kind=${k}`}
                className={sp.kind === k ? "ml-2 font-bold underline" : "ml-2 text-muted-foreground"}
              >
                {k}
              </Link>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma avaliação.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {rows.slice(0, 50).map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {r.target_kind}
                    {r.project?.name && ` · ${r.project.name}`}
                  </span>
                  <span className="font-mono text-yellow-600">
                    {"★".repeat(r.stars)}
                    {"☆".repeat(5 - r.stars)}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  <strong>{r.rater?.full_name ?? "Anônimo"}</strong> avaliou{" "}
                  <strong>{r.target?.full_name ?? r.target_name ?? "—"}</strong>
                </p>
                {r.comment && (
                  <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
