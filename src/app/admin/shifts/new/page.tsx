import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listPlacements } from "@/lib/workforce";
import { PageHeader } from "../../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormTextarea,
  FormActions,
} from "../../_components/form";

async function createShift(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const payload = {
    placement_id: String(formData.get("placement_id")),
    scheduled_start: new Date(String(formData.get("scheduled_start"))).toISOString(),
    scheduled_end: new Date(String(formData.get("scheduled_end"))).toISOString(),
    location: String(formData.get("location") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  };
  const { error } = await supabase.from("shifts").insert(payload);
  if (error) throw new Error(error.message);
  redirect("/admin/shifts");
}

export default async function NewShiftPage() {
  const placements = await listPlacements();
  const active = placements.filter((p) => p.status === "active");
  return (
    <div>
      <PageHeader
        title="Schedule shift"
        subtitle="A scheduled block of work against an active placement."
      />
      <form action={createShift} className="space-y-6">
        <FormSection title="Placement">
          <FormSelect
            label="Placement"
            name="placement_id"
            required
            placeholder="Select placement…"
            span2
            options={active.map((p) => ({
              value: p.id,
              label: `${p.worker?.full_name ?? "—"} → ${p.employer?.name ?? "—"} (${p.role_title})`,
            }))}
            hint={
              active.length === 0
                ? "No active placements yet — create one first."
                : undefined
            }
          />
        </FormSection>

        <FormSection title="Schedule">
          <FormGrid>
            <FormField
              label="Start"
              name="scheduled_start"
              type="datetime-local"
              required
            />
            <FormField
              label="End"
              name="scheduled_end"
              type="datetime-local"
              required
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Details">
          <FormField
            label="Location"
            name="location"
            placeholder="Address or job site name"
            span2
          />
          <FormTextarea label="Notes" name="notes" rows={2} />
        </FormSection>

        <FormActions submitLabel="Create shift" cancelHref="/admin/shifts" />
      </form>
    </div>
  );
}
