import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ application_id: z.string().uuid() });

const TriageOutput = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().max(400),
  strengths: z.array(z.string()).max(5),
  concerns: z.array(z.string()).max(5),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return new NextResponse("Invalid body", { status: 400 });
  }
  if (!process.env.AI_GATEWAY_API_KEY) {
    return new NextResponse("AI Gateway not configured", { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const { data: app } = await supabase
    .from("applications")
    .select("id, experience_summary, cv_url, job:jobs(title, description, requirements)")
    .eq("id", parsed.data.application_id)
    .maybeSingle();
  if (!app) return new NextResponse("Application not found", { status: 404 });

  let cvText = "";
  if (app.cv_url) {
    const { data: cv } = await supabase.storage.from("cvs").download(app.cv_url);
    if (cv) {
      try {
        const buf = new Uint8Array(await cv.arrayBuffer());
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buf });
        const out = await parser.getText();
        cvText = (out.text || "").slice(0, 8000);
        await parser.destroy();
      } catch (e) {
        console.warn("[triage] pdf parse failed", e);
      }
    }
  }

  const job = (app.job ?? {}) as { title?: string; description?: string; requirements?: string };
  const prompt = `You are a hiring screener. Score this candidate against the job.

JOB:
Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements ?? "(none specified)"}

CANDIDATE SUMMARY (self-reported):
${app.experience_summary ?? "(none)"}

CANDIDATE CV (extracted text, may be truncated):
${cvText || "(no CV provided)"}

Score 0-100 (100 = perfect fit). Be honest. Brief summary, key strengths, key concerns.`;

  try {
    const result = await generateObject({
      model: "anthropic/claude-sonnet-4-6",
      schema: TriageOutput,
      prompt,
    });
    await supabase
      .from("applications")
      .update({
        ai_score: result.object.score,
        ai_summary: `${result.object.summary}\n\nStrengths: ${result.object.strengths.join("; ")}\nConcerns: ${result.object.concerns.join("; ")}`,
        status: "reviewing",
      })
      .eq("id", parsed.data.application_id);
    return NextResponse.json({ ok: true, score: result.object.score });
  } catch (e) {
    console.error("[triage] failed", e);
    return new NextResponse("Triage failed", { status: 500 });
  }
}
