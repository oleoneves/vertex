import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import { updateTimeEntry, deleteTimeEntry } from "../../../_actions";
import type { Employer } from "@/types/db";

export const dynamic = "force-dynamic";

type EntryRow = {
  id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  break_minutes: number;
  hours_worked: number | null;
  bill_rate_at_entry: number | null;
  approved: boolean;
  notes: string | null;
  worker: { full_name: string; employee_code: string | null } | null;
  placement: {
    role_title: string;
    project: { name: string } | null;
  } | null;
};

function mondayOf(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = out.getDay();
  const offset = (dow + 6) % 7;
  out.setDate(out.getDate() - offset);
  return out;
}

function fmtUsd(n: number): string {
  return (Number(n) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function fmtNumber(n: number, decimals = 2): string {
  return (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDow(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default async function WeeklyTimesheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await getSupabaseServer();
  const { data: empRow } = await supabase
    .from("employers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const employer = empRow as Employer | null;
  if (!employer) notFound();

  const weekStart = sp.week ? mondayOf(new Date(sp.week)) : mondayOf(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { data: entriesRaw } = await supabase
    .from("time_entries")
    .select(
      "id, clock_in_at, clock_out_at, break_minutes, hours_worked, bill_rate_at_entry, approved, notes, worker:workers(full_name, employee_code), placement:placements!inner(role_title, employer_id, project:projects(name))",
    )
    .eq("placement.employer_id", id)
    .gte("clock_in_at", weekStart.toISOString())
    .lte("clock_in_at", weekEnd.toISOString())
    .order("clock_in_at", { ascending: true });

  const entries = (entriesRaw as unknown as EntryRow[]) ?? [];

  // Group by worker
  const byWorker = new Map<
    string,
    { name: string; code: string | null; entries: EntryRow[]; hours: number; amount: number }
  >();
  for (const e of entries) {
    const name = e.worker?.full_name ?? "(unassigned)";
    const key = name;
    const bucket = byWorker.get(key) ?? {
      name,
      code: e.worker?.employee_code ?? null,
      entries: [],
      hours: 0,
      amount: 0,
    };
    bucket.entries.push(e);
    const hrs = Number(e.hours_worked ?? 0);
    const rate = Number(e.bill_rate_at_entry ?? 0);
    bucket.hours += hrs;
    bucket.amount += hrs * rate;
    byWorker.set(key, bucket);
  }
  const grouped = Array.from(byWorker.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const totalHours = grouped.reduce((s, w) => s + w.hours, 0);
  const totalAmount = grouped.reduce((s, w) => s + w.amount, 0);

  const weekParam = isoDate(weekStart);

  return (
    <div className="space-y-6">
      {/* Print stylesheet */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              .timesheet-doc { box-shadow: none !important; border: none !important; }
              body { background: white !important; }
            }
          `,
        }}
      />

      {/* Toolbar (hidden when printing) */}
      <div className="no-print flex items-center justify-between gap-3">
        <Link
          href={`/admin/employers/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {employer.name}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/employers/${id}/weekly?week=${isoDate(prevWeek)}`}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev week
          </Link>
          <Link
            href={`/admin/employers/${id}/weekly?week=${isoDate(nextWeek)}`}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            Next week <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <a
            href={`/admin/employers/${id}/weekly?week=${weekParam}`}
            onClick={(e) => {
              e.preventDefault();
              window.print();
            }}
            className="inline-flex h-9 items-center gap-1 rounded-md bg-foreground px-3 text-sm font-bold text-background hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </a>
        </div>
      </div>

      {/* The branded document */}
      <article className="timesheet-doc mx-auto max-w-4xl rounded-2xl border border-border bg-white text-slate-900 shadow-sm">
        {/* Black header band */}
        <header
          className="flex items-start justify-between rounded-t-2xl px-8 py-6"
          style={{ background: brand.colors.primary, color: "white" }}
        >
          <div className="flex items-center gap-3">
            <Image
              src="/vertex-mark-navy.png"
              alt=""
              width={48}
              height={48}
              priority
              unoptimized
              className="h-12 w-auto shrink-0 invert"
            />
            <div className="leading-tight">
              <div className="text-2xl font-extrabold tracking-tight">VERTEX</div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[3px]"
                style={{ color: brand.colors.accent }}
              >
                Restoration · Recovery
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-[10px] font-bold uppercase tracking-[2px]"
              style={{ color: brand.colors.accent }}
            >
              Weekly Timesheet
            </div>
            <div className="mt-1 text-lg font-bold">
              Week of {fmtDate(weekStart)}
            </div>
            <div className="text-xs opacity-75">
              {fmtDate(weekStart)} → {fmtDate(weekEnd)}
            </div>
          </div>
        </header>

        {/* Bill to */}
        <section className="grid grid-cols-2 gap-6 border-b border-slate-200 px-8 py-5 text-sm">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Submitted to
            </div>
            <div className="mt-1 text-base font-bold">{employer.name}</div>
            {employer.contact_name && (
              <div className="text-slate-600">{employer.contact_name}</div>
            )}
            {employer.billing_address && (
              <div className="whitespace-pre-line text-slate-600">
                {employer.billing_address}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Submitted by
            </div>
            <div className="mt-1 text-base font-bold">{brand.legalName}</div>
            <div className="text-slate-600">{brand.supportEmail}</div>
            <div className="text-slate-600">{brand.domain}</div>
          </div>
        </section>

        {/* Summary stats */}
        <section className="grid grid-cols-3 gap-6 border-b border-slate-200 px-8 py-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workers
            </div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums">
              {grouped.length}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total hours
            </div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums">
              {fmtNumber(totalHours, 2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Amount
            </div>
            <div
              className="mt-1 text-2xl font-extrabold tabular-nums"
              style={{ color: brand.colors.primary }}
            >
              {fmtUsd(totalAmount)}
            </div>
          </div>
        </section>

        {/* Worker tables */}
        <section className="px-8 py-6">
          {grouped.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No approved time entries for this week.
            </p>
          ) : (
            <div className="space-y-6">
              {grouped.map((w) => (
                <div key={w.name} className="overflow-hidden rounded-lg border border-slate-200">
                  <div
                    className="flex items-baseline justify-between px-4 py-2.5"
                    style={{ background: "#F4F6FA" }}
                  >
                    <div>
                      <div className="text-sm font-bold">{w.name}</div>
                      {w.code && (
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          {w.code}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold tabular-nums">
                        {fmtNumber(w.hours, 2)} hrs
                      </div>
                      <div
                        className="font-mono text-sm font-bold tabular-nums"
                        style={{ color: brand.colors.primary }}
                      >
                        {fmtUsd(w.amount)}
                      </div>
                    </div>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-1.5 font-bold">Date</th>
                        <th className="px-4 py-1.5 font-bold">Project / Role</th>
                        <th className="px-4 py-1.5 font-bold">In</th>
                        <th className="px-4 py-1.5 font-bold">Out</th>
                        <th className="px-4 py-1.5 text-right font-bold">Break (min)</th>
                        <th className="px-4 py-1.5 text-right font-bold">Hrs</th>
                        <th className="px-4 py-1.5 text-right font-bold">Rate</th>
                        <th className="px-4 py-1.5 text-right font-bold">Amount</th>
                        <th className="px-2 py-1.5 no-print"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {w.entries.map((e) => {
                        const date = new Date(e.clock_in_at);
                        const hrs = Number(e.hours_worked ?? 0);
                        const rate = Number(e.bill_rate_at_entry ?? 0);
                        const amount = hrs * rate;
                        const dateIso = isoDate(date);
                        return (
                          <tr
                            key={e.id}
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                          >
                            <td className="px-4 py-1.5 tabular-nums">
                              <div className="font-medium">
                                {fmtDow(date)} {date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })}
                              </div>
                            </td>
                            <td className="px-4 py-1.5">
                              <div className="font-medium">
                                {e.placement?.project?.name ?? "—"}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {e.placement?.role_title ?? ""}
                              </div>
                            </td>
                            <td className="px-4 py-1.5" colSpan={3}>
                              <form
                                action={updateTimeEntry}
                                className="flex items-center gap-1.5"
                              >
                                <input type="hidden" name="id" value={e.id} />
                                <input type="hidden" name="employer_id" value={id} />
                                <input type="hidden" name="week" value={weekParam} />
                                <input type="hidden" name="date" value={dateIso} />
                                <input
                                  type="time"
                                  name="clock_in"
                                  defaultValue={fmtTimeInput(e.clock_in_at)}
                                  className="w-24 rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs tabular-nums"
                                />
                                <span className="text-slate-400">→</span>
                                <input
                                  type="time"
                                  name="clock_out"
                                  defaultValue={fmtTimeInput(e.clock_out_at)}
                                  className="w-24 rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs tabular-nums"
                                />
                                <input
                                  type="number"
                                  name="break_minutes"
                                  defaultValue={e.break_minutes}
                                  min="0"
                                  step="5"
                                  placeholder="brk"
                                  className="w-12 rounded border border-slate-300 bg-white px-1 py-0.5 text-right font-mono text-xs tabular-nums"
                                />
                                <button
                                  type="submit"
                                  className="no-print rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white hover:opacity-80"
                                >
                                  Save
                                </button>
                              </form>
                            </td>
                            <td className="px-4 py-1.5 text-right font-mono tabular-nums">
                              {fmtNumber(hrs, 2)}
                            </td>
                            <td className="px-4 py-1.5 text-right font-mono tabular-nums">
                              {fmtUsd(rate)}
                            </td>
                            <td className="px-4 py-1.5 text-right font-mono font-bold tabular-nums">
                              {fmtUsd(amount)}
                            </td>
                            <td className="no-print px-2 py-1.5">
                              <form action={deleteTimeEntry}>
                                <input type="hidden" name="id" value={e.id} />
                                <input type="hidden" name="employer_id" value={id} />
                                <button
                                  type="submit"
                                  aria-label="Delete entry"
                                  className="text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </form>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer / signatures */}
        <footer
          className="grid grid-cols-2 gap-8 rounded-b-2xl border-t border-slate-200 px-8 py-6 text-xs text-slate-600"
        >
          <div>
            <div className="border-b border-slate-400 pb-6"></div>
            <div className="mt-1 text-[10px] uppercase tracking-wider">
              Authorized representative · {employer.name}
            </div>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-6"></div>
            <div className="mt-1 text-[10px] uppercase tracking-wider">
              {brand.legalName}
            </div>
          </div>
          <div className="col-span-2 mt-2 text-center text-[10px] text-slate-400">
            Generated on {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            · {brand.legalName} · {brand.domain}
          </div>
        </footer>
      </article>
    </div>
  );
}
