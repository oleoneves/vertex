import { Link2 } from "lucide-react";
import { listPlacements } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";

export const dynamic = "force-dynamic";

export default async function PlacementsPage() {
  const placements = await listPlacements();
  return (
    <div>
      <PageHeader
        title="Placements"
        subtitle="Workers assigned to employers."
        count={placements.length}
        action={{ href: "/admin/placements/new", label: "New placement" }}
      />
      {placements.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-5 w-5" />}
          title="No placements yet"
          body="Create a placement to start scheduling shifts and tracking hours."
        />
      ) : (
        <DataTable
          head={
            <>
              <Th>Worker</Th>
              <Th>Employer</Th>
              <Th>Role</Th>
              <Th>Pay / Bill</Th>
              <Th className="text-right">Margin</Th>
              <Th>Period</Th>
              <Th>Status</Th>
            </>
          }
        >
          {placements.map((p) => {
            const margin = Number(p.bill_rate) - Number(p.pay_rate);
            return (
              <Tr key={p.id}>
                <Td className="font-medium">{p.worker?.full_name ?? "—"}</Td>
                <Td>{p.employer?.name ?? "—"}</Td>
                <Td className="text-muted-foreground">{p.role_title}</Td>
                <Td className="tabular-nums">
                  ${Number(p.pay_rate).toFixed(2)}{" "}
                  <span className="text-muted-foreground">
                    / ${Number(p.bill_rate).toFixed(2)}
                  </span>
                </Td>
                <Td className="text-right font-mono tabular-nums font-semibold text-accent">
                  +${margin.toFixed(2)}/hr
                </Td>
                <Td className="text-xs text-muted-foreground">
                  {p.start_date} → {p.end_date ?? "ongoing"}
                </Td>
                <Td>
                  <StatusPill
                    status={p.status}
                    variant={
                      p.status === "active" ? "green" : p.status === "paused" ? "amber" : "muted"
                    }
                  />
                </Td>
              </Tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
