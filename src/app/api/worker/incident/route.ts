import { NextResponse } from "next/server";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const worker = await getCurrentWorker();
  if (!worker) return new NextResponse("Unauthorized", { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new NextResponse("Invalid form data", { status: 400 });
  }

  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  if (!title || !description) {
    return new NextResponse("Title and description are required", { status: 400 });
  }
  const severityRaw = String(form.get("severity") || "low");
  const severity = ["low", "medium", "high", "critical"].includes(severityRaw)
    ? severityRaw
    : "low";

  const admin = getSupabaseAdmin();
  const photos = form.getAll("photos").filter((f) => f instanceof File) as File[];
  const files = form.getAll("files").filter((f) => f instanceof File) as File[];

  const photoPaths: string[] = [];
  for (const f of photos) {
    if (f.size === 0 || f.size > 12 * 1024 * 1024) continue;
    const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase();
    const safe = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg";
    const path = `${worker.id}/${crypto.randomUUID()}.${safe}`;
    const { error } = await admin.storage
      .from("incidents")
      .upload(path, f, { contentType: f.type || "image/jpeg", upsert: false });
    if (!error) photoPaths.push(path);
  }
  const filePaths: string[] = [];
  for (const f of files) {
    if (f.size === 0 || f.size > 20 * 1024 * 1024) continue;
    const ext = (f.name.split(".").pop() ?? "bin").toLowerCase();
    const safe = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "bin";
    const path = `${worker.id}/files/${crypto.randomUUID()}.${safe}`;
    const { error } = await admin.storage
      .from("incidents")
      .upload(path, f, { contentType: f.type || "application/octet-stream", upsert: false });
    if (!error) filePaths.push(path);
  }

  const sb = await getSupabaseServer();
  const { error } = await sb.from("incident_reports").insert({
    worker_id: worker.id,
    title,
    description,
    severity,
    photo_paths: photoPaths,
    file_paths: filePaths,
  });
  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.redirect(new URL("/worker/report?ok=1", req.url), 303);
}
