"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode, demoWorkers, demoPlacements } from "@/lib/demo";
import { getSupabaseServer } from "@/lib/supabase/server";

// Demo PIN strategy: last 4 digits of worker.id (e.g. "worker-042" → "0042")
function demoPin(workerId: string): string {
  const digits = workerId.replace(/[^0-9]/g, "");
  return digits.slice(-4).padStart(4, "0");
}

export async function kioskAuth(formData: FormData): Promise<{
  ok: boolean;
  workerId?: string;
  workerName?: string;
  error?: string;
}> {
  const workerId = String(formData.get("worker_id") || "");
  const pin = String(formData.get("pin") || "");
  if (!workerId || pin.length !== 4) {
    return { ok: false, error: "Bad input" };
  }

  if (isDemoMode()) {
    const w = demoWorkers().find((x) => x.id === workerId);
    if (!w) return { ok: false, error: "Worker not found" };
    if (demoPin(w.id) !== pin) return { ok: false, error: "Wrong PIN" };
    return { ok: true, workerId: w.id, workerName: w.full_name };
  }

  const supabase = await getSupabaseServer();
  const { data: w } = await supabase
    .from("workers")
    .select("id, full_name, entry_pin")
    .eq("id", workerId)
    .maybeSingle();
  if (!w) return { ok: false, error: "Worker not found" };
  // entry_pin stored hashed in real DB — for now, accept any 4-digit during demo
  const stored = (w as { entry_pin?: string | null }).entry_pin ?? "0000";
  if (stored !== pin) return { ok: false, error: "Wrong PIN" };
  return { ok: true, workerId: w.id, workerName: (w as { full_name: string }).full_name };
}

export async function kioskClockIn(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const workerId = String(formData.get("worker_id") || "");
  const placementId = String(formData.get("placement_id") || "");
  const location = String(formData.get("location") || "") || null;
  if (!workerId || !placementId) return { ok: false, error: "Missing input" };

  if (isDemoMode()) {
    // In demo, just succeed
    return { ok: true };
  }

  const supabase = await getSupabaseServer();
  // Reject if already clocked in
  const { data: open } = await supabase
    .from("time_entries")
    .select("id")
    .eq("worker_id", workerId)
    .is("clock_out_at", null)
    .maybeSingle();
  if (open) {
    return { ok: false, error: "Already clocked in" };
  }
  const { data: placement } = await supabase
    .from("placements")
    .select("pay_rate, bill_rate, worker_id")
    .eq("id", placementId)
    .maybeSingle();
  if (!placement || placement.worker_id !== workerId) {
    return { ok: false, error: "Placement not yours" };
  }
  const { error } = await supabase.from("time_entries").insert({
    placement_id: placementId,
    worker_id: workerId,
    clock_in_at: new Date().toISOString(),
    pay_rate_at_entry: placement.pay_rate,
    bill_rate_at_entry: placement.bill_rate,
    location,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/clock");
  return { ok: true };
}

export async function kioskClockOut(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const workerId = String(formData.get("worker_id") || "");
  const breakMinutes = Number(formData.get("break_minutes") || 0);
  if (!workerId) return { ok: false, error: "Missing input" };

  if (isDemoMode()) return { ok: true };

  const supabase = await getSupabaseServer();
  const { data: open } = await supabase
    .from("time_entries")
    .select("id")
    .eq("worker_id", workerId)
    .is("clock_out_at", null)
    .maybeSingle();
  if (!open) return { ok: false, error: "No open clock-in" };

  const { error } = await supabase
    .from("time_entries")
    .update({
      clock_out_at: new Date().toISOString(),
      break_minutes: Number.isFinite(breakMinutes) ? breakMinutes : 0,
    })
    .eq("id", (open as { id: string }).id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/clock");
  return { ok: true };
}

export async function kioskLoadWorkerContext(workerId: string): Promise<{
  placements: Array<{ id: string; role_title: string; employer: string }>;
  openEntryClockInAt: string | null;
}> {
  if (isDemoMode()) {
    const placements = demoPlacements()
      .filter((p) => p.worker_id === workerId && p.status === "active")
      .map((p) => ({
        id: p.id,
        role_title: p.role_title,
        employer:
          p.employer_id === "emp-sunbelt"
            ? "Sunbelt Industrial Group"
            : p.employer_id === "emp-hilton"
            ? "Hilton Orlando"
            : p.employer_id === "emp-clearwave"
            ? "ClearWave Facility Services"
            : p.employer_id === "emp-westlake"
            ? "Westlake Builders"
            : "Restoration Pro USA",
      }));
    return { placements, openEntryClockInAt: null };
  }
  const supabase = await getSupabaseServer();
  const [{ data: placementRows }, { data: openRow }] = await Promise.all([
    supabase
      .from("placements")
      .select("id, role_title, employer:employers(name)")
      .eq("worker_id", workerId)
      .eq("status", "active"),
    supabase
      .from("time_entries")
      .select("clock_in_at")
      .eq("worker_id", workerId)
      .is("clock_out_at", null)
      .maybeSingle(),
  ]);
  type PlacementRow = { id: string; role_title: string; employer: { name: string } | null };
  return {
    placements: ((placementRows as unknown as PlacementRow[]) ?? []).map((p) => ({
      id: p.id,
      role_title: p.role_title,
      employer: p.employer?.name ?? "—",
    })),
    openEntryClockInAt: (openRow as { clock_in_at: string } | null)?.clock_in_at ?? null,
  };
}
