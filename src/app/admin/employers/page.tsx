import { Building2 } from "lucide-react";
import { listEmployers } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td } from "../_components/data-table";

export const dynamic = "force-dynamic";

export default async function EmployersPage() {
  const employers = await listEmployers();
  return (
    <div>
      <PageHeader
        title="Employers"
        subtitle="Companies Vertex bills for placements."
        count={employers.length}
        action={{ href: "/admin/employers/new", label: "New employer" }}
      />
      {employers.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="No employers yet"
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
