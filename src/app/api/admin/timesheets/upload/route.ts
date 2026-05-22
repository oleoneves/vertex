import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/heic",
  "image/heif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);

const Schema = z.object({
  project_id: z.string().uuid(),
  kind: z.enum(["timesheet", "contract"]).optional(),
  period_start: z.string().optional().nullable(),
  period_end: z.string().optional().nullable(),
  source_company: z.string().max(120).optional().nullable(),
  total_hours_claimed: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: isAdminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isAdminRow) return new NextResponse("Forbidden", { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new NextResponse("Invalid form data", { status: 400 });
  }

  const parsed = Schema.safeParse({
    project_id: form.get("project_id"),
    kind: form.get("kind") || undefined,
    period_start: form.get("period_start") || null,
    period_end: form.get("period_end") || null,
    source_company: form.get("source_company") || null,
    total_hours_claimed: form.get("total_hours_claimed") || null,
    notes: form.get("notes") || null,
  });
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return new NextResponse("Missing file", { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return new NextResponse("File too large (max 20MB)", { status: 400 });
  }
  if (file.type && ACCEPTED_MIME.size > 0 && !ACCEPTED_MIME.has(file.type)) {
    return new NextResponse(`Unsupported file type: ${file.type}`, { status: 415 });
  }

  const admin = getSupabaseAdmin();

  const { data: project, error: projErr } = await admin
    .from("projects")
    .select("id, employer_id")
    .eq("id", parsed.data.project_id)
    .maybeSingle();
  if (projErr || !project) {
    return new NextResponse("Project not found", { status: 404 });
  }

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "bin";
  const storagePath = `${project.id}/${crypto.randomUUID()}.${safeExt}`;

  const { error: upErr } = await admin.storage
    .from("timesheets")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return new NextResponse(`Upload failed: ${upErr.message}`, { status: 500 });
  }

  const totalHours = parsed.data.total_hours_claimed
    ? Number(parsed.data.total_hours_claimed)
    : null;

  const { data: row, error: insErr } = await admin
    .from("project_timesheets")
    .insert({
      project_id: project.id,
      employer_id: project.employer_id,
      kind: parsed.data.kind ?? "timesheet",
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      period_start: parsed.data.period_start || null,
      period_end: parsed.data.period_end || null,
      source_company: parsed.data.source_company || null,
      total_hours_claimed: Number.isFinite(totalHours) ? totalHours : null,
      notes: parsed.data.notes || null,
      uploaded_by: user.id,
    })
    .select("id")
    .single();
  if (insErr) {
    await admin.storage.from("timesheets").remove([storagePath]);
    return new NextResponse(`DB insert failed: ${insErr.message}`, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: row.id });
}
