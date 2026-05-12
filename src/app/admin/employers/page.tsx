import { Building2 } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Employer } from "@/types/db";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";

export const dynamic = "force-dynamic";

async function load(filters: { q?: string }): Promise<Employer[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("employers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.q)
    q = q.or(`name.ilike.%${filters.q}%,contact_name.ilike.%${filters.q}%,billing_email.ilike.%${filters.q}%`);
  const { data } = await q;
  return (data as Employer[]) ?? [];
}

export default async function EmployersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const employers = await load(sp);
  return (
    <div>
      <PageHeader
        title="Employers"
        subtitle="Companies Vertex bills for placements."
        count={employers.length}
        action={{ href: "/admin/employers/new", label: "New employer" }}
      />
      <FilterBar
        searchValue={sp.q}
        searchPlaceholder="Search name, contact, or email…"
      />
      {employers.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="No employers match"
          body="Add an employer before you can create a placement."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Bill ×</Th>
              <Th>Terms</Th>
            </>
          }
        >
          {employers.map((e) => (
            <Tr key={e.id}>
              <Td className="font-medium">{e.name}</Td>
              <Td className="text-xs text-muted-foreground">
                <div>{e.contact_name ?? "—"}</div>
                {e.billing_email && (
                  <a
                    href={`mailto:${e.billing_email}`}
                    className="text-accent hover:underline"
                  >
                    {e.billing_email}
                  </a>
                )}
              </Td>
              <Td className="font-mono tabular-nums">{e.bill_rate_multiplier}×</Td>
              <Td className="text-xs text-muted-foreground">Net {e.payment_terms_days}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
