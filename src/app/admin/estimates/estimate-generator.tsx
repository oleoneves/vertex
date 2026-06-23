"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { brand } from "@/lib/brand";
import { PrintButton } from "../_components/print-button";

export type EmployerOption = {
  id: string;
  name: string;
  contact_name: string | null;
  billing_email: string | null;
  billing_address: string | null;
  hourly_bill_rate: number | null;
  per_diem_rate: number | null;
  travel_time_rate: number | null;
};

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
function fmtDate(s: string): string {
  if (!s) return "—";
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 86400000) + 1);
}

type Form = {
  employerId: string;
  clientName: string;
  contactName: string;
  billingAddress: string;
  projectName: string;
  location: string;
  startDate: string;
  endDate: string;
  people: string;
  hoursPerDay: string;
  hourlyRate: string;
  perDiemRate: string;
  travelRate: string;
  travelHoursPerPerson: string;
};

const EMPTY: Form = {
  employerId: "",
  clientName: "",
  contactName: "",
  billingAddress: "",
  projectName: "",
  location: "",
  startDate: "",
  endDate: "",
  people: "",
  hoursPerDay: "",
  hourlyRate: "",
  perDiemRate: "",
  travelRate: "",
  travelHoursPerPerson: "",
};

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-foreground/40";

export function EstimateGenerator({
  employers: initialEmployers,
}: {
  employers?: EmployerOption[];
} = {}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [estimateNumber, setEstimateNumber] = useState("EST-DRAFT");
  const [todayLabel, setTodayLabel] = useState("");
  const [employers, setEmployers] = useState<EmployerOption[]>(
    initialEmployers ?? []
  );

  useEffect(() => {
    if (initialEmployers && initialEmployers.length > 0) return;
    let active = true;
    fetch("/admin/estimates/employers")
      .then((r) => (r.ok ? r.json() : { employers: [] }))
      .then((d) => {
        if (active) setEmployers((d.employers as EmployerOption[]) ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialEmployers]);

  useEffect(() => {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    setEstimateNumber(`EST-${ymd}-${suffix}`);
    setTodayLabel(
      now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    );
  }, []);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const pickEmployer = (id: string) => {
    const emp = employers.find((e) => e.id === id);
    if (!emp) {
      set({ employerId: id });
      return;
    }
    set({
      employerId: id,
      clientName: emp.name,
      contactName: emp.contact_name ?? "",
      billingAddress: emp.billing_address ?? "",
      hourlyRate: emp.hourly_bill_rate != null ? String(emp.hourly_bill_rate) : "",
      perDiemRate: emp.per_diem_rate != null ? String(emp.per_diem_rate) : "",
      travelRate: emp.travel_time_rate != null ? String(emp.travel_time_rate) : "",
    });
  };

  const calc = useMemo(() => {
    const people = Number(form.people) || 0;
    const hoursPerDay = Number(form.hoursPerDay) || 0;
    const days = daysBetween(form.startDate, form.endDate);
    const hours = people * hoursPerDay * days;
    const hourlyRate = Number(form.hourlyRate) || 0;
    const perDiemRate = Number(form.perDiemRate) || 0;
    const travelRate = Number(form.travelRate) || 0;
    const travelHrsPerPerson = Number(form.travelHoursPerPerson) || 0;
    const laborTotal = hours * hourlyRate;
    const perDiemQty = people * days;
    const perDiemTotal = perDiemQty * perDiemRate;
    const travelQty = people * travelHrsPerPerson;
    const travelTotal = travelQty * travelRate;
    return {
      people,
      hoursPerDay,
      days,
      hours,
      hourlyRate,
      perDiemRate,
      travelRate,
      travelHrsPerPerson,
      laborTotal,
      perDiemQty,
      perDiemTotal,
      travelQty,
      travelTotal,
      grandTotal: laborTotal + perDiemTotal + travelTotal,
    };
  }, [form]);

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
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Estimate generator</h1>
          <p className="text-sm text-muted-foreground">
            Build a one-off estimate and export it as PDF. Nothing is saved.
          </p>
        </div>
        <PrintButton label="Print / PDF" />
      </div>

      {/* Form */}
      <div className="no-print rounded-2xl border border-border bg-background p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Client (prefill rates)" className="sm:col-span-2">
            <select
              className={inputCls}
              value={form.employerId}
              onChange={(e) => pickEmployer(e.target.value)}
            >
              <option value="">Manual entry…</option>
              {employers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Client name">
            <input
              className={inputCls}
              value={form.clientName}
              onChange={(e) => set({ clientName: e.target.value })}
              placeholder="Acme Restoration LLC"
            />
          </Field>
          <Field label="Contact">
            <input
              className={inputCls}
              value={form.contactName}
              onChange={(e) => set({ contactName: e.target.value })}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Billing address" className="sm:col-span-2">
            <input
              className={inputCls}
              value={form.billingAddress}
              onChange={(e) => set({ billingAddress: e.target.value })}
              placeholder="123 Main St, Orlando, FL"
            />
          </Field>
          <Field label="Project name">
            <input
              className={inputCls}
              value={form.projectName}
              onChange={(e) => set({ projectName: e.target.value })}
              placeholder="Hurricane cleanup — Phase 1"
            />
          </Field>
          <Field label="Location">
            <input
              className={inputCls}
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="Tampa, FL"
            />
          </Field>
          <Field label="Start date">
            <input
              type="date"
              className={inputCls}
              value={form.startDate}
              onChange={(e) => set({ startDate: e.target.value })}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              className={inputCls}
              value={form.endDate}
              onChange={(e) => set({ endDate: e.target.value })}
            />
          </Field>
          <Field label="People">
            <input
              type="number"
              min="0"
              className={inputCls}
              value={form.people}
              onChange={(e) => set({ people: e.target.value })}
              placeholder="10"
            />
          </Field>
          <Field label="Hours / day">
            <input
              type="number"
              min="0"
              step="0.5"
              className={inputCls}
              value={form.hoursPerDay}
              onChange={(e) => set({ hoursPerDay: e.target.value })}
              placeholder="10"
            />
          </Field>
          <Field label="Hourly rate (USD)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.hourlyRate}
              onChange={(e) => set({ hourlyRate: e.target.value })}
              placeholder="38.00"
            />
          </Field>
          <Field label="Per diem rate (USD/day)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.perDiemRate}
              onChange={(e) => set({ perDiemRate: e.target.value })}
              placeholder="55.00"
            />
          </Field>
          <Field label="Travel rate (USD/hr)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.travelRate}
              onChange={(e) => set({ travelRate: e.target.value })}
              placeholder="25.00"
            />
          </Field>
          <Field label="Travel hrs / person">
            <input
              type="number"
              min="0"
              step="0.5"
              className={inputCls}
              value={form.travelHoursPerPerson}
              onChange={(e) => set({ travelHoursPerPerson: e.target.value })}
              placeholder="8"
            />
          </Field>
          <Field label="Estimate #">
            <input
              className={inputCls}
              value={estimateNumber}
              onChange={(e) => setEstimateNumber(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Document preview — same layout as the project estimate page */}
      <article className="estimate-doc mx-auto max-w-4xl rounded-2xl border border-border bg-white text-slate-900 shadow-sm">
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
            <div className="text-xs opacity-75">{todayLabel}</div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 border-b border-slate-200 px-8 py-5 text-sm">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Prepared for
            </div>
            <div className="mt-1 text-base font-bold">{form.clientName || "—"}</div>
            {form.contactName && <div className="text-slate-600">{form.contactName}</div>}
            {form.billingAddress && (
              <div className="whitespace-pre-line text-slate-600">{form.billingAddress}</div>
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

        <section className="border-b border-slate-200 px-8 py-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Project
          </div>
          <div className="mt-1 text-lg font-bold">{form.projectName || "—"}</div>
          {form.location && <div className="text-sm text-slate-600">{form.location}</div>}
          <div className="mt-3 grid grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                People
              </div>
              <div className="mt-1 font-mono text-base font-bold tabular-nums">
                {calc.people || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Hours / day
              </div>
              <div className="mt-1 font-mono text-base font-bold tabular-nums">
                {calc.hoursPerDay || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Days
              </div>
              <div className="mt-1 font-mono text-base font-bold tabular-nums">
                {calc.days || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Service period
              </div>
              <div className="mt-1 text-xs font-medium tabular-nums">
                {fmtDate(form.startDate)} → {fmtDate(form.endDate)}
              </div>
            </div>
          </div>
        </section>

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
                      {calc.people > 0 && calc.days > 0
                        ? `${calc.people} people × ${calc.days} days × ${calc.hoursPerDay} hrs/day`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {fmtNumber(calc.hours)} hrs
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {fmtUsd(calc.hourlyRate)}/hr
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {fmtUsd(calc.laborTotal)}
                  </td>
                </tr>

                <tr
                  className={`border-b border-slate-100 ${calc.perDiemTotal === 0 ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Per Diem
                    </div>
                    <div className="font-medium">
                      {calc.perDiemQty > 0
                        ? `${calc.people} people × ${calc.days} days`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {calc.perDiemQty > 0 ? `${fmtNumber(calc.perDiemQty)} days` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {calc.perDiemRate > 0 ? `${fmtUsd(calc.perDiemRate)}/day` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {calc.perDiemTotal > 0 ? fmtUsd(calc.perDiemTotal) : "—"}
                  </td>
                </tr>

                <tr
                  className={`border-b border-slate-100 ${calc.travelTotal === 0 ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Travel Time
                    </div>
                    <div className="font-medium">
                      {calc.travelQty > 0
                        ? `${calc.people} people × ${calc.travelHrsPerPerson} hrs travel`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {calc.travelQty > 0 ? `${fmtNumber(calc.travelQty)} hrs` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {calc.travelRate > 0 ? `${fmtUsd(calc.travelRate)}/hr` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {calc.travelTotal > 0 ? fmtUsd(calc.travelTotal) : "—"}
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
                    {fmtUsd(calc.grandTotal)}
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

        <footer className="grid grid-cols-2 gap-8 rounded-b-2xl border-t border-slate-200 px-8 py-6 text-xs text-slate-600">
          <div>
            <div className="border-b border-slate-400 pb-6"></div>
            <div className="mt-1 text-[10px] uppercase tracking-wider">
              Authorized representative · {form.clientName || "Contractor"}
            </div>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-6"></div>
            <div className="mt-1 text-[10px] uppercase tracking-wider">{brand.legalName}</div>
          </div>
          <div className="col-span-2 mt-2 text-center text-[10px] text-slate-400">
            Estimate {estimateNumber} · Generated {todayLabel} · {brand.legalName} ·{" "}
            {brand.domain}
          </div>
        </footer>
      </article>
    </div>
  );
}
