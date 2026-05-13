import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, MapPin } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Employer, Placement, Invoice, Payment } from "@/types/db";
import { PageHeader } from "../../_components/page-header";
import { StatusPill } from "../../_components/data-table";

import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
export const dynamic = "force-dynamic";

export default async function EmployerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    notFound();
  }

  const supabase = await getSupabaseServer();
  const [employerRes, placementsRes, invoicesRes, paymentsRes, hoursRes] =
    await Promise.all([
      supabase.from("employers").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("placements")
        .select("*, worker:workers(full_name, employee_code)")
        .eq("employer_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("*")
        .eq("employer_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*, invoice:invoices(invoice_number, employer_id)")
        .order("occurred_at", { ascending: false })
        .limit(50),
      supabase
        .from("time_entries")
        .select(
          "hours_worked, pay_rate_at_entry, bill_rate_at_entry, approved, placement:placements!inner(employer_id)",
        )
        .eq("placement.employer_id", id)
        .limit(5000),
    ]);

  const employer = employerRes.data as Employer | null;
  if (!employer) notFound();

  const placements =
    (placementsRes.data as unknown as (Placement & {
      worker: { full_name: string; employee_code: string | null } | null;
    })[]) ?? [];
  const invoices = (invoicesRes.data as Invoice[]) ?? [];
  const allPayments =
    (paymentsRes.data as unknown as (Payment & {
      invoice: { invoice_number: string; employer_id: string } | null;
    })[]) ?? [];
  const employerPayments = allPayments.filter(
    (p) => p.direction === "in" && p.invoice?.employer_id === id,
  );

  type EntryRow = {
    hours_worked: number | null;
    pay_rate_at_entry: number | null;
    bill_rate_at_entry: number | null;
    approved: boolean;
  };
  const entries = (hoursRes.data as unknown as EntryRow[]) ?? [];

  const totals = entries.reduce(
    (acc, e) => {
      const hrs = Number(e.hours_worked) || 0;
      if (e.approved) {
        acc.hours += hrs;
        acc.cost += hrs * (Number(e.pay_rate_at_entry) || 0);
        acc.revenue += hrs * (Number(e.bill_rate_at_entry) || 0);
      }
      return acc;
    },
    { hours: 0, cost: 0, revenue: 0 },
  );
  const margin = totals.revenue - totals.cost;
  const paid = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.total), 0);
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((a, i) => a + Number(i.total), 0);
  const active = placements.filter((p) => p.status === "active").length;

  return (
    <div>
      <Link
        href="/admin/employers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Employers
      </Link>

      <PageHeader title={employer.name} subtitle={`Net ${employer.payment_terms_days} · ${employer.bill_rate_multiplier}× bill multiplier`}>
        <Link
          href="/admin/placements/new"
          className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-bold text-accent-foreground hover:opacity-90"
        >
          + Placement
        </Link>
        <Link
          href={`/admin/invoices/new?employer_id=${employer.id}`}
          className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          + Invoice
        </Link>
      </PageHeader>

      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Active placements" value={String(active)} />
        <Kpi label="Total hours" value={fmtNum(totals.hours, { decimals: 0 })} unit="hrs" />
        <Kpi label="Revenue (all time)" value={fmtUsd(totals.revenue)} accent />
        <Kpi label="Margin (all time)" value={fmtUsd(margin)} />
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid invoices</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-green-700 dark:text-green-400">
            {fmtUsd(paid)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-accent/10 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{fmtUsd(outstanding)}</p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Contact / billing */}
        <aside className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Contact
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-baseline gap-2">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{employer.contact_name ?? "—"}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <a
                href={`mailto:${employer.billing_email}`}
                className="text-accent hover:underline"
              >
                {employer.billing_email ?? "—"}
              </a>
            </div>
            <div className="flex items-baseline gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="whitespace-pre-line text-muted-foreground">
                {employer.billing_address ?? "—"}
              </span>
            </div>
          </dl>
          {employer.notes && (
            <p className="mt-4 whitespace-pre-line border-t border-border pt-3 text-sm text-muted-foreground">
              {employer.notes}
            </p>
          )}
        </aside>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Placements ({placements.length})
            </h2>
            {placements.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No placements yet.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {placements.slice(0, 8).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-baseline justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/workers/${p.worker_id}`}
                        className="font-medium hover:text-accent"
                      >
                        {p.worker?.full_name ?? "—"}
                      </Link>
                      <div className="text-xs text-muted-foreground">{p.role_title}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs tabular-nums">
                        {fmtUsd(p.pay_rate)} / {fmtUsd(p.bill_rate)}
                      </div>
                      <StatusPill
                        status={p.status}
                        variant={
                          p.status === "active"
                            ? "green"
                            : p.status === "paused"
                            ? "amber"
                            : "muted"
                        }
                      />
                    </div>
                  </li>
                ))}
                {placements.length > 8 && (
                  <li className="px-3 py-2 text-xs text-muted-foreground">
                    + {placements.length - 8} more…
                  </li>
                )}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Invoices ({invoices.length})
            </h2>
            {invoices.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {invoices.slice(0, 8).map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/admin/invoices/${i.id}`}
                      className="flex items-baseline justify-between gap-3 rounded-md border border-border/60 px-3 py-2 hover:border-foreground/30"
                    >
                      <div>
                        <div className="font-mono text-xs">{i.invoice_number}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {i.period_start} → {i.period_end}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono tabular-nums font-medium">
                          {fmtUsd(i.total)}
                        </div>
                        <StatusPill
                          status={i.status}
                          variant={
                            i.status === "paid"
                              ? "green"
                              : i.status === "overdue"
                              ? "red"
                              : i.status === "sent"
                              ? "blue"
                              : i.status === "void"
                              ? "muted"
                              : "amber"
                          }
                        />
                      </div>
                    </Link>
                  </li>
                ))}
                {invoices.length > 8 && (
                  <li className="px-3 py-2 text-xs text-muted-foreground">
                    + {invoices.length - 8} more…
                  </li>
                )}
              </ul>
            )}
          </section>

          {employerPayments.length > 0 && (
            <section className="rounded-xl border border-border bg-background p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recent payments received ({employerPayments.length})
              </h2>
              <ul className="mt-4 divide-y divide-border/60 text-sm">
                {employerPayments.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between gap-3 py-2">
                    <div>
                      <div className="text-xs">{p.invoice?.invoice_number ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(p.occurred_at).toLocaleDateString()} · {p.method}
                      </div>
                    </div>
                    <span className="font-mono tabular-nums font-medium">
                      {fmtUsd(p.amount, { decimals: 2 })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border p-4 ${
        accent ? "bg-accent/10" : "bg-background"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
