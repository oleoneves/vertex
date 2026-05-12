import { HardHat } from "lucide-react";
import { listWorkers } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";

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

export default async function WorkersPage() {
  const workers = await listWorkers();
  return (
    <div>
      <PageHeader
        title="Workers"
        subtitle="Hired labors actively on the platform."
        count={workers.length}
        action={{ href: "/admin/workers/new", label: "New worker" }}
      />
      {workers.length === 0 ? (
        <EmptyState
          icon={<HardHat className="h-5 w-5" />}
          title="No workers yet"
          body="Convert applications into workers as you onboard them."
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
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {initials(w.full_name)}
                  </span>
                  <span className="font-medium">{w.full_name}</span>
                </div>
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
