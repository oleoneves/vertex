import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listEmployers, listWorkers } from "@/lib/workforce";
import { listProjects } from "@/lib/projects";
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
    project_id: String(formData.get("project_id") || "") || null,
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
  const [workers, employers, projects] = await Promise.all([
    listWorkers(),
    listEmployers(),
    listProjects(),
  ]);
  return (
    <div>
      <PageHeader
        title="New placement"
        subtitle="Assign a worker to an employer (and optional project) with pay and bill rates."
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
            <FormSelect
              label="Project (optional)"
              name="project_id"
              placeholder="No project"
              span2
              options={projects.map((p) => ({
                value: p.id,
                label: `${p.name} · ${p.employer?.name ?? "—"}`,
              }))}
              hint="Group this placement under a project to roll up budget and reporting."
            />
            <FormSelect
              label="Role"
              name="role_title"
              required
              span2
              options={[
                { value: "Skilled Labor", label: "Skilled Labor" },
                { value: "Unskilled Labor", label: "Unskilled Labor" },
                { value: "Supervisor", label: "Supervisor" },
              ]}
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Rates"
          description="Pay rate is to the worker; bill rate is to the employer. Vertex margin = bill − pay (covers overhead + profit)."
        >
          <FormGrid>
            <FormField
              label="Pay rate ($/hr)"
              name="pay_rate"
              type="number"
              step="0.01"
              required
              defaultValue="15"
              hint="What the worker takes home"
            />
            <FormField
              label="Bill rate ($/hr)"
              name="bill_rate"
              type="number"
              step="0.01"
              required
              defaultValue="25"
              hint="What the employer is invoiced"
            />
          </FormGrid>
          <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-3 text-xs text-foreground/80">
            <strong>Vertex model:</strong> default $15 to worker · $25 to employer · $10/hr Vertex margin (~$5 overhead / ~$5 net).
          </div>
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
