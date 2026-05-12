import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

async function createEmployer(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const payload = {
    name: String(formData.get("name") || "").trim(),
    contact_name: String(formData.get("contact_name") || "").trim() || null,
    billing_email: String(formData.get("billing_email") || "").trim() || null,
    billing_address: String(formData.get("billing_address") || "").trim() || null,
    bill_rate_multiplier: Number(formData.get("bill_rate_multiplier")) || 1.5,
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
      <h1 className="text-2xl font-bold tracking-tight">New employer</h1>
      <form action={createEmployer} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Company name *</span>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Contact name</span>
          <input
            name="contact_name"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Billing email</span>
          <input
            name="billing_email"
            type="email"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Billing address</span>
          <textarea
            name="billing_address"
            rows={2}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Bill rate multiplier</span>
          <input
            name="bill_rate_multiplier"
            type="number"
            step="0.01"
            defaultValue="1.5"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Payment terms (days)</span>
          <input
            name="payment_terms_days"
            type="number"
            defaultValue="15"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
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
            Create employer
          </button>
        </div>
      </form>
    </div>
  );
}
