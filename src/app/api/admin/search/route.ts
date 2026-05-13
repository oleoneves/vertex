import { NextResponse } from "next/server";
import { listWorkers, listEmployers, listInvoices } from "@/lib/workforce";
import { listProjects } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type SearchResult = {
  type: "worker" | "employer" | "project" | "invoice";
  id: string;
  href: string;
  primary: string;
  secondary: string | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json({ results: [] as SearchResult[] });

  const [workers, employers, projects, invoices] = await Promise.all([
    listWorkers(),
    listEmployers(),
    listProjects(),
    listInvoices(),
  ]);

  const results: SearchResult[] = [];

  for (const w of workers) {
    const blob = `${w.full_name} ${w.employee_code ?? ""} ${w.email ?? ""}`.toLowerCase();
    if (blob.includes(q)) {
      results.push({
        type: "worker",
        id: w.id,
        href: `/admin/workers/${w.id}`,
        primary: w.full_name,
        secondary: [w.employee_code, w.email].filter(Boolean).join(" · ") || null,
      });
      if (results.length >= 50) break;
    }
  }

  for (const e of employers) {
    const blob = `${e.name} ${e.contact_name ?? ""} ${e.billing_email ?? ""}`.toLowerCase();
    if (blob.includes(q)) {
      results.push({
        type: "employer",
        id: e.id,
        href: `/admin/employers/${e.id}`,
        primary: e.name,
        secondary: e.contact_name,
      });
    }
  }

  for (const p of projects) {
    const blob = `${p.name} ${p.employer?.name ?? ""} ${p.location ?? ""}`.toLowerCase();
    if (blob.includes(q)) {
      results.push({
        type: "project",
        id: p.id,
        href: `/admin/projects/${p.id}`,
        primary: p.name,
        secondary: `${p.employer?.name ?? "—"} · ${p.location ?? ""}`,
      });
    }
  }

  for (const i of invoices) {
    const blob = `${i.invoice_number} ${i.employer?.name ?? ""}`.toLowerCase();
    if (blob.includes(q)) {
      results.push({
        type: "invoice",
        id: i.id,
        href: `/admin/invoices/${i.id}`,
        primary: i.invoice_number,
        secondary: `${i.employer?.name ?? "—"} · $${Number(i.total).toFixed(0)} · ${i.status}`,
      });
    }
  }

  return NextResponse.json({ results: results.slice(0, 80) });
}
