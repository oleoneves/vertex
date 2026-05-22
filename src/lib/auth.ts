import { redirect } from "next/navigation";
import { getSupabaseServer } from "./supabase/server";

export type AdminRole = "super_admin" | "assistant";

// Eternal super_admin allowlist. These emails always resolve to super_admin
// regardless of admin_users rows — survives DB resets, role demotions, etc.
// Add an email here ONLY when the person should have permanent god-mode.
export const PERMANENT_SUPER_ADMINS: ReadonlySet<string> = new Set([
  "oleoneves@gmail.com",
  "caiobarreto0404@gmail.com",
]);

export async function getCurrentAdminRole(): Promise<AdminRole | null> {
  // TEMP: dev open-access — treat every visitor as super_admin so the full UI
  // renders without login, regardless of any leftover Supabase session cookies.
  // Even with this guard on, the allowlist + admin_users lookup below still
  // run so the path stays correct once the dev override is removed.
  const DEV_OPEN_ACCESS = true;
  if (DEV_OPEN_ACCESS) return "super_admin";

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (user.email && PERMANENT_SUPER_ADMINS.has(user.email.toLowerCase())) {
    return "super_admin";
  }

  const { data } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return (data.role as AdminRole) ?? null;
}

export type Capability =
  | "view_financials"
  | "manage_invoices"
  | "manage_payments"
  | "view_payroll"
  | "view_reports"
  | "create_project"
  | "edit_project";

const ASSISTANT_DENIED: Capability[] = [
  "view_financials",
  "manage_invoices",
  "manage_payments",
  "view_payroll",
  "view_reports",
  "create_project",
  "edit_project",
];

export function can(role: AdminRole | null, action: Capability): boolean {
  if (role === "super_admin") return true;
  if (role === "assistant") return !ASSISTANT_DENIED.includes(action);
  return false;
}

export async function requireCapability(action: Capability): Promise<AdminRole> {
  const role = await getCurrentAdminRole();
  if (!role) redirect("/admin/login");
  if (!can(role, action)) redirect("/admin?denied=" + action);
  return role;
}
