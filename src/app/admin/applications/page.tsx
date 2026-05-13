import { FileText } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isDemoMode, demoApplications } from "@/lib/demo";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";
import { hireApplicant, rejectApplicant, reopenApplicant } from "../_actions";
import { FunnelChart, CHART_COLORS } from "../../_components/charts";
import { fmtNum } from "@/lib/format";

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

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const apps = await load(sp);
  // Unfiltered view for the funnel (always pulls the full set)
  const allApps = await load({});
  const byStatus = {
    new: allApps.filter((a) => a.status === "new").length,
    reviewing: allApps.filter((a) => a.status === "reviewing").length,
    accepted: allApps.filter((a) => a.status === "accepted").length,
    rejected: allApps.filter((a) => a.status === "rejected").length,
  };
  const funnelData = [
    { label: "Applied", value: allApps.length, color: CHART_COLORS.blue },
    { label: "Reviewing", value: byStatus.reviewing + byStatus.accepted, color: CHART_COLORS.amber },
    { label: "Accepted", value: byStatus.accepted, color: CHART_COLORS.green },
  ];

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Candidates who applied via the public site."
        count={apps.length}
      />

      {/* Status summary + funnel */}
      {allApps.length > 0 && (
        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recruiting funnel
            </h2>
            <div className="mt-4 text-foreground">
              <FunnelChart
                data={funnelData}
                formatter={(n) => fmtNum(n)}
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              By status
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatusCount label="New" value={byStatus.new} color="blue" />
              <StatusCount label="Reviewing" value={byStatus.reviewing} color="amber" />
              <StatusCount label="Accepted" value={byStatus.accepted} color="green" />
              <StatusCount label="Rejected" value={byStatus.rejected} color="muted" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {byStatus.accepted > 0 && (
                <>
                  Hire rate:{" "}
                  <strong className="text-foreground">
                    {Math.round((byStatus.accepted / allApps.length) * 100)}%
                  </strong>{" "}
                  ({byStatus.accepted} of {allApps.length})
                </>
              )}
            </p>
          </div>
        </section>
      )}

      <FilterBar
        searchValue={sp.q}
        searchPlaceholder="Search candidate name or email…"
        filters={[
          {
            name: "status",
            label: "Status",
            value: sp.status,
            options: [
              { value: "new", label: "New" },
              { value: "reviewing", label: "Reviewing" },
              { value: "accepted", label: "Accepted" },
              { value: "rejected", label: "Rejected" },
            ],
          },
        ]}
      />
      {apps.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No applications match"
          body="Adjust the filter or wait for new submissions."
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
              <Th>Actions</Th>
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
                {new Date(a.created_at).toLocaleDateString()}
              </Td>
              <Td>
                {a.status === "accepted" ? (
                  <span className="text-xs text-muted-foreground">hired</span>
                ) : a.status === "rejected" ? (
                  <form action={reopenApplicant} className="inline">
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                    >
                      Reopen
                    </button>
                  </form>
                ) : (
                  <div className="flex gap-1.5">
                    <form action={hireApplicant} className="inline">
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-green-600 px-2 py-1 text-xs font-bold text-white hover:bg-green-700"
                      >
                        Hire
                      </button>
                    </form>
                    <form action={rejectApplicant} className="inline">
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

function StatusCount({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "amber" | "green" | "muted";
}) {
  const colors: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/30",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30",
    green: "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/30",
    muted: "border-border bg-muted/30",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

async function load(filters: { status?: string; q?: string }): Promise<Row[]> {
  if (isDemoMode()) {
    let apps = demoApplications();
    if (filters.status) apps = apps.filter((a) => a.status === filters.status);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.candidate?.full_name.toLowerCase().includes(q) ||
          a.candidate?.email.toLowerCase().includes(q),
      );
    }
    return apps as unknown as Row[];
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("applications")
    .select(
      "id, status, ai_score, ai_summary, experience_summary, created_at, candidate:candidates!inner(full_name, email), job:jobs(title, slug)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.q) {
    q = q.or(
      `full_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%`,
      { foreignTable: "candidates" },
    );
  }
  const { data } = await q;
  return (data as unknown as Row[]) ?? [];
}
