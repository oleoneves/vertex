import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Worker, Placement, TimeEntry } from "@/types/db";
import { PageHeader } from "../../_components/page-header";
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

export const dynamic = "force-dynamic";

export default async function WorkerDetail({
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
  const [workerRes, placementsRes, entriesRes] = await Promise.all([
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
              This month
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-extrabold tabular-nums">{monthHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">hours worked</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold tabular-nums">${monthPay.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">pay earned</p>
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
              </FormGrid>
              <FormTextarea
                label="Notes"
                name="notes"
                rows={3}
                defaultValue={worker.notes ?? ""}
              />
            </FormSection>
            <FormActions submitLabel="Save changes" cancelHref="/admin/workers" />
          </form>
        </div>

        {/* Placements + recent hours */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Placements
              </h2>
              <Link
                href="/admin/placements/new"
                className="text-xs text-accent underline-offset-4 hover:underline"
              >
                + New
              </Link>
            </div>
            {placements.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No placements yet.</p>
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
                          ${Number(p.pay_rate).toFixed(2)} → ${Number(p.bill_rate).toFixed(2)}{" "}
                          <span className="text-accent">+${margin.toFixed(2)}/hr</span>
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
              Recent hours
            </h2>
            {entries.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No time entries yet.</p>
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
                      {e.hours_worked != null ? `${Number(e.hours_worked).toFixed(2)}h` : "—"}
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
        </div>
      </div>
    </div>
  );
}
