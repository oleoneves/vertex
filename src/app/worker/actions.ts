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

  // Block clock-in until both PPE + terms are signed
  const { data: sigs } = await supabase
    .from("worker_signatures")
    .select("document")
    .eq("worker_id", worker.id);
  const docsSigned = new Set(((sigs as { document: string }[]) ?? []).map((s) => s.document));
  if (!docsSigned.has("ppe") || !docsSigned.has("terms")) {
    throw new Error("Assine o Termo de EPI e os Termos de uso em /worker/sign antes de fazer clock-in.");
  }

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

export async function acceptShift(formData: FormData) {
  const shiftId = String(formData.get("shift_id"));
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const supabase = await getSupabaseServer();
  const { data: shift } = await supabase
    .from("shifts")
    .select("placement:placements(worker_id)")
    .eq("id", shiftId)
    .maybeSingle();
  const p = (shift as unknown as { placement: { worker_id: string } | null } | null)?.placement;
  if (!p || p.worker_id !== worker.id) throw new Error("Shift not found or not yours");
  await supabase
    .from("shifts")
    .update({ status: "accepted", worker_responded_at: new Date().toISOString() })
    .eq("id", shiftId);
  revalidatePath("/worker/shifts");
  revalidatePath("/worker");
}

export async function declineShift(formData: FormData) {
  const shiftId = String(formData.get("shift_id"));
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const supabase = await getSupabaseServer();
  const { data: shift } = await supabase
    .from("shifts")
    .select("placement:placements(worker_id)")
    .eq("id", shiftId)
    .maybeSingle();
  const p = (shift as unknown as { placement: { worker_id: string } | null } | null)?.placement;
  if (!p || p.worker_id !== worker.id) throw new Error("Shift not found or not yours");
  await supabase
    .from("shifts")
    .update({ status: "declined", worker_responded_at: new Date().toISOString() })
    .eq("id", shiftId);
  revalidatePath("/worker/shifts");
  revalidatePath("/worker");
}

// ============ Referrals ============
export async function addReferral(formData: FormData) {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const supabase = await getSupabaseServer();
  const name = String(formData.get("referred_name") || "").trim();
  if (!name) throw new Error("Nome é obrigatório");
  await supabase.from("worker_referrals").insert({
    referrer_worker_id: worker.id,
    referred_name: name,
    referred_email: String(formData.get("referred_email") || "").trim() || null,
    referred_phone: String(formData.get("referred_phone") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath("/worker/refer");
}

// ============ Rating ============
export async function addRating(formData: FormData) {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const kind = String(formData.get("target_kind") || "job");
  if (!["job", "supervisor", "peer", "project"].includes(kind)) {
    throw new Error("Tipo de avaliação inválido");
  }
  const stars = Number(formData.get("stars"));
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    throw new Error("Estrelas entre 1 e 5");
  }
  const supabase = await getSupabaseServer();
  await supabase.from("worker_ratings_given").insert({
    rater_worker_id: worker.id,
    target_kind: kind,
    project_id: String(formData.get("project_id") || "") || null,
    target_worker_id: String(formData.get("target_worker_id") || "") || null,
    target_name: String(formData.get("target_name") || "").trim() || null,
    stars,
    comment: String(formData.get("comment") || "").trim() || null,
  });
  revalidatePath("/worker/rate");
}

// ============ Availability ============
export async function setAvailability(formData: FormData) {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const supabase = await getSupabaseServer();
  const weekStart = String(formData.get("week_start") || "");
  if (!weekStart) throw new Error("Semana obrigatória");
  for (let dow = 0; dow < 7; dow++) {
    const morning = formData.get(`d${dow}_morning`) === "on";
    const afternoon = formData.get(`d${dow}_afternoon`) === "on";
    const evening = formData.get(`d${dow}_evening`) === "on";
    await supabase
      .from("worker_availability")
      .upsert(
        {
          worker_id: worker.id,
          week_start: weekStart,
          day_of_week: dow,
          morning,
          afternoon,
          evening,
        },
        { onConflict: "worker_id,week_start,day_of_week" },
      );
  }
  revalidatePath("/worker/availability");
}

// ============ E-signatures ============
export async function signDocument(formData: FormData) {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const document = String(formData.get("document") || "");
  if (!["ppe", "terms"].includes(document)) throw new Error("Documento inválido");
  if (formData.get("agreed") !== "1") throw new Error("Você precisa marcar que leu e aceitou");
  const supabase = await getSupabaseServer();
  await supabase
    .from("worker_signatures")
    .upsert(
      {
        worker_id: worker.id,
        document,
        version: "v1",
      },
      { onConflict: "worker_id,document,version" },
    );
  revalidatePath("/worker/sign");
  revalidatePath("/worker");
}

// ============ Time off requests ============
export async function requestTimeOff(formData: FormData) {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const start = String(formData.get("start_date") || "");
  const end = String(formData.get("end_date") || "");
  const kind = String(formData.get("kind") || "unpaid");
  if (!start || !end) throw new Error("Datas obrigatórias");
  if (new Date(end) < new Date(start)) throw new Error("End date < start date");
  const supabase = await getSupabaseServer();
  await supabase.from("time_off_requests").insert({
    worker_id: worker.id,
    start_date: start,
    end_date: end,
    kind,
    reason: String(formData.get("reason") || "").trim() || null,
  });
  revalidatePath("/worker/time-off");
}

export async function cancelTimeOff(formData: FormData) {
  const id = String(formData.get("id"));
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const supabase = await getSupabaseServer();
  await supabase
    .from("time_off_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("worker_id", worker.id);
  revalidatePath("/worker/time-off");
}
