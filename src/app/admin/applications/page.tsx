import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  status: string;
  ai_score: number | null;
  ai_summary: string | null;
  experience_summary: string | null;
  created_at: string;
  candidate: { full_name: string; email: string } | null;
  job: { title: string; slug: string } | null;
};

export default async function ApplicationsPage() {
  const apps = await load();
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Job</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No applications yet.
                </td>
              </tr>
            )}
            {apps.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <div className="font-medium">{a.candidate?.full_name}</div>
                  <div className="text-xs text-muted-foreground">{a.candidate?.email}</div>
                </td>
                <td className="px-3 py-2">{a.job?.title ?? "—"}</td>
                <td className="px-3 py-2">
                  {a.ai_score != null ? (
                    <span
                      className={
                        a.ai_score >= 70
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                          : a.ai_score >= 40
                          ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                          : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800"
                      }
                    >
                      {a.ai_score}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">…</span>
                  )}
                </td>
                <td className="px-3 py-2 capitalize">{a.status}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function load(): Promise<Row[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, status, ai_score, ai_summary, experience_summary, created_at, candidate:candidates(full_name, email), job:jobs(title, slug)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as unknown as Row[]) ?? [];
}
