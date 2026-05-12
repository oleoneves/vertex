import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const ApplySchema = z.object({
  job_id: z.string().min(1),
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  experience_summary: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new NextResponse("Invalid form data", { status: 400 });
  }

  const parsed = ApplySchema.safeParse({
    job_id: form.get("job_id"),
    full_name: form.get("full_name"),
    email: form.get("email"),
    phone: form.get("phone"),
    experience_summary: form.get("experience_summary"),
  });
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }

  if (!supabaseConfigured) {
    // Dev mode without DB — accept and log.
    console.info("[apply] received (mock)", parsed.data);
    return NextResponse.json({ ok: true, mock: true });
  }

  const supabase = getSupabaseAdmin();
  const cvFile = form.get("cv");
  let cvUrl: string | null = null;

  if (cvFile instanceof File && cvFile.size > 0) {
    if (cvFile.size > 8 * 1024 * 1024) {
      return new NextResponse("CV file too large (max 8MB)", { status: 400 });
    }
    const ext = cvFile.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const key = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("cvs")
      .upload(key, cvFile, { contentType: cvFile.type || "application/pdf" });
    if (upErr) {
      console.error("[apply] cv upload failed", upErr);
    } else {
      cvUrl = key;
    }
  }

  // Upsert candidate by email
  const { data: candidate, error: candErr } = await supabase
    .from("candidates")
    .upsert(
      {
        email: parsed.data.email,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone ?? null,
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();
  if (candErr || !candidate) {
    console.error("[apply] candidate upsert failed", candErr);
    return new NextResponse("Failed to record candidate", { status: 500 });
  }

  const { data: application, error: appErr } = await supabase
    .from("applications")
    .insert({
      job_id: parsed.data.job_id,
      candidate_id: candidate.id,
      cv_url: cvUrl,
      experience_summary: parsed.data.experience_summary ?? null,
    })
    .select("id")
    .single();
  if (appErr || !application) {
    console.error("[apply] application insert failed", appErr);
    return new NextResponse("Failed to record application", { status: 500 });
  }

  // Fire-and-forget AI triage (don't block the response)
  if (process.env.AI_GATEWAY_API_KEY) {
    fetch(new URL("/api/triage", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: application.id }),
    }).catch((e) => console.warn("[apply] triage trigger failed", e));
  }

  return NextResponse.json({ ok: true, id: application.id });
}
