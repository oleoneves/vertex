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

  // Fire-and-forget confirmation email (Resend)
  if (process.env.RESEND_API_KEY && parsed.data.email) {
    sendApplicationConfirmation({
      to: parsed.data.email,
      candidateName: parsed.data.full_name,
      jobId: parsed.data.job_id,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin,
    }).catch((e) => console.warn("[apply] confirmation email failed", e));
  }

  return NextResponse.json({ ok: true, id: application.id });
}

async function sendApplicationConfirmation({
  to,
  candidateName,
  jobId,
  siteUrl,
}: {
  to: string;
  candidateName: string;
  jobId: string;
  siteUrl: string;
}) {
  const { getEmailClient, fromAddress } = await import("@/lib/email");
  const { brand } = await import("@/lib/brand");
  const client = getEmailClient();
  if (!client) return;

  const supabase = getSupabaseAdmin();
  const { data: job } = await supabase
    .from("jobs")
    .select("title, employer, location_city, location_state, slug")
    .eq("id", jobId)
    .maybeSingle();

  const jobName = (job as { title?: string } | null)?.title ?? "the role";
  const jobLocation =
    job && "location_city" in job
      ? `${(job as { location_city: string }).location_city}, ${(job as { location_state: string }).location_state}`
      : "";
  const jobUrl =
    job && "slug" in job ? `${siteUrl}/jobs/${(job as { slug: string }).slug}` : siteUrl;

  await client.emails.send({
    from: fromAddress(),
    to,
    subject: `We received your application for ${jobName} — ${brand.name}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border-radius:14px;border:1px solid #e5e5e5;overflow:hidden;">
<tr><td style="padding:24px 28px;background:#0a0a0a;color:#fff;">
<table><tr><td style="padding-right:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="22" viewBox="0 0 40 48"><path d="M2 4 L20 44 L38 4 L30 4 L20 26 L10 4 Z" fill="#FACC15"/></svg></td><td style="font-weight:900;font-size:18px;letter-spacing:2px;">VERTEX</td></tr></table>
</td></tr>
<tr><td style="padding:32px 28px;">
<p style="margin:0 0 6px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:#facc15;">Application received</p>
<h1 style="margin:0 0 18px;font-size:24px;">Hi ${escapeHtml(candidateName.split(" ")[0])},</h1>
<p style="margin:0 0 16px;color:#444;line-height:1.6;">Thanks for applying to <strong>${escapeHtml(jobName)}</strong>${jobLocation ? ` in ${escapeHtml(jobLocation)}` : ""}. We received your application and our team is reviewing it now.</p>
<p style="margin:0 0 16px;color:#444;line-height:1.6;">If your profile matches what the employer is looking for, we'll reach out by phone or email within <strong>1–3 business days</strong>.</p>
<p style="margin:0 0 20px;"><a href="${escapeHtml(jobUrl)}" style="display:inline-block;background:#facc15;color:#0a0a0a;text-decoration:none;font-weight:900;padding:13px 24px;border-radius:8px;">View the job →</a></p>
<p style="margin:0;color:#666;font-size:13px;line-height:1.5;">Questions? Just reply to this email or write to ${escapeHtml(brand.supportEmail)}.<br/>Vertex never charges workers — applying is and always will be free.</p>
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e5e5e5;color:#888;font-size:11px;line-height:1.5;">
© ${new Date().getFullYear()} ${escapeHtml(brand.legalName)}. Built in the United States. Hablamos español. Falamos português.
</td></tr></table></td></tr></table></body></html>`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
