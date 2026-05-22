import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormTextarea,
  FormActions,
} from "../../_components/form";

async function createEmployer(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const payload = {
    name: String(formData.get("name") || "").trim(),
    contact_name: String(formData.get("contact_name") || "").trim() || null,
    billing_email: String(formData.get("billing_email") || "").trim() || null,
    billing_address: String(formData.get("billing_address") || "").trim() || null,
    bill_rate_multiplier: Number(formData.get("bill_rate_multiplier")) || 1.5,
    hourly_bill_rate: Number(formData.get("hourly_bill_rate")) || null,
    per_diem_rate: Number(formData.get("per_diem_rate")) || null,
    travel_time_rate: Number(formData.get("travel_time_rate")) || null,
    payment_terms_days: Number(formData.get("payment_terms_days")) || 15,
    notes: String(formData.get("notes") || "") || null,
  };
  const { error } = await supabase.from("employers").insert(payload);
  if (error) throw new Error(error.message);
  redirect("/admin/employers");
}

export default function NewEmployerPage() {
  return (
    <div>
      <PageHeader
        title="New employer"
        subtitle="Company that hires labors through Vertex."
      />
      <form action={createEmployer} className="space-y-6">
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
          title="Billing rates"
          description="Per-employer rates used to compute invoice line items. Leave blank to fall back to the multiplier."
        >
          <FormGrid>
            <FormField
              label="Hourly rate ($/hr)"
              name="hourly_bill_rate"
              type="number"
              step="0.01"
              placeholder="e.g. 25.00"
              hint="Billed per labor hour worked."
            />
            <FormField
              label="Per diem ($/day per worker)"
              name="per_diem_rate"
              type="number"
              step="0.01"
              placeholder="e.g. 50.00"
              hint="Daily allowance billed per worker on-site."
            />
            <FormField
              label="Travel time ($/hr)"
              name="travel_time_rate"
              type="number"
              step="0.01"
              placeholder="e.g. 15.00"
              hint="Hourly rate for travel time."
            />
            <FormField
              label="Hotel"
              name="hotel_placeholder"
              type="text"
              disabled
              placeholder="Added per invoice"
              hint="Hotel cost is captured at invoice time, not per employer."
            />
          </FormGrid>
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
