import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listEmployers, listWorkers } from "@/lib/workforce";

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
      <h1 className="text-2xl font-bold tracking-tight">New placement</h1>
      <form action={createPlacement} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Worker *</span>
          <select
            name="worker_id"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select worker…</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} {w.employee_code && `(${w.employee_code})`}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Employer *</span>
          <select
            name="employer_id"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select employer…</option>
            {employers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Role title *</span>
          <input
            name="role_title"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Pay rate ($/hr) *</span>
          <input
            name="pay_rate"
            type="number"
            step="0.01"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Bill rate ($/hr) *</span>
          <input
            name="bill_rate"
            type="number"
            step="0.01"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Start date *</span>
          <input
            name="start_date"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">End date</span>
          <input
            name="end_date"
            type="date"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Create placement
          </button>
        </div>
      </form>
    </div>
  );
}
