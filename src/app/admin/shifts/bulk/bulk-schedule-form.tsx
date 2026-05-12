"use client";

import { useMemo, useState } from "react";

type Placement = {
  id: string;
  worker: string;
  employer: string;
  employerId: string;
  projectId: string | null;
  projectName: string | null;
  role: string;
  payRate: number;
  billRate: number;
};

export function BulkScheduleForm({
  action,
  placements,
  employers,
  projects,
}: {
  action: (formData: FormData) => void;
  placements: Placement[];
  employers: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const [employerFilter, setEmployerFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(placements.map((p) => p.id)),
  );
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [location, setLocation] = useState("");

  const visible = useMemo(
    () =>
      placements.filter((p) => {
        if (employerFilter && p.employerId !== employerFilter) return false;
        if (projectFilter && p.projectId !== projectFilter) return false;
        return true;
      }),
    [placements, employerFilter, projectFilter],
  );

  const visibleIds = useMemo(() => visible.map((v) => v.id), [visible]);
  const allVisibleSelected = visibleIds.every((id) => selected.has(id));

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const previewShifts = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    let days = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (weekdaysOnly && (dow === 0 || dow === 6)) continue;
      days++;
    }
    return days * selected.size;
  }, [startDate, endDate, weekdaysOnly, selected]);

  const [s_h, s_m] = startTime.split(":").map(Number);
  const [e_h, e_m] = endTime.split(":").map(Number);
  const hoursPerShift = ((e_h * 60 + e_m) - (s_h * 60 + s_m)) / 60;

  return (
    <form action={action} className="space-y-6">
      {/* Hidden selected placement ids */}
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="placement_ids" value={id} />
      ))}

      <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Range & time
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Start date *</span>
            <input
              name="start_date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">End date *</span>
            <input
              name="end_date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Start time</span>
            <input
              name="start_time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">End time</span>
            <input
              name="end_time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="weekdays_only"
              checked={weekdaysOnly}
              onChange={(e) => setWeekdaysOnly(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-yellow-400"
            />
            <span>
              <span className="font-medium">Weekdays only (Mon–Fri)</span>
              <span className="block text-xs text-muted-foreground">
                Skip Saturdays and Sundays when generating shifts.
              </span>
            </span>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Location</span>
            <input
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sunbelt Refinery · Galveston TX"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Placements
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selected.size} of {placements.length} selected · {visible.length} visible
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={employerFilter}
              onChange={(e) => setEmployerFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">All employers</option>
              {employers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleAllVisible}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {allVisibleSelected ? "Deselect visible" : "Select visible"}
            </button>
          </div>
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-border/60">
          {visible.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No active placements match.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {visible.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    aria-label={`Select ${p.worker}`}
                    className="h-4 w-4 rounded border-border accent-yellow-400"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.worker}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.employer} · {p.role}
                      {p.projectName && (
                        <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                          {p.projectName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    ${p.payRate.toFixed(0)}/${p.billRate.toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-accent/40 bg-accent/5 p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Preview
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Shifts to create"
            value={previewShifts.toLocaleString()}
          />
          <Stat
            label="Hours per shift"
            value={Number.isFinite(hoursPerShift) ? hoursPerShift.toFixed(1) : "—"}
            unit="h"
          />
          <Stat
            label="Total hours"
            value={Number.isFinite(hoursPerShift) ? (previewShifts * hoursPerShift).toLocaleString() : "—"}
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={selected.size === 0 || previewShifts === 0}
          className="inline-flex h-11 items-center rounded-md bg-accent px-6 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          Create {previewShifts.toLocaleString()} shifts →
        </button>
        <a
          href="/admin/shifts"
          className="inline-flex h-11 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
