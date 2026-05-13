"use client";

import { useState } from "react";
import { Send, AlertTriangle } from "lucide-react";

function isExampleDomain(email: string): boolean {
  const d = email.split("@").pop()?.toLowerCase() ?? "";
  return (
    d.endsWith(".example") ||
    d === "example.com" ||
    d === "example.org" ||
    d === "example.net"
  );
}

export function SendInvoiceButton({
  invoiceId,
  billingEmail,
  disabled,
}: {
  invoiceId: string;
  billingEmail: string | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrideTo, setOverrideTo] = useState<string>("");

  const billingIsExample = billingEmail ? isExampleDomain(billingEmail) : false;

  async function send(to: string | null) {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: to ? { "content-type": "application/json" } : undefined,
        body: to ? JSON.stringify({ to }) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json().catch(() => null)) as {
        to?: string;
        override?: boolean;
      } | null;
      setMessage(`Sent ✓ to ${data?.to ?? to ?? billingEmail}`);
      setTimeout(() => {
        setOpen(false);
        if (!data?.override) window.location.reload();
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" /> Send by email
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold tracking-tight">Send invoice by email</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The invoice PDF will be attached to a branded email.
        </p>

        {billingIsExample && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <strong>Demo billing_email cannot receive mail.</strong>{" "}
              <code className="font-mono">{billingEmail}</code> uses the{" "}
              <code className="font-mono">.example</code> domain (RFC 2606), which
              bounces by design. Send to your real email below to test.
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {billingEmail && !billingIsExample && (
            <button
              type="button"
              onClick={() => send(null)}
              disabled={sending}
              className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "Sending…" : `Send to ${billingEmail}`}
            </button>
          )}

          <div className="rounded-lg border border-border p-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Send to alternate email (test)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="email"
                value={overrideTo}
                onChange={(e) => setOverrideTo(e.target.value)}
                placeholder="you@yourdomain.com"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                style={{ fontSize: 16 }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => send(overrideTo)}
                disabled={
                  sending ||
                  !overrideTo.includes("@") ||
                  isExampleDomain(overrideTo)
                }
                className="rounded-md bg-accent px-3 py-2 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
            {overrideTo && isExampleDomain(overrideTo) && (
              <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                .example domains bounce — use a real address.
              </p>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">
              Useful for previewing the email without billing the employer.
              Doesn&apos;t change the invoice status.
            </p>
          </div>
        </div>

        {message && (
          <p className="mt-4 rounded-md bg-green-100 px-3 py-2 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-md bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={sending}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
