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

async function createWorker(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const payload = {
    full_name: String(formData.get("full_name") || "").trim(),
    employee_code: String(formData.get("employee_code") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    status: String(formData.get("status") || "onboarding"),
    pay_type: String(formData.get("pay_type") || "hourly"),
    default_pay_rate: Number(formData.get("default_pay_rate")) || null,
    payment_method: String(formData.get("payment_method") || "check"),
    zelle_full_name: String(formData.get("zelle_full_name") || "").trim() || null,
    ssn: String(formData.get("ssn") || "").trim() || null,
    itin: String(formData.get("itin") || "").trim() || null,
    business_name: String(formData.get("business_name") || "").trim() || null,
    ein: String(formData.get("ein") || "").trim() || null,
    travel_available: formData.get("travel_available") === "1",
    travel_region: String(formData.get("travel_region") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  };
  const { error } = await supabase.from("workers").insert(payload);
  if (error) throw new Error(error.message);
  redirect("/admin/workers");
}

export default async function NewWorkerPage() {
  const locale = await getLocale();
  return (
    <div>
      <PageHeader
        title={t(locale, "a.new.worker.title")}
        subtitle={t(locale, "a.new.worker.subtitle")}
      />
      <form action={createWorker} className="space-y-6">
        <FormSection title="Identity" description="How we'll address and identify this worker.">
          <FormGrid>
            <FormField label="Full name" name="full_name" required />
            <FormField
              label="Employee code"
              name="employee_code"
              placeholder="e.g. W-1001"
              hint="Internal ID. Leave blank to assign later."
            />
            <FormField label="Email" name="email" type="email" />
            <FormField label="Phone" name="phone" type="tel" />
          </FormGrid>
        </FormSection>

        <FormSection title="Employment" description="Status and how this worker is paid.">
          <FormGrid>
            <FormSelect
              label="Status"
              name="status"
              options={[
                { value: "onboarding", label: "Onboarding" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
            <FormSelect
              label="Pay type"
              name="pay_type"
              options={[
                { value: "hourly", label: "Hourly" },
                { value: "salary", label: "Salary" },
              ]}
            />
            <FormField
              label="Default pay rate"
              name="default_pay_rate"
              type="number"
              step="0.01"
              hint="$/hour. Per-placement rates override this."
            />
            <FormSelect
              label="Payment method"
              name="payment_method"
              options={[
                { value: "check", label: "Check" },
                { value: "ach", label: "ACH" },
                { value: "zelle", label: "Zelle" },
                { value: "cashapp", label: "CashApp" },
              ]}
            />
            <FormField
              label="Zelle full name"
              name="zelle_full_name"
              hint="Name registered on Zelle if it differs from full name above."
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Tax & compliance" description="Sensitive — admin access only.">
          <FormGrid>
            <FormField
              label="Social Security Number"
              name="ssn"
              placeholder="XXX-XX-XXXX"
              hint="For W-2 employees and US-citizen 1099 contractors."
            />
            <FormField
              label="ITIN"
              name="itin"
              placeholder="9XX-XX-XXXX"
              hint="For contractors without SSN (non-resident, dependent, etc.)."
            />
            <FormField
              label="Business name"
              name="business_name"
              placeholder="e.g. Barreto Services LLC"
              hint="If the worker is paid as a registered company."
            />
            <FormField
              label="EIN"
              name="ein"
              placeholder="XX-XXXXXXX"
              hint="Federal EIN of the business above. Used on 1099-NEC."
            />
          </FormGrid>
          <p className="mt-2 text-xs text-muted-foreground">
            W-9 upload becomes available after the worker is created.
          </p>
        </FormSection>

        <FormSection title="Travel availability" description="Used when assigning out-of-town jobs.">
          <FormGrid>
            <label className="block">
              <span className="text-xs font-medium">Available for travel?</span>
              <div className="mt-1 flex gap-3">
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" name="travel_available" value="1" className="h-4 w-4 accent-yellow-400" />
                  <span className="text-sm">Yes, I can travel</span>
                </label>
              </div>
            </label>
            <FormSelect
              label="Max travel region"
              name="travel_region"
              options={[
                { value: "", label: "— select —" },
                { value: "local", label: "Local only (same city)" },
                { value: "state", label: "Anywhere in the state" },
                { value: "national", label: "Anywhere in the US" },
                { value: "international", label: "International" },
              ]}
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Notes">
          <FormTextarea label="Internal notes" name="notes" rows={3} />
        </FormSection>

        <FormActions submitLabel="Create worker" cancelHref="/admin/workers" />
      </form>
    </div>
  );
}
