import { getSupabaseServer } from "./supabase/server";
import { getSupabaseAdmin } from "./supabase/admin";

export type ProjectTimesheet = {
  id: string;
  project_id: string;
  employer_id: string;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  period_start: string | null;
  period_end: string | null;
  source_company: string | null;
  total_hours_claimed: number | null;
  status: "pending" | "reconciled" | "disputed" | "archived";
  notes: string | null;
  uploaded_at: string;
};

export type ProjectTimesheetWithUrl = ProjectTimesheet & {
  signedUrl: string | null;
};

export async function listProjectTimesheets(
  projectId: string,
): Promise<ProjectTimesheetWithUrl[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("project_timesheets")
    .select("*")
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false });
  const rows = (data as ProjectTimesheet[]) ?? [];
  const signed = await Promise.all(
    rows.map((r) => signedTimesheetUrl(r.storage_path)),
  );
  return rows.map((r, i) => ({ ...r, signedUrl: signed[i] }));
}

export async function signedTimesheetUrl(path: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from("timesheets")
    .createSignedUrl(path, 60 * 10);
  if (error || !data) return null;
  return data.signedUrl;
}
