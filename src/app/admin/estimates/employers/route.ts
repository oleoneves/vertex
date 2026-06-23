import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { EmployerOption } from "../estimate-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Loaded client-side so the estimate page renders instantly instead of
// blocking server render on this (non-critical) prefill query.
export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ employers: [] as EmployerOption[] });
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("employers")
    .select(
      "id, name, contact_name, billing_email, billing_address, hourly_bill_rate, per_diem_rate, travel_time_rate"
    )
    .order("name", { ascending: true })
    .limit(500);
  return NextResponse.json({ employers: (data as EmployerOption[]) ?? [] });
}
