import "server-only";
import { isDemoMode, demoApplications, demoInvoices, demoTimeEntries, demoAllDocuments } from "./demo";
import { supabaseReady } from "./workforce";
import { getSupabaseServer } from "./supabase/server";

export type ActivityEvent = {
  type: "application" | "invoice" | "time" | "doc";
  label: string;
  href?: string;
  at: string;
};

export async function listRecentEvents(limit = 12): Promise<ActivityEvent[]> {
  if (isDemoMode()) {
    return demoRecentEvents(limit);
  }
  if (!supabaseReady()) return [];

  const supabase = await getSupabaseServer();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();

  const [appsRes, invRes, teRes, docsRes] = await Promise.all([
    supabase
      .from("applications")
      .select("id, created_at, candidate:candidates(full_name), job:jobs(title)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, paid_at, sent_at, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("time_entries")
      .select(
        "id, clock_in_at, clock_out_at, approved, worker:workers(full_name)",
      )
      .gte("clock_in_at", since)
      .order("clock_in_at", { ascending: false })
      .limit(8),
    supabase
      .from("documents")
      .select("id, type, status, uploaded_at, worker:workers(full_name)")
      .eq("status", "pending")
      .gte("uploaded_at", since)
      .order("uploaded_at", { ascending: false })
      .limit(8),
  ]);

  const out: ActivityEvent[] = [];

  for (const a of (appsRes.data as unknown as Array<{
    id: string;
    created_at: string;
    candidate: { full_name: string } | null;
    job: { title: string } | null;
  }>) ?? []) {
    out.push({
      type: "application",
      label: `${a.candidate?.full_name ?? "Someone"} applied to ${a.job?.title ?? "a job"}`,
      href: `/admin/applications?status=new`,
      at: a.created_at,
    });
  }

  for (const i of (invRes.data as unknown as Array<{
    id: string;
    invoice_number: string;
    total: number;
    status: string;
    paid_at: string | null;
    sent_at: string | null;
    created_at: string;
  }>) ?? []) {
    if (i.status === "paid" && i.paid_at) {
      out.push({
        type: "invoice",
        label: `Invoice ${i.invoice_number} paid — $${Number(i.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        href: `/admin/invoices/${i.id}`,
        at: i.paid_at,
      });
    } else if (i.status === "sent" && i.sent_at) {
      out.push({
        type: "invoice",
        label: `Invoice ${i.invoice_number} sent — $${Number(i.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        href: `/admin/invoices/${i.id}`,
        at: i.sent_at,
      });
    }
  }

  for (const t of (teRes.data as unknown as Array<{
    id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    approved: boolean;
    worker: { full_name: string } | null;
  }>) ?? []) {
    out.push({
      type: "time",
      label: t.clock_out_at
        ? `${t.worker?.full_name ?? "Worker"} clocked out`
        : `${t.worker?.full_name ?? "Worker"} clocked in`,
      href: `/admin/timesheet`,
      at: t.clock_out_at ?? t.clock_in_at,
    });
  }

  for (const d of (docsRes.data as unknown as Array<{
    id: string;
    type: string;
    uploaded_at: string;
    worker: { full_name: string } | null;
  }>) ?? []) {
    out.push({
      type: "doc",
      label: `${d.worker?.full_name ?? "Worker"} uploaded ${d.type.toUpperCase()} — needs review`,
      href: `/admin/documents`,
      at: d.uploaded_at,
    });
  }

  out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return out.slice(0, limit);
}

function demoRecentEvents(limit: number): ActivityEvent[] {
  const out: ActivityEvent[] = [];

  // Applications (recent 5)
  for (const a of demoApplications().slice(0, 5)) {
    out.push({
      type: "application",
      label: `${a.candidate?.full_name ?? "Someone"} applied to ${a.job?.title ?? "a job"}`,
      href: `/admin/applications?status=new`,
      at: a.created_at,
    });
  }

  // Invoices: paid + sent
  for (const i of demoInvoices()) {
    if (i.status === "paid" && i.paid_at) {
      out.push({
        type: "invoice",
        label: `Invoice ${i.invoice_number} paid — $${Number(i.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        href: `/admin/invoices/${i.id}`,
        at: i.paid_at,
      });
    } else if (i.status === "sent" && i.sent_at) {
      out.push({
        type: "invoice",
        label: `Invoice ${i.invoice_number} sent — $${Number(i.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        href: `/admin/invoices/${i.id}`,
        at: i.sent_at,
      });
    }
  }

  // Time entries (recent 4)
  for (const t of demoTimeEntries({ limit: 6 }).slice(0, 4)) {
    out.push({
      type: "time",
      label: t.clock_out_at
        ? `${t.worker?.full_name ?? "Worker"} clocked out`
        : `${t.worker?.full_name ?? "Worker"} clocked in`,
      href: `/admin/timesheet`,
      at: t.clock_out_at ?? t.clock_in_at,
    });
  }

  // Pending docs (top 2)
  for (const d of demoAllDocuments()
    .filter((x) => x.status === "pending")
    .slice(0, 2)) {
    out.push({
      type: "doc",
      label: `${(d as { worker?: { full_name?: string } }).worker?.full_name ?? "Worker"} uploaded ${d.type.toUpperCase()} — needs review`,
      href: `/admin/documents`,
      at: d.uploaded_at,
    });
  }

  out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return out.slice(0, limit);
}
