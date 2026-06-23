import { EstimateGenerator } from "./estimate-generator";

export const dynamic = "force-dynamic";

export default function EstimatesPage() {
  // Employers are loaded client-side (see ./employers route) so the page
  // renders instantly instead of blocking on a slow Supabase query.
  return <EstimateGenerator />;
}
