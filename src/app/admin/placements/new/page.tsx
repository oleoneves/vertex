import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listEmployers, listWorkers } from "@/lib/workforce";
import { PageHeader } from "../../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormActions,
} from "../../_components/form";

async function createPlacement(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const payRate = Number(formData.get("pay_rate"));
  const billRate = Number(formData.get("bill_rate"));
  const payload = {
    worker_id: String(formData.get("worker_id")),
    employer_id: String(formData.get("employer_id")),
    role_title: String(formData.get("role_title") || "").trim(),
    pay_rate: payRate,
    bill_rate: billRate,
    start_date: String(formData.get("start_date")),
    end_date: String(formData.get("end_date") || "") || null,
    status: "active",
  };
  const { error } = await supabase.from("placements").insert(payload);
  if (error) throw new Error(error.message);
  redirect("/admin/placements");
}

export default async function NewPlacementPage() {
  const [workers, employers] = await Promise.all([listWorkers(), listEmployers()]);
  return (
    <div>
      <PageHeader
        title="New placement"
        subtitle="Assign a worker to an employer with pay and bill rates."
      />
      <form action={createPlacement} className="space-y-6">
        <FormSection title="Assignment">
          <FormGrid>
            <FormSelect
              label="Worker"
              name="worker_id"
              required
              placeholder="Select worker…"
              options={workers.map((w) => ({
                value: w.id,
                label: `${w.full_name}${w.employee_code ? ` (${w.employee_code})` : ""}`,
              }))}
            />
            <FormSelect
              label="Employer"
              name="employer_id"
              required
              placeholder="Select employer…"
              options={employers.map((e) => ({ value: e.id, label: e.name }))}
            />
            <FormField label="Role title" name="role_title" required span2 />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Rates"
          description="Worker pay is what we pay the worker; bill rate is what we charge the employer."
        >
          <FormGrid>
            <FormField
              label="Pay rate ($/hr)"
              name="pay_rate"
              type="number"
              step="0.01"
              required
            />
            <FormField
              label="Bill rate ($/hr)"
              name="bill_rate"
              type="number"
              step="0.01"
              required
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Period">
          <FormGrid>
            <FormField label="Start date" name="start_date" type="date" required />
            <FormField label="End date" name="end_date" type="date" hint="Leave blank for ongoing." />
          </FormGrid>
        </FormSection>

        <FormActions submitLabel="Create placement" cancelHref="/admin/placements" />
      </form>
    </div>
  );
}
