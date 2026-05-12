import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

async function createJob(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const slug = String(formData.get("slug") || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const payload = {
    slug,
    title: String(formData.get("title") || ""),
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
      <h1 className="text-2xl font-bold tracking-tight">New job</h1>
      <form action={createJob} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Title" required />
        <Field name="employer" label="Employer" required />
        <Field name="slug" label="Slug" placeholder="auto from title if blank" />
        <Field name="category" label="Category" placeholder="hospitality / construction / …" required />
        <SelectField
          name="employment_type"
          label="Type"
          options={[
            ["full_time", "Full-time"],
            ["part_time", "Part-time"],
            ["seasonal", "Seasonal"],
            ["contract", "Contract"],
          ]}
        />
        <Field name="location_city" label="City" required />
        <Field name="location_state" label="State (2 letters)" required />
        <Field name="hourly_rate_min" label="Min $/hr" type="number" />
        <Field name="hourly_rate_max" label="Max $/hr" type="number" />
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Description *</span>
          <textarea
            name="description"
            rows={5}
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Requirements</span>
          <textarea
            name="requirements"
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Benefits</span>
          <textarea
            name="benefits"
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" /> Feature on homepage
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Create job
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
