import { getSupabaseServer } from "@/lib/supabase/server";
import { EstimateGenerator, type EmployerOption } from "./estimate-generator";

export const dynamic = "force-dynamic";

async function loadEmployers(): Promise<EmployerOption[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("employers")
    .select(
      "id, name, contact_name, billing_email, billing_address, hourly_bill_rate, per_diem_rate, travel_time_rate"
    )
    .order("name", { ascending: true })
    .limit(500);
  return (data as EmployerOption[]) ?? [];
}

export default async function EstimatesPage() {
  const employers = await loadEmployers();
  return <EstimateGenerator employers={employers} />;
}
