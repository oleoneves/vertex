import { Link2 } from "lucide-react";
import { listPlacements } from "@/lib/workforce";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { endPlacement } from "../_actions";
import { getCurrentAdminRole, can } from "@/lib/auth";

import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export const dynamic = "force-dynamic";

export default async function PlacementsPage() {
  const locale = await getLocale();
  const [placements, role] = await Promise.all([listPlacements(), getCurrentAdminRole()]);
  const showMoney = can(role, "view_financials");
  return (
    <div>
      <PageHeader
        title={t(locale, "a.placements.title")}
        subtitle={t(locale, "a.placements.subtitle")}
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
              {showMoney && <Th>Pay / Bill</Th>}
              {showMoney && <Th className="text-right">Margin</Th>}
              <Th>Period</Th>
              <Th>Status</Th>
              <Th></Th>
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
                {showMoney && (
                  <Td className="tabular-nums">
                    {fmtUsd(p.pay_rate, { decimals: 2 })}{" "}
                    <span className="text-muted-foreground">
                      / {fmtUsd(p.bill_rate, { decimals: 2 })}
                    </span>
                  </Td>
                )}
                {showMoney && (
                  <Td className="text-right font-mono tabular-nums font-semibold text-accent">
                    +{fmtUsd(margin, { decimals: 2 })}/hr
                  </Td>
                )}
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
                <Td>
                  {p.status === "active" && (
                    <form action={endPlacement} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                      >
                        End
                      </button>
                    </form>
                  )}
                </Td>
              </Tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
