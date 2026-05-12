import Link from "next/link";
import { Briefcase } from "lucide-react";
import { listProjects } from "@/lib/projects";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { StatusPill } from "../_components/data-table";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Discrete engagements with an employer (e.g. a refinery expansion, hotel renovation)."
        count={projects.length}
        action={{ href: "/admin/projects/new", label: "New project" }}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="No projects yet"
          body="Group placements into projects to track budget, headcount, hours and margin per engagement."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/projects/${p.id}`}
                className="block rounded-xl border border-border bg-background p-5 transition hover:border-foreground/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold tracking-tight">{p.name}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {p.employer?.name ?? "—"}
                      {p.location && ` · ${p.location}`}
                    </p>
                  </div>
                  <StatusPill
                    status={p.status}
                    variant={
                      p.status === "active"
                        ? "green"
                        : p.status === "completed"
                        ? "muted"
                        : p.status === "paused"
                        ? "amber"
                        : "red"
                    }
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider">Start</div>
                    <div className="font-mono text-foreground">
                      {p.start_date ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider">End</div>
                    <div className="font-mono text-foreground">
                      {p.end_date ?? "ongoing"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider">Budget</div>
                    <div className="font-mono text-foreground">
                      {p.budget_amount ? `$${Number(p.budget_amount).toFixed(0)}` : "—"}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
