import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

// Runs daily. Finds projects whose end_date was yesterday and generates a
// DRAFT invoice from approved time entries. Super admin must review and send.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new NextResponse("Supabase not configured", { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select("id, name, employer_id, start_date, end_date")
    .eq("end_date", yesterday);
  if (projErr) {
    return NextResponse.json(
      { ok: false, stage: "list_projects", error: projErr.message },
      { status: 500 },
    );
  }

  const generated: { project: string; invoice: string }[] = [];
  const skipped: { project: string; reason: string }[] = [];

  for (const p of projects ?? []) {
    if (!p.employer_id || !p.start_date || !p.end_date) {
      skipped.push({ project: p.name, reason: "missing employer or dates" });
      continue;
    }

    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("employer_id", p.employer_id)
      .eq("period_start", p.start_date)
      .eq("period_end", p.end_date)
      .maybeSingle();
    if (existing) {
      skipped.push({ project: p.name, reason: "invoice already exists" });
      continue;
    }

    const { data: employer } = await supabase
      .from("employers")
      .select("payment_terms_days, hourly_bill_rate")
      .eq("id", p.employer_id)
      .single();

    const { data: placements } = await supabase
      .from("placements")
      .select("id")
      .eq("project_id", p.id);
    const placementIds = (placements ?? []).map((r) => r.id);
    if (placementIds.length === 0) {
      skipped.push({ project: p.name, reason: "no placements" });
      continue;
    }

    const { data: entries } = await supabase
      .from("time_entries")
      .select(
        "worker_id, placement_id, hours_worked, bill_rate_at_entry",
      )
      .in("placement_id", placementIds)
      .eq("approved", true)
      .gte("clock_in_at", `${p.start_date}T00:00:00`)
      .lte("clock_in_at", `${p.end_date}T23:59:59`);

    const rows = entries ?? [];
    if (rows.length === 0) {
      skipped.push({ project: p.name, reason: "no approved entries" });
      continue;
    }

    type Agg = { hours: number; rate: number; amount: number; placement_id: string };
    const byWorker = new Map<string, Agg>();
    for (const e of rows) {
      const h = Number(e.hours_worked ?? 0);
      const rate =
        Number(e.bill_rate_at_entry ?? 0) ||
        Number(employer?.hourly_bill_rate ?? 0);
      const agg = byWorker.get(e.worker_id) ?? {
        hours: 0,
        rate,
        amount: 0,
        placement_id: e.placement_id,
      };
      agg.hours += h;
      agg.amount += h * rate;
      agg.rate = Math.max(agg.rate, rate);
      byWorker.set(e.worker_id, agg);
    }
    const subtotal = [...byWorker.values()].reduce((s, a) => s + a.amount, 0);
    if (subtotal <= 0) {
      skipped.push({ project: p.name, reason: "subtotal is zero" });
      continue;
    }

    const dueDate = new Date(p.end_date);
    dueDate.setDate(dueDate.getDate() + (employer?.payment_terms_days ?? 15));

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        employer_id: p.employer_id,
        period_start: p.start_date,
        period_end: p.end_date,
        subtotal,
        tax: 0,
        total: subtotal,
        status: "draft",
        due_date: dueDate.toISOString().slice(0, 10),
        notes: `Auto-generated from project: ${p.name}. Awaiting super-admin review.`,
      })
      .select("id, invoice_number")
      .single();
    if (invErr || !inv) {
      skipped.push({ project: p.name, reason: `insert failed: ${invErr?.message}` });
      continue;
    }

    const lineRows = [...byWorker.entries()].map(([worker_id, a]) => ({
      invoice_id: inv.id,
      worker_id,
      placement_id: a.placement_id,
      description: `Labor — ${p.name}`,
      hours: Number(a.hours.toFixed(2)),
      rate: Number(a.rate.toFixed(2)),
      amount: Number(a.amount.toFixed(2)),
    }));
    await supabase.from("invoice_line_items").insert(lineRows);

    generated.push({ project: p.name, invoice: inv.invoice_number });
  }

  return NextResponse.json({
    ok: true,
    ran_at: new Date().toISOString(),
    for_date: yesterday,
    generated,
    skipped,
  });
}
