import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const UploadSchema = z.object({
  type: z.enum([
    "i9",
    "w9",
    "drivers_license",
    "ssn_card",
    "work_authorization",
    "osha10",
    "osha30",
    "iicrc_wrt",
    "iicrc_amrt",
    "workers_comp",
    "photo",
    "other",
  ]),
  notes: z.string().max(500).optional().nullable(),
});

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

  const parsed = UploadSchema.safeParse({
    type: form.get("type"),
    notes: form.get("notes"),
  });
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return new NextResponse("Missing file", { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return new NextResponse("File too large (max 12MB)", { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "bin";
  const storagePath = `${worker.id}/${parsed.data.type}/${crypto.randomUUID()}.${safeExt}`;

  const admin = getSupabaseAdmin();
  const { error: upErr } = await admin.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return new NextResponse(`Upload failed: ${upErr.message}`, { status: 500 });
  }

  const { error: insErr } = await admin.from("documents").insert({
    worker_id: worker.id,
    type: parsed.data.type,
    filename: file.name,
    storage_path: storagePath,
    notes: parsed.data.notes ?? null,
  });
  if (insErr) {
    return new NextResponse(`DB insert failed: ${insErr.message}`, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
