import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

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
    notes: String(formData.get("notes") || "") || null,
  };
  const { error } = await supabase.from("workers").insert(payload);
  if (error) throw new Error(error.message);
  redirect("/admin/workers");
}

export default function NewWorkerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">New worker</h1>
      <form action={createWorker} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field name="full_name" label="Full name" required />
        <Field name="employee_code" label="Employee code" placeholder="e.g. W-1001" />
        <Field name="email" label="Email" type="email" />
        <Field name="phone" label="Phone" type="tel" />
        <SelectField
          name="status"
          label="Status"
          options={[
            ["onboarding", "Onboarding"],
            ["active", "Active"],
            ["inactive", "Inactive"],
          ]}
        />
        <SelectField
          name="pay_type"
          label="Pay type"
          options={[
            ["hourly", "Hourly"],
            ["salary", "Salary"],
          ]}
        />
        <Field name="default_pay_rate" label="Default pay rate ($/hr)" type="number" />
        <SelectField
          name="payment_method"
          label="Payment method"
          options={[
            ["check", "Check"],
            ["ach", "ACH"],
            ["zelle", "Zelle"],
            ["cashapp", "CashApp"],
          ]}
        />
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Create worker
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
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
