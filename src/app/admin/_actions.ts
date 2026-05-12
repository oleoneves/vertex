"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function inviteWorkerByEmail(email: string, workerId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, reason: "service role not set" };
  try {
    const admin = getSupabaseAdmin();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: siteUrl ? `${siteUrl}/worker` : undefined,
      data: { role: "worker" },
    });
    if (error) {
      // If user already exists, link them up instead of failing
      if (error.message?.toLowerCase().includes("already") || error.status === 422) {
        const { data: existing } = await admin.auth.admin.listUsers();
        const found = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (found) {
          await admin.from("workers").update({ user_id: found.id }).eq("id", workerId);
          return { ok: true, linked: true };
        }
      }
      console.warn("[invite] failed", error);
      return { ok: false, reason: error.message };
    }
    if (data?.user) {
      await admin.from("workers").update({ user_id: data.user.id }).eq("id", workerId);
    }
    return { ok: true };
  } catch (e) {
    console.warn("[invite] exception", e);
    return { ok: false, reason: e instanceof Error ? e.message : "unknown" };
  }
}

// ============ Applications ============

export async function hireApplicant(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();

  const { data: app } = await supabase
    .from("applications")
    .select("id, candidate:candidates(id, full_name, email, phone)")
    .eq("id", id)
    .maybeSingle();

  type App = { id: string; candidate: { id: string; full_name: string; email: string; phone: string | null } | null };
  const a = app as unknown as App | null;
  if (!a?.candidate) throw new Error("Application or candidate not found");

  // Insert worker (no-op if already linked to this candidate)
  const { data: existing } = await supabase
    .from("workers")
    .select("id")
    .eq("candidate_id", a.candidate.id)
    .maybeSingle();

  let workerId = existing?.id;
  if (!workerId) {
    const { data: created, error } = await supabase
      .from("workers")
      .insert({
        candidate_id: a.candidate.id,
        full_name: a.candidate.full_name,
        email: a.candidate.email,
        phone: a.candidate.phone,
        status: "onboarding",
        pay_type: "hourly",
        default_pay_rate: 15,
        payment_method: "check",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    workerId = created.id;
  }

  // Fire-and-forget invite (don't fail the hire if email service unavailable)
  if (a.candidate.email && workerId) {
    await inviteWorkerByEmail(a.candidate.email, workerId);
  }

  await supabase.from("applications").update({ status: "accepted" }).eq("id", id);
  revalidatePath("/admin/applications");
  revalidatePath("/admin/workers");
}

export async function resendWorkerInvite(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  const { data: worker } = await supabase
    .from("workers")
    .select("email")
    .eq("id", id)
    .maybeSingle();
  if (!worker?.email) throw new Error("Worker has no email");
  const result = await inviteWorkerByEmail(worker.email, id);
  if (!result.ok) throw new Error(result.reason ?? "Failed to send invite");
  revalidatePath(`/admin/workers/${id}`);
}

export async function rejectApplicant(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  await supabase.from("applications").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/admin/applications");
}

export async function reopenApplicant(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  await supabase.from("applications").update({ status: "reviewing" }).eq("id", id);
  revalidatePath("/admin/applications");
}

// ============ Workers ============

export async function updateWorker(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  const payload = {
    full_name: String(formData.get("full_name") || ""),
    employee_code: String(formData.get("employee_code") || "") || null,
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    status: String(formData.get("status") || "active"),
    default_pay_rate: Number(formData.get("default_pay_rate")) || null,
    payment_method: String(formData.get("payment_method") || "check"),
    notes: String(formData.get("notes") || "") || null,
  };
  const { error } = await supabase.from("workers").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/workers/${id}`);
  revalidatePath("/admin/workers");
}

export async function setWorkerStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = await getSupabaseServer();
  await supabase.from("workers").update({ status }).eq("id", id);
  revalidatePath(`/admin/workers/${id}`);
  revalidatePath("/admin/workers");
}

// ============ Placements ============

export async function endPlacement(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  await supabase
    .from("placements")
    .update({ status: "ended", end_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  revalidatePath("/admin/placements");
}

// ============ Shifts ============

export async function cancelShift(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  await supabase.from("shifts").update({ status: "cancelled" }).eq("id", id);
  revalidatePath("/admin/shifts");
}

export async function bulkScheduleShifts(formData: FormData) {
  const placementIds = formData.getAll("placement_ids").map(String).filter(Boolean);
  const startDate = String(formData.get("start_date"));
  const endDate = String(formData.get("end_date"));
  const startTime = String(formData.get("start_time") || "07:00");
  const endTime = String(formData.get("end_time") || "15:00");
  const weekdaysOnly = formData.get("weekdays_only") === "on";
  const location = String(formData.get("location") || "") || null;
  if (placementIds.length === 0) throw new Error("Select at least one placement");
  if (!startDate || !endDate) throw new Error("Pick a date range");

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) throw new Error("End date is before start date");

  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (weekdaysOnly && (dow === 0 || dow === 6)) continue;
    days.push(d.toISOString().slice(0, 10));
  }
  if (days.length === 0) throw new Error("No working days in the selected range");

  const rows: Array<Record<string, unknown>> = [];
  for (const pid of placementIds) {
    for (const day of days) {
      rows.push({
        placement_id: pid,
        scheduled_start: `${day}T${startTime}:00`,
        scheduled_end: `${day}T${endTime}:00`,
        status: "scheduled",
        location,
      });
    }
  }

  const supabase = await getSupabaseServer();
  // Chunk inserts to avoid request size limits (2,200 rows in one go is fine but
  // batch at 1000 to be safe across PostgREST).
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("shifts").insert(slice);
    if (error) throw new Error(`Insert failed at row ${i}: ${error.message}`);
  }

  revalidatePath("/admin/shifts");
  redirect(`/admin/shifts?bulk=${rows.length}`);
}

// ============ Jobs ============

export async function setJobActive(formData: FormData) {
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  const supabase = await getSupabaseServer();
  await supabase.from("jobs").update({ active }).eq("id", id);
  revalidatePath("/admin/jobs");
}

export async function deleteJob(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  await supabase.from("jobs").delete().eq("id", id);
  revalidatePath("/admin/jobs");
  redirect("/admin/jobs");
}
