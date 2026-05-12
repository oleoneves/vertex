import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, MapPin } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Shift, TimeEntry, Placement, Worker, Employer } from "@/types/db";
import { PageHeader } from "../../_components/page-header";
import { StatusPill } from "../../_components/data-table";
import { cancelShift } from "../../_actions";

export const dynamic = "force-dynamic";

async function updateShift(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const supabase = await getSupabaseServer();
  await supabase
    .from("shifts")
    .update({
      scheduled_start: new Date(String(formData.get("scheduled_start"))).toISOString(),
      scheduled_end: new Date(String(formData.get("scheduled_end"))).toISOString(),
      location: String(formData.get("location") || "") || null,
      notes: String(formData.get("notes") || "") || null,
      status: String(formData.get("status") || "scheduled"),
    })
    .eq("id", id);
  revalidatePath(`/admin/shifts/${id}`);
  revalidatePath("/admin/shifts");
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function ShiftDetail({
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
  const [shiftRes, entriesRes] = await Promise.all([
    supabase
      .from("shifts")
      .select(
        "*, placement:placements(role_title, pay_rate, bill_rate, worker:workers(id, full_name, employee_code), employer:employers(name))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("time_entries")
      .select("*, worker:workers(full_name)")
      .eq("shift_id", id)
      .order("clock_in_at", { ascending: false }),
  ]);

  const shift = shiftRes.data as
    | (Shift & {
        placement:
          | (Pick<Placement, "role_title" | "pay_rate" | "bill_rate"> & {
              worker: Pick<Worker, "id" | "full_name" | "employee_code"> | null;
              employer: Pick<Employer, "name"> | null;
            })
          | null;
      })
    | null;
  if (!shift) notFound();

  type Entry = TimeEntry & { worker: Pick<Worker, "full_name"> | null };
  const entries = (entriesRes.data as unknown as Entry[]) ?? [];

  const start = new Date(shift.scheduled_start);
  const end = new Date(shift.scheduled_end);
  const hours = (end.getTime() - start.getTime()) / 3600000;
  const totalLogged = entries.reduce(
    (a, e) => a + (Number(e.hours_worked) || 0),
    0,
  );

  return (
    <div>
      <Link
        href="/admin/shifts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Shifts
      </Link>

      <PageHeader
        title={start.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
        subtitle={`${shift.placement?.worker?.full_name ?? "—"} · ${shift.placement?.employer?.name ?? "—"}`}
      >
        <StatusPill
          status={shift.status}
          variant={
            shift.status === "completed"
              ? "green"
              : shift.status === "in_progress"
              ? "amber"
              : shift.status === "no_show" || shift.status === "cancelled"
              ? "red"
              : "blue"
          }
        />
        {(shift.status === "scheduled" || shift.status === "in_progress") && (
          <form action={cancelShift} className="inline">
            <input type="hidden" name="id" value={shift.id} />
            <button
              type="submit"
              className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              Cancel shift
            </button>
          </form>
        )}
      </PageHeader>

      {/* KPI strip */}
      <section className="mb-6 grid gap-3 sm:grid-cols-4">
        <Kpi
          label="Scheduled"
          value={`${start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}–${end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
          subValue={`${hours.toFixed(1)} hrs`}
        />
        <Kpi
          label="Logged"
          value={`${totalLogged.toFixed(2)} hrs`}
          subValue={
            entries.length === 0
              ? "no entries"
              : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`
          }
        />
        <Kpi
          label="Pay / Bill"
          value={`$${Number(shift.placement?.pay_rate ?? 0).toFixed(0)} / $${Number(shift.placement?.bill_rate ?? 0).toFixed(0)}`}
          subValue="$/hr"
        />
        <Kpi
          label="Role"
          value={shift.placement?.role_title ?? "—"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Edit */}
        <form
          action={updateShift}
          className="space-y-4 rounded-xl border border-border bg-background p-5"
        >
          <input type="hidden" name="id" value={shift.id} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Edit shift
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Start</span>
              <input
                name="scheduled_start"
                type="datetime-local"
                defaultValue={toLocalInput(shift.scheduled_start)}
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">End</span>
              <input
                name="scheduled_end"
                type="datetime-local"
                defaultValue={toLocalInput(shift.scheduled_end)}
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Location</span>
              <input
                name="location"
                defaultValue={shift.location ?? ""}
                placeholder="Job site address or name"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Status</span>
              <select
                name="status"
                defaultValue={shift.status}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="no_show">No show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                name="notes"
                defaultValue={shift.notes ?? ""}
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-bold text-accent-foreground hover:opacity-90"
          >
            Save
          </button>
        </form>

        {/* Time entries on this shift */}
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Time entries ({entries.length})
          </h2>
          {entries.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No clock-ins yet for this shift.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="rounded-md border border-border/60 px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{e.worker?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.clock_in_at).toLocaleString()} →{" "}
                        {e.clock_out_at
                          ? new Date(e.clock_out_at).toLocaleString()
                          : "open"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums">
                        {e.hours_worked != null
                          ? `${Number(e.hours_worked).toFixed(2)} hrs`
                          : "—"}
                      </div>
                      <div className="mt-0.5">
                        {e.approved ? (
                          <StatusPill status="approved" variant="green" />
                        ) : e.clock_out_at ? (
                          <StatusPill status="pending" variant="amber" />
                        ) : (
                          <StatusPill status="open" variant="blue" />
                        )}
                      </div>
                    </div>
                  </div>
                  {e.location && (
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="font-mono">{e.location}</span>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(e.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        map ↗
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-extrabold tabular-nums">{value}</p>
      {subValue && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subValue}</p>
      )}
    </div>
  );
}
