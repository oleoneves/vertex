import "server-only";
import { isDemoMode, demoApplications, demoInvoices, demoTimeEntries, demoAllDocuments } from "./demo";
import { supabaseReady } from "./workforce";
import { getSupabaseServer } from "./supabase/server";
import { t, type Locale } from "./i18n";

export type ActivityEvent = {
  type: "application" | "invoice" | "time" | "doc";
  label: string;
  href?: string;
  at: string;
};

export async function listRecentEvents(
  limit = 12,
  locale: Locale = "en",
): Promise<ActivityEvent[]> {
  if (isDemoMode()) {
    return demoRecentEvents(limit, locale);
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
      label: `${a.candidate?.full_name ?? t(locale, "a.bell.someone")} ${t(locale, "a.bell.applied_to")} ${a.job?.title ?? t(locale, "a.bell.a_job")}`,
      href: `/admin/applications?status=new`,
      at: a.created_at,
    });
  }

  const inv_label = (locale: Locale) => locale === "pt" ? "Fatura" : locale === "es" ? "Factura" : "Invoice";

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
        label: `${inv_label(locale)} ${i.invoice_number} ${t(locale, "a.bell.invoice_paid")} — $${Number(i.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        href: `/admin/invoices/${i.id}`,
        at: i.paid_at,
      });
    } else if (i.status === "sent" && i.sent_at) {
      out.push({
        type: "invoice",
        label: `${inv_label(locale)} ${i.invoice_number} ${t(locale, "a.bell.invoice_sent")} — $${Number(i.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        href: `/admin/invoices/${i.id}`,
        at: i.sent_at,
      });
    }
  }

  for (const te of (teRes.data as unknown as Array<{
    id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    approved: boolean;
    worker: { full_name: string } | null;
  }>) ?? []) {
    out.push({
      type: "time",
      label: te.clock_out_at
        ? `${te.worker?.full_name ?? t(locale, "a.bell.worker")} ${t(locale, "a.bell.clocked_out")}`
        : `${te.worker?.full_name ?? t(locale, "a.bell.worker")} ${t(locale, "a.bell.clocked_in")}`,
      href: `/admin/timesheet`,
      at: te.clock_out_at ?? te.clock_in_at,
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
      label: `${d.worker?.full_name ?? t(locale, "a.bell.worker")} ${t(locale, "a.bell.uploaded")} ${d.type.toUpperCase()} — ${t(locale, "a.bell.needs_review")}`,
      href: `/admin/documents`,
      at: d.uploaded_at,
    });
  }

  out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return out.slice(0, limit);
}

function demoRecentEvents(limit: number, locale: Locale): ActivityEvent[] {
  const out: ActivityEvent[] = [];
  const invLabel = locale === "pt" ? "Fatura" : locale === "es" ? "Factura" : "Invoice";

  // Applications (recent 5)
  for (const a of demoApplications().slice(0, 5)) {
    out.push({
      type: "application",
      label: `${a.candidate?.full_name ?? t(locale, "a.bell.someone")} ${t(locale, "a.bell.applied_to")} ${a.job?.title ?? t(locale, "a.bell.a_job")}`,
      href: `/admin/applications?status=new`,
      at: a.created_at,
    });
  }

  // Invoices: paid + sent
  for (const i of demoInvoices()) {
    if (i.status === "paid" && i.paid_at) {
      out.push({
        type: "invoice",
        label: `${invLabel} ${i.invoice_number} ${t(locale, "a.bell.invoice_paid")} — $${Number(i.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        href: `/admin/invoices/${i.id}`,
        at: i.paid_at,
      });
    } else if (i.status === "sent" && i.sent_at) {
      out.push({
        type: "invoice",
        label: `${invLabel} ${i.invoice_number} ${t(locale, "a.bell.invoice_sent")} — $${Number(i.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        href: `/admin/invoices/${i.id}`,
        at: i.sent_at,
      });
    }
  }

  // Time entries (recent 4)
  for (const te of demoTimeEntries({ limit: 6 }).slice(0, 4)) {
    out.push({
      type: "time",
      label: te.clock_out_at
        ? `${te.worker?.full_name ?? t(locale, "a.bell.worker")} ${t(locale, "a.bell.clocked_out")}`
        : `${te.worker?.full_name ?? t(locale, "a.bell.worker")} ${t(locale, "a.bell.clocked_in")}`,
      href: `/admin/timesheet`,
      at: te.clock_out_at ?? te.clock_in_at,
    });
  }

  // Pending docs (top 2)
  for (const d of demoAllDocuments()
    .filter((x) => x.status === "pending")
    .slice(0, 2)) {
    const worker = (d as { worker?: { full_name?: string } }).worker?.full_name ?? t(locale, "a.bell.worker");
    out.push({
      type: "doc",
      label: `${worker} ${t(locale, "a.bell.uploaded")} ${d.type.toUpperCase()} — ${t(locale, "a.bell.needs_review")}`,
      href: `/admin/documents`,
      at: d.uploaded_at,
    });
  }

  out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return out.slice(0, limit);
}
