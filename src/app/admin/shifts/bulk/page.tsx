import { listEmployers, listPlacements } from "@/lib/workforce";
import { bulkScheduleShifts } from "../../_actions";
import { PageHeader } from "../../_components/page-header";
import { BulkScheduleForm } from "./bulk-schedule-form";

export const dynamic = "force-dynamic";

export default async function BulkSchedulePage() {
  const [placements, employers] = await Promise.all([listPlacements(), listEmployers()]);
  const active = placements.filter((p) => p.status === "active");

  // Map placements to a serializable shape for the client form
  const items = active.map((p) => ({
    id: p.id,
    worker: p.worker?.full_name ?? "—",
    employer: p.employer?.name ?? "—",
    employerId: p.employer_id,
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
      />
    </div>
  );
}
