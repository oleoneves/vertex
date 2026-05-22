import { requireCapability } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "../_components/page-header";
import {
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormActions,
} from "../_components/form";
import {
  createAssistantCredential,
  createEmployerCredential,
  revokeAssistantCredential,
  revokeEmployerCredential,
} from "../_actions";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  await requireCapability("manage_users");

  const admin = getSupabaseAdmin();

  const [adminUsersRes, employerUsersRes, employersRes, authListRes] =
    await Promise.all([
      admin.from("admin_users").select("user_id, role"),
      admin
        .from("employer_users")
        .select("user_id, employer_id, employer:employers(name)"),
      admin.from("employers").select("id, name").order("name"),
      admin.auth.admin.listUsers({ perPage: 200 }),
    ]);

  type AuthUser = { id: string; email?: string };
  const emailById = new Map<string, string>();
  for (const u of (authListRes.data?.users ?? []) as AuthUser[]) {
    if (u.email) emailById.set(u.id, u.email);
  }

  type AdminRow = { user_id: string; role: string };
  type EmployerLinkRow = {
    user_id: string;
    employer_id: string;
    employer: { name: string } | null;
  };
  const adminRows = (adminUsersRes.data ?? []) as AdminRow[];
  const employerRows = (employerUsersRes.data ?? []) as unknown as EmployerLinkRow[];
  const employers = (employersRes.data ?? []) as Array<{ id: string; name: string }>;

  const assistants = adminRows.filter((r) => r.role === "assistant");
  const superAdmins = adminRows.filter((r) => r.role === "super_admin");

  return (
    <div>
      <PageHeader
        title="Access"
        subtitle="Issue credentials for assistants and employer users. Super-admin only."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ============ Assistant credentials ============ */}
        <div>
          <form action={createAssistantCredential} className="space-y-6">
            <FormSection
              title="New assistant"
              description="Limited admin access — no financials, payroll, or reports."
            >
              <FormGrid>
                <FormField label="Full name" name="full_name" required />
                <FormField label="Email" name="email" type="email" required />
                <FormField
                  label="Password"
                  name="password"
                  type="text"
                  required
                  hint="Min. 8 characters. They can change it after first sign-in."
                />
              </FormGrid>
              <FormActions submitLabel="Create assistant" cancelHref="/admin" />
            </FormSection>
          </form>

          <section className="mt-6 rounded-xl border border-border bg-background p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Assistants ({assistants.length})
            </h3>
            {assistants.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No assistants yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {assistants.map((row) => (
                  <li key={row.user_id} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate text-sm">
                      {emailById.get(row.user_id) ?? row.user_id}
                    </span>
                    <form action={revokeAssistantCredential}>
                      <input type="hidden" name="user_id" value={row.user_id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Revoke
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {superAdmins.length > 0 && (
            <section className="mt-4 rounded-xl border border-border bg-muted/30 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Super admins ({superAdmins.length})
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Managed by code allowlist + DB. Revoke from the database directly if needed.
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {superAdmins.map((row) => (
                  <li key={row.user_id} className="truncate">
                    {emailById.get(row.user_id) ?? row.user_id}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ============ Employer credentials ============ */}
        <div>
          <form action={createEmployerCredential} className="space-y-6">
            <FormSection
              title="New employer user"
              description="Gives access to the employer portal scoped to one company."
            >
              <FormGrid>
                <FormField label="Full name" name="full_name" required />
                <FormField label="Email" name="email" type="email" required />
                <FormField
                  label="Password"
                  name="password"
                  type="text"
                  required
                  hint="Min. 8 characters. Share with the employer contact."
                />
                <FormSelect
                  label="Employer"
                  name="employer_id"
                  required
                  options={[
                    { value: "", label: employers.length ? "— select —" : "No employers yet" },
                    ...employers.map((e) => ({ value: e.id, label: e.name })),
                  ]}
                />
              </FormGrid>
              <FormActions submitLabel="Create employer user" cancelHref="/admin" />
            </FormSection>
          </form>

          <section className="mt-6 rounded-xl border border-border bg-background p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Employer users ({employerRows.length})
            </h3>
            {employerRows.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No employer users yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {employerRows.map((row) => (
                  <li key={row.user_id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {emailById.get(row.user_id) ?? row.user_id}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.employer?.name ?? "—"}
                      </p>
                    </div>
                    <form action={revokeEmployerCredential}>
                      <input type="hidden" name="user_id" value={row.user_id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Revoke
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
