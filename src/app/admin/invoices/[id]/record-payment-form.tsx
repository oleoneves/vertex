"use client";

import { useState, useTransition } from "react";
import { CreditCard, Check } from "lucide-react";

type Method = "ach" | "check" | "wire" | "zelle" | "cashapp" | "stripe";

const METHODS: { value: Method; label: string }[] = [
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire" },
  { value: "check", label: "Check" },
  { value: "zelle", label: "Zelle" },
  { value: "cashapp", label: "Cash App" },
  { value: "stripe", label: "Stripe" },
];

export function RecordPaymentForm({
  invoiceId,
  defaultAmount,
  defaultReference,
  disabled,
  action,
}: {
  invoiceId: string;
  defaultAmount: number;
  defaultReference: string;
  disabled?: boolean;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("id", invoiceId);
    setError(null);
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) {
        setDone(true);
        setTimeout(() => window.location.reload(), 700);
      } else {
        setError(res.error ?? "Failed to record payment.");
      }
    });
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1 rounded-md bg-green-600/50 px-3 py-1.5 text-sm font-medium text-white"
      >
        <Check className="h-3.5 w-3.5" /> Paid
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-green-700"
      >
        <CreditCard className="h-3.5 w-3.5" /> Record payment
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold tracking-tight">Record payment</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Marks the invoice as paid and creates a payment row.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground">Amount (USD)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="amount"
              defaultValue={defaultAmount.toFixed(2)}
              required
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: 16 }}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground">Method</span>
            <select
              name="method"
              defaultValue="ach"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: 16 }}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground">
              Reference / transaction #
            </span>
            <input
              type="text"
              name="reference"
              defaultValue={defaultReference}
              placeholder="ACH-INV-01001"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: 16 }}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground">Received on</span>
            <input
              type="date"
              name="occurred_at"
              defaultValue={today}
              required
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: 16 }}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground">Notes (optional)</span>
            <textarea
              name="notes"
              rows={2}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: 16 }}
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || done}
            className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {done ? "Saved ✓" : pending ? "Saving…" : "Save payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
