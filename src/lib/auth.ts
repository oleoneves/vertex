import { redirect } from "next/navigation";

export type AdminRole = "super_admin" | "assistant";

export async function getCurrentAdminRole(): Promise<AdminRole | null> {
  // TEMP: dev open-access — treat every visitor as super_admin so the full UI
  // renders without login, regardless of any leftover Supabase session cookies.
  return "super_admin";
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
