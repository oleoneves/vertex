import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Job } from "@/types/db";
import { PageHeader } from "../../../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  FormActions,
} from "../../../_components/form";
import { updateJob, deleteJob, setJobActive } from "../../../_actions";

export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    notFound();
  }
  const supabase = await getSupabaseServer();
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();
  const j = job as Job;

  return (
    <div>
      <PageHeader title="Edit job" subtitle={j.title}>
        <form action={setJobActive} className="inline">
          <input type="hidden" name="id" value={j.id} />
          <input type="hidden" name="active" value={j.active ? "false" : "true"} />
          <button
            type="submit"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            {j.active ? "Deactivate" : "Activate"}
          </button>
        </form>
        <form action={deleteJob} className="inline">
          <input type="hidden" name="id" value={j.id} />
          <button
            type="submit"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            Delete
          </button>
        </form>
      </PageHeader>

      <form action={updateJob} className="space-y-6">
        <input type="hidden" name="id" value={j.id} />

        <FormSection title="Basics">
          <FormGrid>
            <FormField label="Title" name="title" required defaultValue={j.title} />
            <FormField label="Employer" name="employer" required defaultValue={j.employer} />
            <FormField
              label="Slug"
              name="slug"
              defaultValue={j.slug}
              hint="URL-friendly identifier, lowercase with dashes."
            />
            <FormSelect
              label="Category"
              name="category"
              required
              defaultValue={j.category}
              options={[
                { value: "construction", label: "Construction" },
                { value: "cleaning", label: "Cleaning & Janitorial" },
                { value: "restoration", label: "Disaster Restoration" },
                { value: "hospitality", label: "Hospitality" },
                { value: "logistics", label: "Warehouse & Logistics" },
                { value: "food", label: "Food Service" },
                { value: "agriculture", label: "Agriculture" },
              ]}
            />
            <FormSelect
              label="Employment type"
              name="employment_type"
              defaultValue={j.employment_type}
              options={[
                { value: "full_time", label: "Full-time" },
                { value: "part_time", label: "Part-time" },
                { value: "seasonal", label: "Seasonal" },
                { value: "contract", label: "Contract" },
              ]}
            />
            <div className="flex flex-col gap-3">
              <FormCheckbox
                label="Feature on homepage"
                name="featured"
                hint="Adds the star and includes in 'Featured jobs' section."
              />
              <FormCheckbox
                label="Active (visible publicly)"
                name="active"
                hint="Uncheck to hide from /jobs without deleting."
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title="Location & pay">
          <FormGrid>
            <FormField
              label="City"
              name="location_city"
              required
              defaultValue={j.location_city}
            />
            <FormField
              label="State (2 letters)"
              name="location_state"
              required
              defaultValue={j.location_state}
              maxLength={2}
            />
            <FormField
              label="Min $/hr"
              name="hourly_rate_min"
              type="number"
              step="0.01"
              defaultValue={j.hourly_rate_min ?? ""}
            />
            <FormField
              label="Max $/hr"
              name="hourly_rate_max"
              type="number"
              step="0.01"
              defaultValue={j.hourly_rate_max ?? ""}
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Description & requirements">
          <FormTextarea
            label="Description"
            name="description"
            rows={5}
            required
            defaultValue={j.description}
          />
          <FormTextarea
            label="Requirements"
            name="requirements"
            rows={3}
            defaultValue={j.requirements ?? ""}
            hint="One per line — renders as a check-icon list."
          />
          <FormTextarea
            label="Benefits"
            name="benefits"
            rows={3}
            defaultValue={j.benefits ?? ""}
          />
        </FormSection>

        <FormActions submitLabel="Save changes" cancelHref="/admin/jobs" />
      </form>
    </div>
  );
}
