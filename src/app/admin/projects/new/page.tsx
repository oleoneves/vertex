import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listEmployers } from "@/lib/workforce";
import { PageHeader } from "../../_components/page-header";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
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
    estimate_people: Number(formData.get("estimate_people")) || null,
    estimate_hours_per_day: Number(formData.get("estimate_hours_per_day")) || null,
    estimate_travel_hours_per_person:
      Number(formData.get("estimate_travel_hours_per_person")) || null,
    status: String(formData.get("status") || "active"),
    notes: String(formData.get("notes") || "") || null,
  };
  const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/admin/projects/${data.id}`);
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ employer_id?: string }>;
}) {
  const [employers, locale, sp] = await Promise.all([
    listEmployers(),
    getLocale(),
    searchParams,
  ]);
  return (
    <div>
      <PageHeader
        title={t(locale, "a.new.project.title")}
        subtitle={t(locale, "a.new.project.subtitle")}
      />
      <form action={createProject} className="space-y-6">
        <FormSection title="Basics">
          <FormGrid>
            <div className="sm:col-span-2">
              <FormSelect
                label="Empresa contratante"
                name="employer_id"
                required
                placeholder="Select employer…"
                options={employers.map((e) => ({ value: e.id, label: e.name }))}
                defaultValue={sp.employer_id ?? ""}
              />
              <Link
                href="/admin/employers/new?return_to=/admin/projects/new"
                className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
              >
                + Cadastrar empresa
              </Link>
            </div>
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

        <FormSection title="Dates">
          <FormGrid>
            <FormField label="Start date" name="start_date" type="date" />
            <FormField label="End date" name="end_date" type="date" />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Estimate inputs"
          description="Used to generate the contract estimate (English). Rates come from the employer's profile."
        >
          <FormGrid>
            <FormField
              label="People"
              name="estimate_people"
              type="number"
              placeholder="e.g. 10"
              hint="Headcount the contractor requested."
            />
            <FormField
              label="Hours per day per person"
              name="estimate_hours_per_day"
              type="number"
              step="0.25"
              placeholder="e.g. 10"
            />
            <FormField
              label="Travel time hours per person (total)"
              name="estimate_travel_hours_per_person"
              type="number"
              step="0.25"
              placeholder="optional"
              hint="Round-trip travel hours billed per person over the whole project."
            />
            <FormField
              label="Approved hours (override)"
              name="budget_hours"
              type="number"
              hint="Leave blank to compute from People × Hours/day × Days."
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
