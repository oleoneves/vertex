import { Gift, Award } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";
import { updateReferralStatus } from "../_actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string | null;
  status: string;
  reward_amount: number | null;
  created_at: string;
  referrer_worker_id: string;
  referrer: { full_name: string } | null;
};

export default async function ReferralsPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("worker_referrals")
    .select(
      "id, referred_name, referred_email, referred_phone, status, reward_amount, created_at, referrer_worker_id, referrer:workers!worker_referrals_referrer_worker_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });
  const rows = (data as unknown as Row[]) ?? [];

  // Leaderboard: count by referrer
  type LeaderRow = { worker_id: string; name: string; total: number; hired: number; reward: number };
  const lb = new Map<string, LeaderRow>();
  for (const r of rows) {
    const e = lb.get(r.referrer_worker_id) ?? {
      worker_id: r.referrer_worker_id,
      name: r.referrer?.full_name ?? "—",
      total: 0,
      hired: 0,
      reward: 0,
    };
    e.total += 1;
    if (r.status === "hired") e.hired += 1;
    e.reward += Number(r.reward_amount) || 0;
    lb.set(r.referrer_worker_id, e);
  }
  const leaderboard = Array.from(lb.values())
    .sort((a, b) => b.hired - a.hired || b.total - a.total)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Worker referrals"
        subtitle="Indicações enviadas pelos próprios workers."
        count={rows.length}
      />

      {leaderboard.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Award className="h-4 w-4" /> Top 10 referrers
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-2">#</th>
                <th className="pb-2">Worker</th>
                <th className="pb-2 text-right">Indicados</th>
                <th className="pb-2 text-right">Contratados</th>
                <th className="pb-2 text-right">Recompensa total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {leaderboard.map((l, i) => (
                <tr key={l.worker_id}>
                  <td className="py-2 font-mono text-xs text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 font-medium">{l.name}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{l.total}</td>
                  <td className="py-2 text-right font-mono font-bold tabular-nums text-green-600">
                    {l.hired}
                  </td>
                  <td className="py-2 text-right font-mono font-bold tabular-nums text-accent">
                    ${l.reward.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Gift className="h-4 w-4" /> Todas as indicações
        </h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma indicação ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.referred_name}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {r.referred_email && <span>{r.referred_email}</span>}
                    {r.referred_phone && <span>{r.referred_phone}</span>}
                    <span>· por {r.referrer?.full_name}</span>
                    <span>· {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <form action={updateReferralStatus} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={r.id} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="pending">pending</option>
                    <option value="contacted">contacted</option>
                    <option value="hired">hired</option>
                    <option value="declined">declined</option>
                    <option value="duplicate">duplicate</option>
                  </select>
                  <input
                    name="reward_amount"
                    type="number"
                    step="0.01"
                    defaultValue={r.reward_amount ?? ""}
                    placeholder="$"
                    className="w-20 rounded-md border border-border bg-background px-2 py-1 text-right font-mono text-xs tabular-nums"
                  />
                  <button
                    type="submit"
                    className="rounded bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground hover:opacity-90"
                  >
                    Save
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
