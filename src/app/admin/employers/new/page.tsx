import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormTextarea,
  FormActions,
} from "../../_components/form";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

function safeReturnTo(raw: unknown): string | null {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/admin/") ? v : null;
}

async function createEmployer(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const billingMode =
    String(formData.get("billing_mode") || "hourly") === "fixed_budget"
      ? "fixed_budget"
      : "hourly";
  const payload = {
    name: String(formData.get("name") || "").trim(),
    contact_name: String(formData.get("contact_name") || "").trim() || null,
    billing_email: String(formData.get("billing_email") || "").trim() || null,
    billing_address: String(formData.get("billing_address") || "").trim() || null,
    billing_mode: billingMode,
    bill_rate_multiplier: Number(formData.get("bill_rate_multiplier")) || 1.5,
    hourly_bill_rate: Number(formData.get("hourly_bill_rate")) || null,
    hourly_pay_rate: Number(formData.get("hourly_pay_rate")) || null,
    per_diem_rate: Number(formData.get("per_diem_rate")) || null,
    per_diem_cost: Number(formData.get("per_diem_cost")) || null,
    travel_time_rate: Number(formData.get("travel_time_rate")) || null,
    travel_time_cost: Number(formData.get("travel_time_cost")) || null,
    payment_terms_days: Number(formData.get("payment_terms_days")) || 15,
    notes: String(formData.get("notes") || "") || null,
  };
  const { data, error } = await supabase
    .from("employers")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const returnTo = safeReturnTo(formData.get("return_to"));
  if (returnTo) {
    const sep = returnTo.includes("?") ? "&" : "?";
    redirect(`${returnTo}${sep}employer_id=${data.id}`);
  }
  redirect("/admin/employers");
}

export default async function NewEmployerPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const [locale, sp] = await Promise.all([getLocale(), searchParams]);
  const returnTo = safeReturnTo(sp.return_to);
  return (
    <div>
      <PageHeader
        title={t(locale, "a.new.employer.title")}
        subtitle={t(locale, "a.new.employer.subtitle")}
      />
      <form action={createEmployer} className="space-y-6">
        {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
        <FormSection title="Company" description="Identification and primary contact.">
          <FormGrid>
            <FormField label="Company name" name="name" required span2 />
            <FormField label="Contact name" name="contact_name" />
            <FormField label="Billing email" name="billing_email" type="email" />
            <FormTextarea
              label="Billing address"
              name="billing_address"
              rows={2}
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Billing model"
          description="Choose how this employer is billed. Hourly uses the rates below; fixed budget invoices a per-project amount set when the project is created."
        >
          <FormGrid>
            <FormSelect
              label="Billing mode"
              name="billing_mode"
              defaultValue="hourly"
              options={[
                { value: "hourly", label: "Hourly (rate × hours)" },
                { value: "fixed_budget", label: "Fixed budget (per project)" },
              ]}
              span2
              hint="Fixed budget skips hourly invoicing — the project's budget amount is what gets billed."
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Billing rates & Vertex cost"
          description="Used when billing mode is hourly. What the employer pays Vertex (bill) and what Vertex pays out (cost). Optional for fixed-budget employers."
        >
          <FormGrid>
            <FormField
              label="Labor — bill ($/hr)"
              name="hourly_bill_rate"
              type="number"
              step="0.01"
              placeholder="e.g. 25.00"
              hint="What the employer pays per labor hour."
            />
            <FormField
              label="Labor — Vertex cost ($/hr)"
              name="hourly_pay_rate"
              type="number"
              step="0.01"
              placeholder="e.g. 15.00"
              hint="What Vertex pays the worker per hour."
            />
            <FormField
              label="Per diem — bill ($/day per person)"
              name="per_diem_rate"
              type="number"
              step="0.01"
              placeholder="e.g. 50.00"
            />
            <FormField
              label="Per diem — Vertex cost ($/day)"
              name="per_diem_cost"
              type="number"
              step="0.01"
              placeholder="e.g. 35.00"
            />
            <FormField
              label="Travel time — bill ($/hr)"
              name="travel_time_rate"
              type="number"
              step="0.01"
              placeholder="e.g. 15.00"
            />
            <FormField
              label="Travel time — Vertex cost ($/hr)"
              name="travel_time_cost"
              type="number"
              step="0.01"
              placeholder="e.g. 10.00"
            />
          </FormGrid>
          <p className="mt-2 text-xs text-muted-foreground">
            Hotel is captured at invoice time (not per employer).
          </p>
        </FormSection>

        <FormSection
          title="Fallback multiplier"
          description="Used only when an hourly rate above isn't set."
        >
          <FormGrid>
            <FormField
              label="Bill rate multiplier"
              name="bill_rate_multiplier"
              type="number"
              step="0.01"
              defaultValue="1.5"
              hint="Applied to worker pay rate when no explicit hourly rate."
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Notes">
          <FormTextarea label="Internal notes" name="notes" rows={3} />
        </FormSection>

        <FormActions submitLabel="Create employer" cancelHref="/admin/employers" />
      </form>
    </div>
  );
}
