"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { Search, LogIn, LogOut, Check, X, ArrowLeft, KeyRound } from "lucide-react";
import { kioskAuth, kioskClockIn, kioskClockOut, kioskLoadWorkerContext } from "./actions";

type WorkerLite = {
  id: string;
  full_name: string;
  employee_code: string | null;
};

type Labels = {
  title: string;
  subtitle: string;
  search: string;
  enterPin: string;
  wrongPin: string;
  cancel: string;
  clockIn: string;
  clockOut: string;
  onClock: string;
  since: string;
  pickPlacement: string;
  noPlacements: string;
  successIn: string;
  successOut: string;
  welcome: string;
  breakMinutes: string;
  demoPinHint: string;
};

type Step =
  | { kind: "pick_worker" }
  | { kind: "pin"; worker: WorkerLite; error?: string }
  | { kind: "loading" }
  | { kind: "choose_placement"; worker: WorkerLite; placements: Array<{ id: string; role_title: string; employer: string }> }
  | { kind: "confirm_clockout"; worker: WorkerLite; clockInAt: string }
  | { kind: "success"; mode: "in" | "out"; worker: WorkerLite };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function elapsed(iso: string): string {
  const mins = Math.floor((Date.now() - +new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function KioskClient({
  workers,
  labels,
  demoMode,
}: {
  workers: WorkerLite[];
  labels: Labels;
  demoMode: boolean;
}) {
  const [step, setStep] = useState<Step>({ kind: "pick_worker" });
  const [query, setQuery] = useState("");
  const [pin, setPin] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workers.slice(0, 60);
    return workers
      .filter(
        (w) =>
          w.full_name.toLowerCase().includes(q) ||
          (w.employee_code ?? "").toLowerCase().includes(q),
      )
      .slice(0, 60);
  }, [workers, query]);

  // Auto-return to home after success
  useEffect(() => {
    if (step.kind === "success") {
      const t = setTimeout(() => {
        setStep({ kind: "pick_worker" });
        setQuery("");
        setPin("");
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Focus pin input when entering pin step
  useEffect(() => {
    if (step.kind === "pin") {
      setPin("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [step]);

  function pickWorker(w: WorkerLite) {
    setStep({ kind: "pin", worker: w });
  }

  function submitPin() {
    if (step.kind !== "pin") return;
    if (pin.length !== 4) return;
    const fd = new FormData();
    fd.set("worker_id", step.worker.id);
    fd.set("pin", pin);
    const worker = step.worker;
    startTransition(async () => {
      const res = await kioskAuth(fd);
      if (!res.ok) {
        setStep({ kind: "pin", worker, error: labels.wrongPin });
        setPin("");
        return;
      }
      setStep({ kind: "loading" });
      const ctx = await kioskLoadWorkerContext(worker.id);
      if (ctx.openEntryClockInAt) {
        setStep({ kind: "confirm_clockout", worker, clockInAt: ctx.openEntryClockInAt });
      } else {
        setStep({ kind: "choose_placement", worker, placements: ctx.placements });
      }
    });
  }

  function clockIn(placementId: string) {
    if (step.kind !== "choose_placement") return;
    const worker = step.worker;
    const fd = new FormData();
    fd.set("worker_id", worker.id);
    fd.set("placement_id", placementId);
    // Try geolocation
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fd.set("location", `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`);
          submitClockIn(fd, worker);
        },
        () => submitClockIn(fd, worker),
        { timeout: 4000 },
      );
    } else {
      submitClockIn(fd, worker);
    }
  }

  function submitClockIn(fd: FormData, worker: WorkerLite) {
    startTransition(async () => {
      const res = await kioskClockIn(fd);
      if (res.ok) setStep({ kind: "success", mode: "in", worker });
    });
  }

  function clockOut() {
    if (step.kind !== "confirm_clockout") return;
    const worker = step.worker;
    const fd = new FormData();
    fd.set("worker_id", worker.id);
    fd.set("break_minutes", "0");
    startTransition(async () => {
      const res = await kioskClockOut(fd);
      if (res.ok) setStep({ kind: "success", mode: "out", worker });
    });
  }

  // RENDER

  if (step.kind === "success") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full ${
            step.mode === "in"
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
          }`}
        >
          <Check className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight">
          {step.mode === "in" ? labels.successIn : labels.successOut}
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          {labels.welcome} <span className="font-semibold text-foreground">{step.worker.full_name.split(" ")[0]}</span>
        </p>
      </div>
    );
  }

  if (step.kind === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-accent" />
      </div>
    );
  }

  if (step.kind === "pin") {
    return (
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => setStep({ kind: "pick_worker" })}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {labels.cancel}
        </button>
        <div className="mt-6 rounded-2xl border border-border bg-background p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-bold">
            {initials(step.worker.full_name)}
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">{step.worker.full_name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <KeyRound className="inline h-3 w-3" /> {labels.enterPin}
          </p>
          <div className="mt-6">
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              autoComplete="off"
              className="mx-auto block w-32 rounded-md border-2 border-border bg-background py-4 text-center text-4xl font-mono tracking-[0.5em] tabular-nums focus:border-accent focus:outline-none"
              style={{ fontSize: 32 }}
            />
            {step.error && (
              <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{step.error}</p>
            )}
            {demoMode && (
              <p className="mt-3 text-[10px] text-muted-foreground">
                {labels.demoPinHint}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={submitPin}
            disabled={pin.length !== 4 || pending}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-foreground px-4 text-base font-bold text-background hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "…" : "→"}
          </button>
        </div>
      </div>
    );
  }

  if (step.kind === "choose_placement") {
    return (
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => setStep({ kind: "pick_worker" })}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {labels.cancel}
        </button>
        <h2 className="mt-6 text-2xl font-bold tracking-tight">
          {labels.welcome} {step.worker.full_name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{labels.pickPlacement}</p>
        {step.placements.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {labels.noPlacements}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {step.placements.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => clockIn(p.id)}
                  disabled={pending}
                  className="w-full rounded-xl border border-border bg-background p-4 text-left transition hover:border-accent hover:bg-accent/5 disabled:opacity-50"
                >
                  <div className="font-semibold">{p.employer}</div>
                  <div className="text-sm text-muted-foreground">{p.role_title}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {step.placements.length > 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <LogIn className="inline h-3 w-3" /> Tap a placement to {labels.clockIn.toLowerCase()}
          </p>
        )}
      </div>
    );
  }

  if (step.kind === "confirm_clockout") {
    return (
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => setStep({ kind: "pick_worker" })}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {labels.cancel}
        </button>
        <div className="mt-6 rounded-2xl border-2 border-green-500/40 bg-green-500/5 p-6 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            {labels.onClock}
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            {step.worker.full_name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {labels.since}{" "}
            <span className="font-mono font-bold text-foreground">
              {new Date(step.clockInAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>{" "}
            · {elapsed(step.clockInAt)}
          </p>
          <button
            type="button"
            onClick={clockOut}
            disabled={pending}
            className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-lg font-extrabold text-background hover:opacity-90 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            {pending ? "…" : labels.clockOut}
          </button>
        </div>
      </div>
    );
  }

  // pick_worker
  return (
    <div className="mx-auto max-w-4xl">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.search}
          autoFocus
          className="block w-full rounded-xl border border-border bg-background py-3 pl-10 pr-3 text-base focus:border-accent focus:outline-none"
          style={{ fontSize: 16 }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>

      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => pickWorker(w)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:border-accent hover:bg-accent/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {initials(w.full_name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{w.full_name}</span>
                {w.employee_code && (
                  <span className="block truncate font-mono text-[10px] text-muted-foreground">
                    {w.employee_code}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          —
        </p>
      )}
    </div>
  );
}
