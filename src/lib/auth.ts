import { redirect } from "next/navigation";
import { getSupabaseServer } from "./supabase/server";

export type AdminRole = "super_admin" | "assistant";

export async function getCurrentAdminRole(): Promise<AdminRole | null> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // TEMP: open-access mode — no signed-in user → treat as super_admin so full UI renders.
  if (!user) return "super_admin";
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
