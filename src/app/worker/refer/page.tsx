import { redirect } from "next/navigation";
import { Gift, Phone, Mail } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { addReferral } from "../actions";

export const dynamic = "force-dynamic";

type ReferralRow = {
  id: string;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string | null;
  status: string;
  reward_amount: number | null;
  created_at: string;
};

export default async function ReferPage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/refer");
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("worker_referrals")
    .select("*")
    .eq("referrer_worker_id", worker.id)
    .order("created_at", { ascending: false });
  const referrals = (data as ReferralRow[]) ?? [];
  const totalReward = referrals.reduce((s, r) => s + (Number(r.reward_amount) || 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <Gift className="inline h-6 w-6 text-accent" /> Indicar amigo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trabalhe com gente boa que você conhece. A Vertex pode te recompensar quando indicado for contratado.
        </p>
      </header>

      <section className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Total recebido</p>
        <p className="mt-1 font-mono text-3xl font-extrabold tabular-nums">
          ${totalReward.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {referrals.filter((r) => r.status === "hired").length} indicado(s) contratado(s) ·{" "}
          {referrals.length} no total
        </p>
      </section>

      <form
        action={addReferral}
        className="space-y-3 rounded-xl border border-border bg-background p-5"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Indicar uma pessoa
        </h2>
        <input
          name="referred_name"
          required
          placeholder="Nome completo do indicado"
          className="block w-full rounded-md border border-border bg-background px-3 py-2"
        />
        <input
          name="referred_phone"
          type="tel"
          placeholder="Telefone (opcional)"
          className="block w-full rounded-md border border-border bg-background px-3 py-2"
        />
        <input
          name="referred_email"
          type="email"
          placeholder="Email (opcional)"
          className="block w-full rounded-md border border-border bg-background px-3 py-2"
        />
        <textarea
          name="notes"
          rows={2}
          placeholder="O que essa pessoa faz? (opcional)"
          className="block w-full rounded-md border border-border bg-background px-3 py-2"
        />
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-extrabold text-accent-foreground hover:opacity-90"
        >
          Indicar
        </button>
      </form>

      {referrals.length > 0 && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Suas indicações
          </h2>
          <ul className="mt-3 divide-y divide-border/60">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.referred_name}</p>
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    {r.referred_phone && (
                      <span><Phone className="inline h-3 w-3" /> {r.referred_phone}</span>
                    )}
                    {r.referred_email && (
                      <span><Mail className="inline h-3 w-3" /> {r.referred_email}</span>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.status === "hired"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : r.status === "contacted"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : r.status === "declined" || r.status === "duplicate"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
