import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listPlacements } from "@/lib/workforce";

async function createShift(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServer();
  const payload = {
    placement_id: String(formData.get("placement_id")),
    scheduled_start: new Date(String(formData.get("scheduled_start"))).toISOString(),
    scheduled_end: new Date(String(formData.get("scheduled_end"))).toISOString(),
    location: String(formData.get("location") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  };
  const { error } = await supabase.from("shifts").insert(payload);
  if (error) throw new Error(error.message);
  redirect("/admin/shifts");
}

export default async function NewShiftPage() {
  const placements = await listPlacements();
  const active = placements.filter((p) => p.status === "active");
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Schedule shift</h1>
      <form action={createShift} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Placement *</span>
          <select
            name="placement_id"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select placement…</option>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.worker?.full_name} → {p.employer?.name} ({p.role_title})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Start *</span>
          <input
            name="scheduled_start"
            type="datetime-local"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">End *</span>
          <input
            name="scheduled_end"
            type="datetime-local"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Location</span>
          <input
            name="location"
            placeholder="Address or job site name"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="sm:col-span-2 block">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="notes"
            rows={2}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Create shift
          </button>
        </div>
      </form>
    </div>
  );
}
