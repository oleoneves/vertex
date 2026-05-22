import Link from "next/link";
import { Inbox, CheckCircle2, AlertTriangle, FileCheck2, Gift, MessageSquare, Receipt } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = await getSupabaseServer();
  const now = new Date().toISOString();

  const [pendingHrs, openIncidents, pendingReferrals, draftInvoices, offeredShifts, pendingTimesheetUploads] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id", { count: "exact", head: true })
      .eq("approved", false)
      .not("clock_out_at", "is", null),
    supabase
      .from("incident_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "reviewing"]),
    supabase
      .from("worker_referrals")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "contacted"]),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .in("status", ["offered", "scheduled"])
      .gte("scheduled_start", now),
    supabase
      .from("project_timesheets")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("kind", "timesheet"),
  ]);

  const cards = [
    {
      label: "Hours pending approval",
      count: pendingHrs.count ?? 0,
      href: "/admin/timesheet?status=pending",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "amber",
      cta: "Aprovar →",
    },
    {
      label: "Open incident reports",
      count: openIncidents.count ?? 0,
      href: "/admin/incidents?status=open",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "red",
      cta: "Revisar →",
    },
    {
      label: "Draft invoices awaiting review",
      count: draftInvoices.count ?? 0,
      href: "/admin/invoices?status=draft",
      icon: <Receipt className="h-5 w-5" />,
      color: "blue",
      cta: "Revisar e enviar →",
    },
    {
      label: "Shifts awaiting worker response",
      count: offeredShifts.count ?? 0,
      href: "/admin/placements",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "blue",
      cta: "Ver →",
    },
    {
      label: "Pending worker referrals",
      count: pendingReferrals.count ?? 0,
      href: "/admin/referrals",
      icon: <Gift className="h-5 w-5" />,
      color: "yellow",
      cta: "Triagem →",
    },
    {
      label: "Timesheet uploads pending review",
      count: pendingTimesheetUploads.count ?? 0,
      href: "/admin/projects",
      icon: <FileCheck2 className="h-5 w-5" />,
      color: "slate",
      cta: "Ver projetos →",
    },
  ];

  const totalPending = cards.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        subtitle="Tudo que precisa da sua atenção, num lugar só."
        count={totalPending}
      />

      {totalPending === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-green-500/40 bg-green-50/50 p-12 text-center dark:bg-green-900/20">
          <Inbox className="mx-auto h-12 w-12 text-green-600" />
          <p className="mt-4 text-lg font-bold">Tudo em dia! 🎉</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma ação pendente no momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards
            .filter((c) => c.count > 0)
            .map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition hover:opacity-95 ${
                  c.color === "red"
                    ? "border-red-400/50 bg-red-50/50 dark:bg-red-900/20"
                    : c.color === "amber" || c.color === "yellow"
                    ? "border-amber-400/50 bg-amber-50/50 dark:bg-amber-900/20"
                    : c.color === "blue"
                    ? "border-blue-400/50 bg-blue-50/50 dark:bg-blue-900/20"
                    : "border-border bg-muted/30"
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                    c.color === "red"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : c.color === "amber" || c.color === "yellow"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      : c.color === "blue"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-2xl font-extrabold tabular-nums">{c.count}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
                <span className="text-xs font-medium text-accent">{c.cta}</span>
              </Link>
            ))}
          {cards
            .filter((c) => c.count === 0)
            .map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4 opacity-60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-2xl font-extrabold tabular-nums text-muted-foreground">
                    0
                  </p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
