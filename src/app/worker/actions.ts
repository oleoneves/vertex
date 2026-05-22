"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getCurrentWorker, getOpenTimeEntry } from "@/lib/workforce";

export async function clockIn(formData: FormData) {
  const placementId = String(formData.get("placement_id") || "");
  const shiftId = String(formData.get("shift_id") || "") || null;
  const location = String(formData.get("location") || "") || null;
  if (!placementId) throw new Error("Missing placement");

  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");

  const open = await getOpenTimeEntry(worker.id);
  if (open) throw new Error("You already have an open clock-in. Clock out first.");

  const supabase = await getSupabaseServer();
  const { data: placement } = await supabase
    .from("placements")
    .select(
      "pay_rate, bill_rate, worker_id, max_hours_per_day, earliest_clock_in, latest_clock_out",
    )
    .eq("id", placementId)
    .maybeSingle();
  if (!placement || placement.worker_id !== worker.id) {
    throw new Error("Placement not found or not yours");
  }

  const now = new Date();
  const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (placement.earliest_clock_in && nowHHMM < String(placement.earliest_clock_in).slice(0, 5)) {
    throw new Error(
      `Too early — clock-in opens at ${String(placement.earliest_clock_in).slice(0, 5)} for this placement.`,
    );
  }
  if (placement.latest_clock_out && nowHHMM > String(placement.latest_clock_out).slice(0, 5)) {
    throw new Error(
      `Too late — clock-in closed at ${String(placement.latest_clock_out).slice(0, 5)} for this placement.`,
    );
  }
  if (placement.max_hours_per_day) {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayEntries } = await supabase
      .from("time_entries")
      .select("hours_worked")
      .eq("placement_id", placementId)
      .gte("clock_in_at", todayStart.toISOString());
    const todayHours = (todayEntries ?? []).reduce(
      (s: number, e: { hours_worked: number | null }) =>
        s + Number(e.hours_worked ?? 0),
      0,
    );
    if (todayHours >= Number(placement.max_hours_per_day)) {
      throw new Error(
        `Daily cap reached: ${todayHours}h / ${placement.max_hours_per_day}h for this placement.`,
      );
    }
  }

  const { error } = await supabase.from("time_entries").insert({
    placement_id: placementId,
    worker_id: worker.id,
    shift_id: shiftId,
    clock_in_at: new Date().toISOString(),
    pay_rate_at_entry: placement.pay_rate,
    bill_rate_at_entry: placement.bill_rate,
    location,
  });
  if (error) throw new Error(error.message);

  if (shiftId) {
    await supabase.from("shifts").update({ status: "in_progress" }).eq("id", shiftId);
  }

  revalidatePath("/worker");
}

export async function clockOut(formData: FormData) {
  const breakMinutes = Number(formData.get("break_minutes") || 0);
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");

  const open = await getOpenTimeEntry(worker.id);
  if (!open) throw new Error("No open clock-in to close");

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("time_entries")
    .update({
      clock_out_at: new Date().toISOString(),
      break_minutes: Number.isFinite(breakMinutes) ? breakMinutes : 0,
    })
    .eq("id", open.id);
  if (error) throw new Error(error.message);

  if (open.shift_id) {
    await supabase.from("shifts").update({ status: "completed" }).eq("id", open.shift_id);
  }

  revalidatePath("/worker");
}
