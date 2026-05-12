"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function SendInvoiceButton({
  invoiceId,
  billingEmail,
  disabled,
}: {
  invoiceId: string;
  billingEmail: string | null;
  disabled?: boolean;
}) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!billingEmail) {
      setError("Set a billing_email on the employer first.");
      return;
    }
    const ok = window.confirm(`Email this invoice (with PDF attached) to ${billingEmail}?`);
    if (!ok) return;

    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed");
      setMessage("Sent ✓");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={send}
        disabled={sending || disabled}
        className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" />
        {sending ? "Sending…" : "Send to employer"}
      </button>
      {message && <span className="text-xs text-green-600 dark:text-green-400">{message}</span>}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
