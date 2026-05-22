import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Worker, Placement, TimeEntry, WorkerDocument, DocumentType } from "@/types/db";
import { DOCUMENT_LABELS } from "@/lib/documents";
import { PageHeader } from "../../_components/page-header";
import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormTextarea,
  FormActions,
} from "../../_components/form";
import { StatusPill } from "../../_components/data-table";
import { updateWorker, setWorkerStatus, resendWorkerInvite } from "../../_actions";
import { TierBadge } from "../../_components/tier-badge";
import { StarRating } from "../../_components/star-rating";
import { reliabilityFromWorker } from "@/lib/reliability";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function WorkerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    notFound();
  }

  const supabase = await getSupabaseServer();
  const [workerRes, placementsRes, entriesRes, docsRes, sigsRes, incidentsRes, ratingsRes, referralsRes] =
    await Promise.all([
      supabase.from("workers").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("placements")
        .select("*, employer:employers(name)")
        .eq("worker_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("time_entries")
        .select(
          "id, clock_in_at, clock_out_at, hours_worked, pay_rate_at_entry, approved, placement:placements(role_title, employer:employers(name))",
        )
        .eq("worker_id", id)
        .order("clock_in_at", { ascending: false })
        .limit(20),
      supabase
        .from("documents")
        .select("*")
        .eq("worker_id", id)
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("worker_signatures")
        .select("document, signed_at")
        .eq("worker_id", id),
      supabase
        .from("incident_reports")
        .select("id, title, severity, status, created_at", { count: "exact" })
        .eq("worker_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("worker_ratings_given")
        .select("stars, target_kind")
        .eq("target_worker_id", id)
        .eq("target_kind", "peer"),
      supabase
        .from("worker_referrals")
        .select("status", { count: "exact", head: true })
        .eq("referrer_worker_id", id),
    ]);

  const worker = workerRes.data as Worker | null;
  if (!worker) notFound();

  const placements =
    (placementsRes.data as unknown as (Placement & {
      employer: { name: string } | null;
    })[]) ?? [];

  const entries =
    (entriesRes.data as unknown as Array<
      Pick<TimeEntry, "id" | "clock_in_at" | "clock_out_at" | "hours_worked" | "pay_rate_at_entry" | "approved"> & {
        placement: { role_title: string; employer: { name: string } | null } | null;
      }
    >) ?? [];
  const docs = (docsRes.data as WorkerDocument[]) ?? [];

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const monthEntries = entries.filter(
    (e) => e.approved && new Date(e.clock_in_at) >= thisMonth,
  );
  const monthHours = monthEntries.reduce(
    (a, e) => a + (Number(e.hours_worked) || 0),
    0,
  );
  const monthPay = monthEntries.reduce(
    (a, e) => a + (Number(e.hours_worked) || 0) * (Number(e.pay_rate_at_entry) || 0),
    0,
  );

  return (
    <div>
      <Link
        href="/admin/workers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Workers
      </Link>

      <PageHeader title={worker.full_name} subtitle={`Worker ${worker.employee_code ?? ""}`}>
        <StatusPill
          status={worker.status}
          variant={
            worker.status === "active"
              ? "green"
              : worker.status === "onboarding"
              ? "amber"
              : "muted"
          }
        />
        {(() => {
          const rel = reliabilityFromWorker(worker);
          return <TierBadge tier={rel.tier} score={rel.score} size="sm" showScore />;
        })()}
        {worker.rating != null && (
          <StarRating value={worker.rating} count={worker.ratings_count} size="sm" />
        )}
        {worker.email && !worker.user_id && (
          <form action={resendWorkerInvite} className="inline">
            <input type="hidden" name="id" value={worker.id} />
            <button
              type="submit"
              title={`Send portal login invite to ${worker.email}`}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Send invite
            </button>
          </form>
        )}
        {worker.user_id && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/40 dark:text-green-300">
            ✓ portal access
          </span>
        )}
        <form action={setWorkerStatus} className="inline">
          <input type="hidden" name="id" value={worker.id} />
          <input
            type="hidden"
            name="status"
            value={worker.status === "active" ? "inactive" : "active"}
          />
          <button
            type="submit"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            {worker.status === "active" ? "Deactivate" : "Activate"}
          </button>
        </form>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Stats + edit */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.det.month_hours")}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-extrabold tabular-nums">{fmtNum(monthHours, { decimals: 1 })}</p>
                <p className="text-xs text-muted-foreground">{t(locale, "a.col.hours")}</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold tabular-nums">{fmtUsd(monthPay)}</p>
                <p className="text-xs text-muted-foreground">{t(locale, "a.col.pay_earned")}</p>
              </div>
            </div>
          </section>

          <form action={updateWorker} className="space-y-4">
            <input type="hidden" name="id" value={worker.id} />
            <FormSection title="Profile">
              <FormGrid>
                <FormField
                  label="Full name"
                  name="full_name"
                  required
                  defaultValue={worker.full_name}
                />
                <FormField
                  label="Employee code"
                  name="employee_code"
                  defaultValue={worker.employee_code ?? ""}
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={worker.email ?? ""}
                />
                <FormField
                  label="Phone"
                  name="phone"
                  type="tel"
                  defaultValue={worker.phone ?? ""}
                />
                <FormSelect
                  label="Status"
                  name="status"
                  defaultValue={worker.status}
                  options={[
                    { value: "onboarding", label: "Onboarding" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
                <FormField
                  label="Default pay rate ($/hr)"
                  name="default_pay_rate"
                  type="number"
                  step="0.01"
                  defaultValue={worker.default_pay_rate ?? ""}
                />
                <FormSelect
                  label="Payment method"
                  name="payment_method"
                  defaultValue={worker.payment_method}
                  options={[
                    { value: "check", label: "Check" },
                    { value: "ach", label: "ACH" },
                    { value: "zelle", label: "Zelle" },
                    { value: "cashapp", label: "CashApp" },
                  ]}
                />
                <FormField
                  label="Zelle full name"
                  name="zelle_full_name"
                  defaultValue={worker.zelle_full_name ?? ""}
                  hint="Name on Zelle if different from full name."
                />
              </FormGrid>
              <FormTextarea
                label="Notes"
                name="notes"
                rows={3}
                defaultValue={worker.notes ?? ""}
              />
            </FormSection>
            <FormSection title="Tax & compliance" description="Sensitive — admin access only.">
              <FormGrid>
                <FormField
                  label="Social Security Number"
                  name="ssn"
                  placeholder="XXX-XX-XXXX"
                  defaultValue={worker.ssn ?? ""}
                  hint="Used on W-2 / 1099 generation."
                />
              </FormGrid>
            </FormSection>
            <FormActions submitLabel="Save changes" cancelHref="/admin/workers" />
          </form>
        </div>

        {/* Placements + recent hours */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t(locale, "a.det.placements")}
              </h2>
              <Link
                href="/admin/placements/new"
                className="text-xs text-accent underline-offset-4 hover:underline"
              >
                + {t(locale, "a.act.new")}
              </Link>
            </div>
            {placements.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {placements.map((p) => {
                  const margin = Number(p.bill_rate) - Number(p.pay_rate);
                  return (
                    <li
                      key={p.id}
                      className="rounded-lg border border-border/60 p-3 text-sm"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div>
                          <div className="font-medium">{p.employer?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{p.role_title}</div>
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
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.start_date} → {p.end_date ?? "ongoing"}
                        </span>
                        <span className="font-mono">
                          {fmtUsd(p.pay_rate, { decimals: 2 })} → {fmtUsd(p.bill_rate, { decimals: 2 })}{" "}
                          <span className="text-accent">+{fmtUsd(margin, { decimals: 2 })}/hr</span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.det.recent_entries")}
            </h2>
            {entries.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="mt-4 divide-y divide-border/60 text-sm">
                {entries.slice(0, 10).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-baseline justify-between gap-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs">
                        {new Date(e.clock_in_at).toLocaleDateString()} —{" "}
                        {e.placement?.employer?.name ?? "—"}
                      </div>
                    </div>
                    <div className="font-mono tabular-nums">
                      {e.hours_worked != null ? `{fmtUsd(e.hours_worked, { decimals: 2 })}h` : "—"}
                    </div>
                    {e.approved ? (
                      <StatusPill status="approved" variant="green" />
                    ) : e.clock_out_at ? (
                      <StatusPill status="pending" variant="amber" />
                    ) : (
                      <StatusPill status="open" variant="blue" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Engagement snapshot — signatures, incidents, ratings, referrals */}
          {(() => {
            type SigRow = { document: string; signed_at: string };
            type IncRow = { id: string; title: string; severity: string; status: string; created_at: string };
            type RatRow = { stars: number; target_kind: string };
            const sigs = (sigsRes.data as SigRow[]) ?? [];
            const ppe = sigs.find((s) => s.document === "ppe");
            const terms = sigs.find((s) => s.document === "terms");
            const incidents = (incidentsRes.data as IncRow[]) ?? [];
            const incidentCount = incidentsRes.count ?? incidents.length;
            const ratings = (ratingsRes.data as RatRow[]) ?? [];
            const avgPeerRating =
              ratings.length > 0
                ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
                : null;
            const referralsCount = referralsRes.count ?? 0;
            return (
              <section className="rounded-xl border border-border bg-background p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Engajamento
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-xs">
                    <p className="font-bold uppercase tracking-wider text-muted-foreground">
                      Assinaturas
                    </p>
                    <div className="mt-1.5 space-y-1">
                      <p className={ppe ? "text-green-700 dark:text-green-300" : "text-red-600"}>
                        {ppe ? "✓" : "✗"} PPE {ppe && `· ${new Date(ppe.signed_at).toLocaleDateString()}`}
                      </p>
                      <p className={terms ? "text-green-700 dark:text-green-300" : "text-red-600"}>
                        {terms ? "✓" : "✗"} Termos {terms && `· ${new Date(terms.signed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-xs">
                    <p className="font-bold uppercase tracking-wider text-muted-foreground">
                      Atividade
                    </p>
                    <p className="mt-1.5">
                      🚨 {incidentCount} incident{incidentCount === 1 ? "" : "s"} reportado{incidentCount === 1 ? "" : "s"}
                    </p>
                    <p>🎁 {referralsCount} indicaç{referralsCount === 1 ? "ão" : "ões"}</p>
                    {avgPeerRating != null && (
                      <p>⭐ {avgPeerRating.toFixed(1)} média peer ({ratings.length} avaliações)</p>
                    )}
                  </div>
                </div>
                {incidents.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs">
                    {incidents.slice(0, 3).map((i) => (
                      <li key={i.id} className="flex items-center justify-between border-t border-border/40 py-1.5">
                        <span className="truncate">{i.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {i.severity} · {i.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })()}

          {/* Documents */}
          <section className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t(locale, "a.det.documents")} ({docs.length})
              </h2>
              <Link
                href="/admin/documents"
                className="text-xs text-accent underline-offset-4 hover:underline"
              >
                {t(locale, "a.filter.all")} →
              </Link>
            </div>
            {docs.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No documents uploaded yet. Worker can upload from{" "}
                <code className="font-mono text-xs">/worker/documents</code>.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-baseline justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {DOCUMENT_LABELS[d.type as DocumentType]}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {d.filename} · {new Date(d.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                    {d.status === "approved" ? (
                      <StatusPill status="approved" variant="green" />
                    ) : d.status === "rejected" ? (
                      <StatusPill status="rejected" variant="red" />
                    ) : d.status === "expired" ? (
                      <StatusPill status="expired" variant="amber" />
                    ) : (
                      <StatusPill status="pending" variant="blue" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
