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

  const entryId = String(form.get("entry_id") || "");
  const kind = String(form.get("kind") || "before");
  if (!entryId) return new NextResponse("entry_id required", { status: 400 });
  if (!["before", "after"].includes(kind)) {
    return new NextResponse("Invalid kind", { status: 400 });
  }

  const sb = await getSupabaseServer();
  const { data: entry } = await sb
    .from("time_entries")
    .select("worker_id, before_photo_paths, after_photo_paths")
    .eq("id", entryId)
    .maybeSingle();
  const e = entry as
    | { worker_id: string; before_photo_paths: string[] | null; after_photo_paths: string[] | null }
    | null;
  if (!e || e.worker_id !== worker.id) {
    return new NextResponse("Entry not found", { status: 404 });
  }

  const admin = getSupabaseAdmin();
  const photos = form.getAll("photos").filter((f) => f instanceof File) as File[];
  const newPaths: string[] = [];
  for (const f of photos) {
    if (f.size === 0 || f.size > 12 * 1024 * 1024) continue;
    const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase();
    const safe = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg";
    const path = `jobs/${entryId}/${kind}-${crypto.randomUUID()}.${safe}`;
    const { error } = await admin.storage
      .from("incidents")
      .upload(path, f, { contentType: f.type || "image/jpeg", upsert: false });
    if (!error) newPaths.push(path);
  }

  const col = kind === "before" ? "before_photo_paths" : "after_photo_paths";
  const existing = (kind === "before" ? e.before_photo_paths : e.after_photo_paths) ?? [];
  const merged = [...existing, ...newPaths];
  await sb.from("time_entries").update({ [col]: merged }).eq("id", entryId);

  return NextResponse.redirect(new URL("/worker/hours?photo=ok", req.url), 303);
}
