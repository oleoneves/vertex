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
    zelle_full_name: String(formData.get("zelle_full_name") || "").trim() || null,
    ssn: String(formData.get("ssn") || "").trim() || null,
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

// ============ Documents ============

export async function reviewDocument(formData: FormData) {
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision"));
  if (!["approved", "rejected"].includes(decision)) {
    throw new Error(`reviewDocument: invalid decision "${decision}"`);
  }
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("reviewDocument: not signed in");
  const { error, count } = await supabase
    .from("documents")
    .update(
      {
        status: decision,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      },
      { count: "exact" },
    )
    .eq("id", id);
  if (error) throw new Error(`reviewDocument: ${error.message}`);
  if (count === 0) {
    throw new Error(
      "reviewDocument: no row updated (check that you're in admin_users — RLS denied silently)",
    );
  }
  revalidatePath("/admin/documents");
}

export async function deleteDocument(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  const { data: doc, error: readErr } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(`deleteDocument: ${readErr.message}`);
  if (doc?.storage_path) {
    const { error: storageErr } = await supabase.storage
      .from("documents")
      .remove([doc.storage_path]);
    if (storageErr) throw new Error(`deleteDocument: storage ${storageErr.message}`);
  }
  const { error: delErr, count } = await supabase
    .from("documents")
    .delete({ count: "exact" })
    .eq("id", id);
  if (delErr) throw new Error(`deleteDocument: ${delErr.message}`);
  if (count === 0) {
    throw new Error(
      "deleteDocument: no row deleted (check that you're in admin_users — RLS denied silently)",
    );
  }
  revalidatePath("/admin/documents");
}

// ============ Job edit ============

export async function updateJob(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  const title = String(formData.get("title") || "").trim();
  const slug =
    String(formData.get("slug") || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const payload = {
    slug,
    title,
    employer: String(formData.get("employer") || ""),
    category: String(formData.get("category") || "other"),
    employment_type: String(formData.get("employment_type") || "full_time"),
    location_city: String(formData.get("location_city") || ""),
    location_state: String(formData.get("location_state") || "").toUpperCase().slice(0, 2),
    hourly_rate_min: Number(formData.get("hourly_rate_min")) || null,
    hourly_rate_max: Number(formData.get("hourly_rate_max")) || null,
    description: String(formData.get("description") || ""),
    requirements: String(formData.get("requirements") || "") || null,
    benefits: String(formData.get("benefits") || "") || null,
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  };
  const { error } = await supabase.from("jobs").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/admin/jobs");
}

export async function updateEmployerRates(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  const payload = {
    hourly_bill_rate: Number(formData.get("hourly_bill_rate")) || null,
    hourly_pay_rate: Number(formData.get("hourly_pay_rate")) || null,
    per_diem_rate: Number(formData.get("per_diem_rate")) || null,
    per_diem_cost: Number(formData.get("per_diem_cost")) || null,
    travel_time_rate: Number(formData.get("travel_time_rate")) || null,
    travel_time_cost: Number(formData.get("travel_time_cost")) || null,
    bill_rate_multiplier: Number(formData.get("bill_rate_multiplier")) || 1.5,
    payment_terms_days: Number(formData.get("payment_terms_days")) || 15,
  };
  const { error } = await supabase.from("employers").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/employers/${id}`);
}

export async function addEmployerContact(formData: FormData) {
  const employer_id = String(formData.get("employer_id"));
  const supabase = await getSupabaseServer();
  const payload = {
    employer_id,
    position: String(formData.get("position") || "other"),
    full_name: String(formData.get("full_name") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };
  if (!payload.full_name) throw new Error("Full name is required");
  const { error } = await supabase.from("employer_contacts").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/employers/${employer_id}`);
}

export async function deleteEmployerContact(formData: FormData) {
  const id = String(formData.get("id"));
  const employer_id = String(formData.get("employer_id"));
  const supabase = await getSupabaseServer();
  await supabase.from("employer_contacts").delete().eq("id", id);
  revalidatePath(`/admin/employers/${employer_id}`);
}

// ============ Invoices (editable) ============

export async function updateInvoiceMeta(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  const payload = {
    period_start: String(formData.get("period_start") || ""),
    period_end: String(formData.get("period_end") || ""),
    due_date: String(formData.get("due_date") || "") || null,
    tax: Number(formData.get("tax")) || 0,
    notes: String(formData.get("notes") || "") || null,
  };
  if (!payload.period_start || !payload.period_end) {
    throw new Error("Period start and end are required");
  }
  const { error } = await supabase.from("invoices").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  await recomputeInvoiceTotal(id);
  revalidatePath(`/admin/invoices/${id}`);
}

export async function updateInvoiceLine(formData: FormData) {
  const id = String(formData.get("id"));
  const invoice_id = String(formData.get("invoice_id"));
  const supabase = await getSupabaseServer();
  const hours = Number(formData.get("hours")) || 0;
  const rate = Number(formData.get("rate")) || 0;
  const amountInput = formData.get("amount");
  const amount =
    amountInput !== null && amountInput !== ""
      ? Number(amountInput) || 0
      : Number((hours * rate).toFixed(2));
  const payload = {
    description: String(formData.get("description") || ""),
    hours,
    rate,
    amount,
    unit: String(formData.get("unit") || "") || null,
  };
  const { error } = await supabase
    .from("invoice_line_items")
    .update(payload)
    .eq("id", id);
  if (error) throw new Error(error.message);
  await recomputeInvoiceTotal(invoice_id);
  revalidatePath(`/admin/invoices/${invoice_id}`);
}

export async function addInvoiceLine(formData: FormData) {
  const invoice_id = String(formData.get("invoice_id"));
  const supabase = await getSupabaseServer();
  const hours = Number(formData.get("hours")) || 0;
  const rate = Number(formData.get("rate")) || 0;
  const amountInput = formData.get("amount");
  const amount =
    amountInput !== null && amountInput !== ""
      ? Number(amountInput) || 0
      : Number((hours * rate).toFixed(2));
  const kindRaw = String(formData.get("kind") || "labor");
  const allowedKinds = ["labor", "per_diem", "travel", "hotel", "other"] as const;
  const kind = (allowedKinds as readonly string[]).includes(kindRaw)
    ? kindRaw
    : "other";
  const payload = {
    invoice_id,
    kind,
    description: String(formData.get("description") || ""),
    hours,
    rate,
    amount,
    unit: String(formData.get("unit") || "") || null,
    worker_id: null,
    placement_id: null,
  };
  const { error } = await supabase.from("invoice_line_items").insert(payload);
  if (error) throw new Error(error.message);
  await recomputeInvoiceTotal(invoice_id);
  revalidatePath(`/admin/invoices/${invoice_id}`);
}

export async function deleteInvoiceLine(formData: FormData) {
  const id = String(formData.get("id"));
  const invoice_id = String(formData.get("invoice_id"));
  const supabase = await getSupabaseServer();
  await supabase.from("invoice_line_items").delete().eq("id", id);
  await recomputeInvoiceTotal(invoice_id);
  revalidatePath(`/admin/invoices/${invoice_id}`);
}

async function recomputeInvoiceTotal(invoiceId: string) {
  const supabase = await getSupabaseServer();
  const { data: lines } = await supabase
    .from("invoice_line_items")
    .select("amount")
    .eq("invoice_id", invoiceId);
  const subtotal = (lines ?? []).reduce(
    (s: number, l: { amount: number | string }) => s + Number(l.amount ?? 0),
    0,
  );
  const { data: inv } = await supabase
    .from("invoices")
    .select("tax")
    .eq("id", invoiceId)
    .single();
  const tax = Number(inv?.tax ?? 0);
  const total = subtotal + tax;
  await supabase
    .from("invoices")
    .update({
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(total.toFixed(2)),
    })
    .eq("id", invoiceId);
}

// ============ Projects ============

export async function updateProjectEstimate(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  const payload = {
    estimate_people: Number(formData.get("estimate_people")) || null,
    estimate_hours_per_day: Number(formData.get("estimate_hours_per_day")) || null,
    estimate_travel_hours_per_person:
      Number(formData.get("estimate_travel_hours_per_person")) || null,
    budget_hours: Number(formData.get("budget_hours")) || null,
    start_date: String(formData.get("start_date") || "") || null,
    end_date: String(formData.get("end_date") || "") || null,
  };
  const { error } = await supabase.from("projects").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${id}`);
}

export async function addManualTimeEntry(formData: FormData) {
  const placement_id = String(formData.get("placement_id"));
  const project_id = String(formData.get("project_id") || "");
  const date = String(formData.get("date") || "");
  const hours = Number(formData.get("hours")) || 0;
  if (!placement_id || !date || hours <= 0) {
    throw new Error("Placement, date and hours are required");
  }
  const supabase = await getSupabaseServer();
  const { data: p, error: pErr } = await supabase
    .from("placements")
    .select("worker_id, pay_rate, bill_rate")
    .eq("id", placement_id)
    .single();
  if (pErr || !p) throw new Error("Placement not found");
  const clockIn = new Date(`${date}T08:00:00`);
  const clockOut = new Date(clockIn.getTime() + hours * 3600 * 1000);
  const { error } = await supabase.from("time_entries").insert({
    placement_id,
    worker_id: p.worker_id,
    clock_in_at: clockIn.toISOString(),
    clock_out_at: clockOut.toISOString(),
    pay_rate_at_entry: p.pay_rate,
    bill_rate_at_entry: p.bill_rate,
    approved: true,
    approved_at: new Date().toISOString(),
    notes: "Manual entry — offline project",
  });
  if (error) throw new Error(error.message);
  if (project_id) revalidatePath(`/admin/projects/${project_id}`);
  revalidatePath("/admin/timesheet");
}

export async function updateTimeEntry(formData: FormData) {
  const id = String(formData.get("id"));
  const employer_id = String(formData.get("employer_id") || "");
  const week = String(formData.get("week") || "");
  const dateStr = String(formData.get("date") || "");
  const clockInRaw = String(formData.get("clock_in") || "");
  const clockOutRaw = String(formData.get("clock_out") || "");
  const breakMinutes = Number(formData.get("break_minutes")) || 0;
  if (!id || !dateStr) throw new Error("id and date are required");
  const clockIn = clockInRaw
    ? new Date(`${dateStr}T${clockInRaw}:00`).toISOString()
    : null;
  const clockOut = clockOutRaw
    ? new Date(`${dateStr}T${clockOutRaw}:00`).toISOString()
    : null;
  const supabase = await getSupabaseServer();
  const payload: Record<string, unknown> = { break_minutes: breakMinutes };
  if (clockIn) payload.clock_in_at = clockIn;
  if (clockOut) payload.clock_out_at = clockOut;
  const { error } = await supabase.from("time_entries").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  if (employer_id) {
    revalidatePath(`/admin/employers/${employer_id}/weekly`);
    if (week) revalidatePath(`/admin/employers/${employer_id}/weekly?week=${week}`);
  }
}

export async function deleteTimeEntry(formData: FormData) {
  const id = String(formData.get("id"));
  const employer_id = String(formData.get("employer_id") || "");
  const supabase = await getSupabaseServer();
  await supabase.from("time_entries").delete().eq("id", id);
  if (employer_id) revalidatePath(`/admin/employers/${employer_id}/weekly`);
}
