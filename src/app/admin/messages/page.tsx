import { Mail, Building2, HardHat } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";
import { sendComposedEmail } from "../_actions";

export const dynamic = "force-dynamic";

type EmployerContactRow = {
  id: string;
  full_name: string;
  email: string | null;
  position: string;
  employer: { name: string } | null;
};

type WorkerRow = {
  id: string;
  full_name: string;
  email: string | null;
  status: string;
};

type SentEmailRow = {
  id: string;
  kind: string;
  to_emails: string[];
  subject: string;
  sent_at: string;
  status: string;
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const sp = await searchParams;
  const kind = sp.kind === "worker" ? "worker" : sp.kind === "custom" ? "custom" : "contractor";

  const supabase = await getSupabaseServer();
  const [contactsRes, workersRes, sentRes] = await Promise.all([
    supabase
      .from("employer_contacts")
      .select("id, full_name, email, position, employer:employers(name)")
      .order("position"),
    supabase
      .from("workers")
      .select("id, full_name, email, status")
      .eq("status", "active")
      .not("email", "is", null)
      .order("full_name")
      .limit(500),
    supabase
      .from("sent_emails")
      .select("id, kind, to_emails, subject, sent_at, status")
      .order("sent_at", { ascending: false })
      .limit(20),
  ]);

  const contacts = ((contactsRes.data as unknown as EmployerContactRow[]) ?? [])
    .filter((c) => c.email);
  const workers = (workersRes.data as WorkerRow[]) ?? [];
  const sent = (sentRes.data as SentEmailRow[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle="Send emails to contractors or workers. All sends are logged below."
      />

      {/* Kind tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 text-sm">
        <a
          href="/admin/messages?kind=contractor"
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${
            kind === "contractor" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" /> Contractors
        </a>
        <a
          href="/admin/messages?kind=worker"
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${
            kind === "worker" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <HardHat className="h-3.5 w-3.5" /> Workers
        </a>
        <a
          href="/admin/messages?kind=custom"
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${
            kind === "custom" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-3.5 w-3.5" /> Custom email
        </a>
      </div>

      {/* Composer */}
      <form
        action={sendComposedEmail}
        className="rounded-xl border border-border bg-background p-5 space-y-4"
      >
        <input type="hidden" name="kind" value={kind} />

        <div>
          <label className="block text-sm font-medium">Recipients</label>
          {kind === "contractor" && (
            contacts.length === 0 ? (
              <p className="mt-1 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                No employer contacts with email. Add contacts on employer pages.
              </p>
            ) : (
              <div className="mt-1 max-h-56 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 text-sm">
                {contacts.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-background"
                  >
                    <input
                      type="checkbox"
                      name="to"
                      value={c.email ?? ""}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span className="flex-1 truncate">
                      <span className="font-medium">{c.full_name}</span>{" "}
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {c.position.replace("_", " ")}
                      </span>{" "}
                      · {c.employer?.name ?? "—"}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{c.email}</span>
                  </label>
                ))}
              </div>
            )
          )}
          {kind === "worker" && (
            workers.length === 0 ? (
              <p className="mt-1 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                No active workers with email on file.
              </p>
            ) : (
              <div className="mt-1 max-h-56 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 text-sm">
                {workers.slice(0, 100).map((w) => (
                  <label
                    key={w.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-background"
                  >
                    <input
                      type="checkbox"
                      name="to"
                      value={w.email ?? ""}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span className="flex-1 truncate font-medium">{w.full_name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{w.email}</span>
                  </label>
                ))}
                {workers.length > 100 && (
                  <p className="px-2 py-1 text-[11px] text-muted-foreground">
                    +{workers.length - 100} more workers not shown — use Custom email to type addresses directly.
                  </p>
                )}
              </div>
            )
          )}
          {kind === "custom" && (
            <input
              name="to"
              type="email"
              required
              placeholder="someone@example.com  ·  type one address"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Subject</label>
          <input
            name="subject"
            required
            placeholder="Subject…"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea
            name="body"
            required
            rows={8}
            placeholder="Type your message. Line breaks are preserved."
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            The Vertex header + footer are added automatically.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1 rounded-md bg-accent px-4 text-sm font-bold text-accent-foreground hover:opacity-90"
          >
            <Mail className="h-3.5 w-3.5" /> Send
          </button>
        </div>
      </form>

      {/* Recent sends */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Recent sends
        </h2>
        {sent.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No emails sent yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {sent.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s.subject}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {s.to_emails.length} recipient{s.to_emails.length === 1 ? "" : "s"} ·{" "}
                    {s.to_emails.slice(0, 3).join(", ")}
                    {s.to_emails.length > 3 ? "…" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      s.status === "sent"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {s.status}
                  </span>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(s.sent_at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
