import { listEmployers, listPlacements } from "@/lib/workforce";
import { listProjects } from "@/lib/projects";
import { bulkScheduleShifts } from "../../_actions";
import { PageHeader } from "../../_components/page-header";
import { BulkScheduleForm } from "./bulk-schedule-form";

export const dynamic = "force-dynamic";

export default async function BulkSchedulePage() {
  const [placements, employers, projects] = await Promise.all([
    listPlacements(),
    listEmployers(),
    listProjects(),
  ]);
  const active = placements.filter((p) => p.status === "active");
  const projectsById = new Map(projects.map((p) => [p.id, p.name]));

  // Map placements to a serializable shape for the client form
  const items = active.map((p) => ({
    id: p.id,
    worker: p.worker?.full_name ?? "—",
    employer: p.employer?.name ?? "—",
    employerId: p.employer_id,
    projectId: p.project_id ?? null,
    projectName: p.project_id ? projectsById.get(p.project_id) ?? null : null,
    role: p.role_title,
    payRate: Number(p.pay_rate),
    billRate: Number(p.bill_rate),
  }));

  return (
    <div>
      <PageHeader
        title="Bulk schedule shifts"
        subtitle="Generate shifts across many placements and days in one go."
      />
      <BulkScheduleForm
        action={bulkScheduleShifts}
        placements={items}
        employers={employers.map((e) => ({ id: e.id, name: e.name }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
