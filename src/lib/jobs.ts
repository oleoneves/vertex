import "server-only";
import type { Job } from "@/types/db";
import { MOCK_JOBS } from "./jobs-mock";
import { getSupabaseServer } from "./supabase/server";

function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function listJobs(opts: {
  state?: string;
  category?: string;
  q?: string;
} = {}): Promise<Job[]> {
  if (!supabaseConfigured()) {
    return MOCK_JOBS.filter((j) => {
      if (opts.state && j.location_state !== opts.state) return false;
      if (opts.category && j.category !== opts.category) return false;
      if (opts.q) {
        const q = opts.q.toLowerCase();
        const hay = `${j.title} ${j.employer} ${j.location_city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  const supabase = await getSupabaseServer();
  let query = supabase.from("jobs").select("*").eq("active", true).order("featured", { ascending: false }).order("created_at", { ascending: false });
  if (opts.state) query = query.eq("location_state", opts.state);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.q) query = query.ilike("title", `%${opts.q}%`);
  const { data, error } = await query;
  if (error || !data) return [];
  return data as Job[];
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  if (!supabaseConfigured()) {
    return MOCK_JOBS.find((j) => j.slug === slug) ?? null;
  }
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as Job;
}

export function listCategories(jobs: Job[]): string[] {
  return Array.from(new Set(jobs.map((j) => j.category))).sort();
}

export function listStates(jobs: Job[]): string[] {
  return Array.from(new Set(jobs.map((j) => j.location_state))).sort();
}
