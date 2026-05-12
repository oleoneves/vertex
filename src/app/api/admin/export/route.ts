import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const head = headers.join(",");
  const body = rows
    .map((r) => headers.map((h) => csvEscape(r[h])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "timesheet";

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return new NextResponse("Supabase not configured", { status: 503 });
  }

  const supabase = await getSupabaseServer();
  // RLS will enforce admin-only — anyone else gets empty results.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let csv = "";
  let filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  if (type === "timesheet") {
    const { data } = await supabase
      .from("time_entries")
      .select(
        "id, clock_in_at, clock_out_at, hours_worked, pay_rate_at_entry, bill_rate_at_entry, approved, worker:workers(full_name, employee_code), placement:placements(role_title, employer:employers(name))",
      )
      .order("clock_in_at", { ascending: false })
      .limit(10000);
    type Row = {
      id: string;
      clock_in_at: string;
      clock_out_at: string | null;
      hours_worked: number | null;
      pay_rate_at_entry: number | null;
      bill_rate_at_entry: number | null;
      approved: boolean;
      worker: { full_name: string; employee_code: string | null } | null;
      placement: {
        role_title: string;
        employer: { name: string } | null;
      } | null;
    };
    const rows = ((data as unknown as Row[]) ?? []).map((e) => {
      const hrs = Number(e.hours_worked) || 0;
      const pay = Number(e.pay_rate_at_entry) || 0;
      const bill = Number(e.bill_rate_at_entry) || 0;
      return {
        date: new Date(e.clock_in_at).toISOString().slice(0, 10),
        worker_code: e.worker?.employee_code ?? "",
        worker: e.worker?.full_name ?? "",
        employer: e.placement?.employer?.name ?? "",
        role: e.placement?.role_title ?? "",
        clock_in: new Date(e.clock_in_at).toISOString(),
        clock_out: e.clock_out_at ? new Date(e.clock_out_at).toISOString() : "",
        hours: hrs.toFixed(2),
        pay_rate: pay.toFixed(2),
        bill_rate: bill.toFixed(2),
        pay_total: (hrs * pay).toFixed(2),
        bill_total: (hrs * bill).toFixed(2),
        margin: (hrs * (bill - pay)).toFixed(2),
        approved: e.approved ? "yes" : "no",
      };
    });
    csv = rowsToCsv(
      [
        "date",
        "worker_code",
        "worker",
        "employer",
        "role",
        "clock_in",
        "clock_out",
        "hours",
        "pay_rate",
        "bill_rate",
        "pay_total",
        "bill_total",
        "margin",
        "approved",
      ],
      rows,
    );
  } else if (type === "invoices") {
    const { data } = await supabase
      .from("invoices")
      .select(
        "invoice_number, status, period_start, period_end, subtotal, tax, total, due_date, sent_at, paid_at, employer:employers(name)",
      )
      .order("created_at", { ascending: false })
      .limit(10000);
    type Row = {
      invoice_number: string;
      status: string;
      period_start: string;
      period_end: string;
      subtotal: number;
      tax: number;
      total: number;
      due_date: string | null;
      sent_at: string | null;
      paid_at: string | null;
      employer: { name: string } | null;
    };
    const rows = ((data as unknown as Row[]) ?? []).map((i) => ({
      invoice_number: i.invoice_number,
      employer: i.employer?.name ?? "",
      status: i.status,
      period_start: i.period_start,
      period_end: i.period_end,
      subtotal: Number(i.subtotal).toFixed(2),
      tax: Number(i.tax).toFixed(2),
      total: Number(i.total).toFixed(2),
      due_date: i.due_date ?? "",
      sent_at: i.sent_at ?? "",
      paid_at: i.paid_at ?? "",
    }));
    csv = rowsToCsv(
      [
        "invoice_number",
        "employer",
        "status",
        "period_start",
        "period_end",
        "subtotal",
        "tax",
        "total",
        "due_date",
        "sent_at",
        "paid_at",
      ],
      rows,
    );
  } else if (type === "payments") {
    const { data } = await supabase
      .from("payments")
      .select(
        "direction, amount, method, reference, occurred_at, invoice:invoices(invoice_number), worker:workers(full_name)",
      )
      .order("occurred_at", { ascending: false })
      .limit(10000);
    type Row = {
      direction: "in" | "out";
      amount: number;
      method: string;
      reference: string | null;
      occurred_at: string;
      invoice: { invoice_number: string } | null;
      worker: { full_name: string } | null;
    };
    const rows = ((data as unknown as Row[]) ?? []).map((p) => ({
      occurred_at: p.occurred_at.slice(0, 10),
      direction: p.direction,
      counterparty: p.direction === "in" ? p.invoice?.invoice_number ?? "" : p.worker?.full_name ?? "",
      amount: Number(p.amount).toFixed(2),
      method: p.method,
      reference: p.reference ?? "",
    }));
    csv = rowsToCsv(["occurred_at", "direction", "counterparty", "amount", "method", "reference"], rows);
  } else {
    return new NextResponse("Unknown export type", { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
