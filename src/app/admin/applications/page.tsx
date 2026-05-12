import { FileText } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";

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
      <PageHeader
        title="Applications"
        subtitle="Candidates who applied via the public site."
        count={apps.length}
      />
      {apps.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No applications yet"
          body="Once candidates submit, they'll show up here ranked by AI score."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>Candidate</Th>
              <Th>Job</Th>
              <Th>Score</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
            </>
          }
        >
          {apps.map((a) => (
            <Tr key={a.id}>
              <Td>
                <div className="font-medium">{a.candidate?.full_name}</div>
                <div className="text-xs text-muted-foreground">{a.candidate?.email}</div>
              </Td>
              <Td>{a.job?.title ?? "—"}</Td>
              <Td>
                {a.ai_score != null ? (
                  <span
                    className={
                      a.ai_score >= 70
                        ? "inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-green-100 px-1.5 text-xs font-bold text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : a.ai_score >= 40
                        ? "inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-amber-100 px-1.5 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        : "inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-red-100 px-1.5 text-xs font-bold text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    }
                  >
                    {a.ai_score}
                  </span>
                ) : (
                  <span className="text-muted-foreground">…</span>
                )}
              </Td>
              <Td>
                <StatusPill
                  status={a.status}
                  variant={
                    a.status === "accepted"
                      ? "green"
                      : a.status === "rejected"
                      ? "red"
                      : a.status === "reviewing"
                      ? "amber"
                      : "blue"
                  }
                />
              </Td>
              <Td className="text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleString()}
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
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
