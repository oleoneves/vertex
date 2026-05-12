import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const counts = await getCounts();
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Open jobs" value={counts.jobs} />
        <Kpi label="Applications (24h)" value={counts.last24h} />
        <Kpi label="Pending review" value={counts.pending} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

async function getCounts() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { jobs: 0, last24h: 0, pending: 0 };
  }
  const supabase = await getSupabaseServer();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [jobs, last24h, pending] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "reviewing"]),
  ]);
  return {
    jobs: jobs.count ?? 0,
    last24h: last24h.count ?? 0,
    pending: pending.count ?? 0,
  };
}
