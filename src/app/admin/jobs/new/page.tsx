import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  FormActions,
} from "../../_components/form";

async function createJob(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const title = String(formData.get("title") || "").trim();
  const slug =
    String(formData.get("slug") || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const payload = {
    slug,
    title,
    employer: String(formData.get("employer") || ""),
    category: String(formData.get("category") || "other"),
    employment_type: String(formData.get("employment_type") || "full_time"),
    location_city: String(formData.get("location_city") || ""),
    location_state: String(formData.get("location_state") || "").toUpperCase().slice(0, 2),
    hourly_rate_min: Number(formData.get("hourly_rate_min")) || null,
    hourly_rate_max: Number(formData.get("hourly_rate_max")) || null,
    description: String(formData.get("description") || ""),
    requirements: String(formData.get("requirements") || "") || null,
    benefits: String(formData.get("benefits") || "") || null,
    featured: formData.get("featured") === "on",
  };
  const { error } = await supabase.from("jobs").insert(payload);
  if (error) throw new Error(error.message);
  redirect("/admin/jobs");
}

export default function NewJobPage() {
  return (
    <div>
      <PageHeader
        title="New job"
        subtitle="Posted publicly on /jobs once active."
      />
      <form action={createJob} className="space-y-6">
        <FormSection title="Basics">
          <FormGrid>
            <FormField label="Title" name="title" required />
            <FormField label="Employer" name="employer" required />
            <FormField
              label="Slug"
              name="slug"
              placeholder="auto from title if blank"
              hint="URL-friendly identifier, lowercase with dashes."
            />
            <FormSelect
              label="Category"
              name="category"
              required
              placeholder="Choose category…"
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
              options={[
                { value: "full_time", label: "Full-time" },
                { value: "part_time", label: "Part-time" },
                { value: "seasonal", label: "Seasonal" },
                { value: "contract", label: "Contract" },
              ]}
            />
            <FormCheckbox
              label="Feature on homepage"
              name="featured"
              hint="Adds the star and includes in 'Featured jobs' section."
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Location & pay">
          <FormGrid>
            <FormField label="City" name="location_city" required />
            <FormField
              label="State (2 letters)"
              name="location_state"
              required
              placeholder="FL"
              maxLength={2}
            />
            <FormField
              label="Min $/hr"
              name="hourly_rate_min"
              type="number"
              step="0.01"
            />
            <FormField
              label="Max $/hr"
              name="hourly_rate_max"
              type="number"
              step="0.01"
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Description & requirements">
          <FormTextarea
            label="Description"
            name="description"
            rows={5}
            required
          />
          <FormTextarea
            label="Requirements"
            name="requirements"
            rows={3}
            hint="One per line — renders as a check-icon list."
          />
          <FormTextarea label="Benefits" name="benefits" rows={3} />
        </FormSection>

        <FormActions submitLabel="Create job" cancelHref="/admin/jobs" />
      </form>
    </div>
  );
}
