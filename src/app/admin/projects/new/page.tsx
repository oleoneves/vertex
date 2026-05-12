import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listEmployers } from "@/lib/workforce";
import { PageHeader } from "../../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormTextarea,
  FormActions,
} from "../../_components/form";

async function createProject(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const name = String(formData.get("name") || "").trim();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const payload = {
    employer_id: String(formData.get("employer_id")),
    name,
    slug,
    location: String(formData.get("location") || "") || null,
    start_date: String(formData.get("start_date") || "") || null,
    end_date: String(formData.get("end_date") || "") || null,
    budget_hours: Number(formData.get("budget_hours")) || null,
    budget_amount: Number(formData.get("budget_amount")) || null,
    status: String(formData.get("status") || "active"),
    notes: String(formData.get("notes") || "") || null,
  };
  const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/admin/projects/${data.id}`);
}

export default async function NewProjectPage() {
  const employers = await listEmployers();
  return (
    <div>
      <PageHeader
        title="New project"
        subtitle="Define the engagement so you can roll up workers, hours, and margin."
      />
      <form action={createProject} className="space-y-6">
        <FormSection title="Basics">
          <FormGrid>
            <FormSelect
              label="Employer"
              name="employer_id"
              required
              placeholder="Select employer…"
              options={employers.map((e) => ({ value: e.id, label: e.name }))}
              span2
            />
            <FormField label="Project name" name="name" required span2 placeholder="e.g. Sunbelt Refinery Expansion" />
            <FormField label="Location" name="location" placeholder="City, state · site name" />
            <FormSelect
              label="Status"
              name="status"
              options={[
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Dates & budget">
          <FormGrid>
            <FormField label="Start date" name="start_date" type="date" />
            <FormField label="End date" name="end_date" type="date" />
            <FormField
              label="Budget hours"
              name="budget_hours"
              type="number"
              hint="Optional cap — track consumption on the dashboard."
            />
            <FormField
              label="Budget amount ($)"
              name="budget_amount"
              type="number"
              hint="Optional ceiling on billable amount."
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Notes">
          <FormTextarea label="Internal notes" name="notes" rows={3} />
        </FormSection>

        <FormActions submitLabel="Create project" cancelHref="/admin/projects" />
      </form>
    </div>
  );
}
