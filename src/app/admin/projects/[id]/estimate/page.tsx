import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import { PrintButton } from "../../../_components/print-button";

export const dynamic = "force-dynamic";

function fmtUsd(n: number): string {
  return (Number(n) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}
function fmtNumber(n: number, decimals = 0): string {
  return (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function daysBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 86400000) + 1);
}

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data: projectRow } = await supabase
    .from("projects")
    .select("*, employer:employers(*)")
    .eq("id", id)
    .maybeSingle();
  if (!projectRow) notFound();
  const project = projectRow as {
    id: string;
    name: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    budget_hours: number | null;
    estimate_people: number | null;
    estimate_hours_per_day: number | null;
    estimate_travel_hours_per_person: number | null;
    notes: string | null;
    employer:
      | {
          id: string;
          name: string;
          contact_name: string | null;
          billing_email: string | null;
          billing_address: string | null;
          hourly_bill_rate: number | null;
          per_diem_rate: number | null;
          travel_time_rate: number | null;
          bill_rate_multiplier: number;
        }
      | null;
  };

  const people = project.estimate_people ?? 0;
  const hoursPerDay = project.estimate_hours_per_day ?? 0;
  const days = daysBetween(project.start_date, project.end_date);
  const computedHours = people * hoursPerDay * days;
  const approvedHours = project.budget_hours
    ? Number(project.budget_hours)
    : computedHours;

  const hourlyRate = project.employer?.hourly_bill_rate ?? 0;
  const perDiemRate = project.employer?.per_diem_rate ?? 0;
  const travelRate = project.employer?.travel_time_rate ?? 0;
  const travelHrsPerPerson = project.estimate_travel_hours_per_person ?? 0;

  const laborTotal = approvedHours * hourlyRate;
  const perDiemQty = people * days;
  const perDiemTotal = perDiemQty * perDiemRate;
  const travelQty = people * travelHrsPerPerson;
  const travelTotal = travelQty * travelRate;
  const grandTotal = laborTotal + perDiemTotal + travelTotal;

  const today = new Date();
  const estimateNumber = `EST-${project.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print, nav, aside { display: none !important; }
              body { background: white !important; }
              .estimate-doc { box-shadow: none !important; border: none !important; }
            }
          `,
        }}
      />

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between gap-3">
        <Link
          href={`/admin/projects/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to project
        </Link>
        <PrintButton label="Print / PDF" />
      </div>

      <article className="estimate-doc mx-auto max-w-4xl rounded-2xl border border-border bg-white text-slate-900 shadow-sm">
        {/* Branded header */}
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
              Estimate
            </div>
            <div className="mt-1 font-mono text-base font-bold">{estimateNumber}</div>
            <div className="text-xs opacity-75">
              {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </header>

        {/* To + From */}
        <section className="grid grid-cols-2 gap-6 border-b border-slate-200 px-8 py-5 text-sm">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Prepared for
            </div>
            <div className="mt-1 text-base font-bold">
              {project.employer?.name ?? "—"}
            </div>
            {project.employer?.contact_name && (
              <div className="text-slate-600">{project.employer.contact_name}</div>
            )}
            {project.employer?.billing_address && (
              <div className="whitespace-pre-line text-slate-600">
                {project.employer.billing_address}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Prepared by
            </div>
            <div className="mt-1 text-base font-bold">{brand.legalName}</div>
            <div className="text-slate-600">{brand.supportEmail}</div>
            <div className="text-slate-600">{brand.domain}</div>
          </div>
        </section>

        {/* Project + scope summary */}
        <section className="border-b border-slate-200 px-8 py-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Project
          </div>
          <div className="mt-1 text-lg font-bold">{project.name}</div>
          {project.location && (
            <div className="text-sm text-slate-600">{project.location}</div>
          )}
          <div className="mt-3 grid grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                People
              </div>
              <div className="mt-1 font-mono text-base font-bold tabular-nums">
                {people || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Hours / day
              </div>
              <div className="mt-1 font-mono text-base font-bold tabular-nums">
                {hoursPerDay || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Days
              </div>
              <div className="mt-1 font-mono text-base font-bold tabular-nums">{days || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Service period
              </div>
              <div className="mt-1 text-xs font-medium tabular-nums">
                {fmtDate(project.start_date)} → {fmtDate(project.end_date)}
              </div>
            </div>
          </div>
        </section>

        {/* Line items */}
        <section className="px-8 py-6">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead style={{ background: "#F4F6FA" }}>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2 font-bold">Service</th>
                  <th className="px-4 py-2 text-right font-bold">Qty</th>
                  <th className="px-4 py-2 text-right font-bold">Rate</th>
                  <th className="px-4 py-2 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Labor
                    </div>
                    <div className="font-medium">
                      {people > 0 && days > 0
                        ? `${people} people × ${days} days × ${hoursPerDay} hrs/day`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {fmtNumber(approvedHours)} hrs
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {fmtUsd(hourlyRate)}/hr
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {fmtUsd(laborTotal)}
                  </td>
                </tr>

                <tr
                  className={`border-b border-slate-100 ${perDiemTotal === 0 ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Per Diem
                    </div>
                    <div className="font-medium">
                      {perDiemQty > 0
                        ? `${people} people × ${days} days`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {perDiemQty > 0 ? `${fmtNumber(perDiemQty)} days` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {perDiemRate > 0 ? `${fmtUsd(perDiemRate)}/day` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {perDiemTotal > 0 ? fmtUsd(perDiemTotal) : "—"}
                  </td>
                </tr>

                <tr
                  className={`border-b border-slate-100 ${travelTotal === 0 ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Travel Time
                    </div>
                    <div className="font-medium">
                      {travelQty > 0
                        ? `${people} people × ${travelHrsPerPerson} hrs travel`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {travelQty > 0 ? `${fmtNumber(travelQty)} hrs` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {travelRate > 0 ? `${fmtUsd(travelRate)}/hr` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {travelTotal > 0 ? fmtUsd(travelTotal) : "—"}
                  </td>
                </tr>

                <tr className="opacity-50">
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Hotel
                    </div>
                    <div className="font-medium">Added at invoice time</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">—</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">—</td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">—</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300" style={{ background: "#F4F6FA" }}>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold">
                    ESTIMATED TOTAL
                  </td>
                  <td
                    className="px-4 py-3 text-right font-mono text-lg font-extrabold tabular-nums"
                    style={{ color: brand.colors.primary }}
                  >
                    {fmtUsd(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            This estimate is non-binding. Final invoice reflects actual hours worked, approved on the
            weekly timesheet. Hotel and unexpected costs are billed at invoice time.
          </p>
        </section>

        {/* Signatures */}
        <footer className="grid grid-cols-2 gap-8 rounded-b-2xl border-t border-slate-200 px-8 py-6 text-xs text-slate-600">
          <div>
            <div className="border-b border-slate-400 pb-6"></div>
            <div className="mt-1 text-[10px] uppercase tracking-wider">
              Authorized representative · {project.employer?.name ?? "Contractor"}
            </div>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-6"></div>
            <div className="mt-1 text-[10px] uppercase tracking-wider">{brand.legalName}</div>
          </div>
          <div className="col-span-2 mt-2 text-center text-[10px] text-slate-400">
            Estimate {estimateNumber} · Generated{" "}
            {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} ·{" "}
            {brand.legalName} · {brand.domain}
          </div>
        </footer>
      </article>
    </div>
  );
}
