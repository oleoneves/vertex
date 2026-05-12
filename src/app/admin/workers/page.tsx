import Link from "next/link";
import { HardHat } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Worker } from "@/types/db";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

async function load(filters: { status?: string; q?: string }): Promise<Worker[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await getSupabaseServer();
  let q = supabase
    .from("workers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.q) q = q.or(`full_name.ilike.%${filters.q}%,employee_code.ilike.%${filters.q}%,email.ilike.%${filters.q}%`);
  const { data } = await q;
  return (data as Worker[]) ?? [];
}

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const workers = await load(sp);
  return (
    <div>
      <PageHeader
        title="Workers"
        subtitle="Hired labors actively on the platform."
        count={workers.length}
        action={{ href: "/admin/workers/new", label: "New worker" }}
      />
      <FilterBar
        searchValue={sp.q}
        searchPlaceholder="Search name, code or email…"
        filters={[
          {
            name: "status",
            label: "Status",
            value: sp.status,
            options: [
              { value: "active", label: "Active" },
              { value: "onboarding", label: "Onboarding" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
      />
      {workers.length === 0 ? (
        <EmptyState
          icon={<HardHat className="h-5 w-5" />}
          title="No workers match"
          body="Adjust filters, or convert applications into workers as you onboard them."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>Name</Th>
              <Th>Code</Th>
              <Th>Status</Th>
              <Th>Pay rate</Th>
              <Th>Contact</Th>
            </>
          }
        >
          {workers.map((w) => (
            <Tr key={w.id}>
              <Td>
                <Link
                  href={`/admin/workers/${w.id}`}
                  className="flex items-center gap-2 hover:text-accent"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {initials(w.full_name)}
                  </span>
                  <span className="font-medium">{w.full_name}</span>
                </Link>
              </Td>
              <Td>
                <span className="font-mono text-xs text-muted-foreground">
                  {w.employee_code ?? "—"}
                </span>
              </Td>
              <Td>
                <StatusPill
                  status={w.status}
                  variant={
                    w.status === "active" ? "green" : w.status === "onboarding" ? "amber" : "muted"
                  }
                />
              </Td>
              <Td className="tabular-nums">
                {w.default_pay_rate ? `$${Number(w.default_pay_rate).toFixed(2)}/hr` : "—"}
              </Td>
              <Td className="text-xs text-muted-foreground">{w.email ?? w.phone ?? "—"}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
