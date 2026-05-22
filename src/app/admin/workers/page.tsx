import Link from "next/link";
import { HardHat } from "lucide-react";
import { Pagination } from "../_components/pagination";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Worker } from "@/types/db";
import { isDemoMode, demoWorkers, demoWorkersByState } from "@/lib/demo";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { DataTable, Th, Tr, Td, StatusPill } from "../_components/data-table";
import { FilterBar } from "../_components/filter-bar";
import { HorizontalBarChart, USTileMap, CHART_COLORS } from "../../_components/charts";
import { StarRating } from "../_components/star-rating";
import { FavoriteToggle } from "../_components/favorite-toggle";
import { TierBadge } from "../_components/tier-badge";
import { reliabilityFromWorker } from "@/lib/reliability";

import { fmtUsd, fmtNum } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
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

async function load(filters: {
  status?: string;
  q?: string;
  favorite?: string;
  tier?: string;
}): Promise<Worker[]> {
  if (isDemoMode()) {
    let workers = demoWorkers();
    if (filters.status) workers = workers.filter((w) => w.status === filters.status);
    if (filters.favorite === "1") workers = workers.filter((w) => w.is_favorite);
    if (filters.tier) {
      workers = workers.filter((w) => reliabilityFromWorker(w).tier === filters.tier);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      workers = workers.filter(
        (w) =>
          w.full_name.toLowerCase().includes(q) ||
          (w.employee_code ?? "").toLowerCase().includes(q) ||
          (w.email ?? "").toLowerCase().includes(q),
      );
    }
    return workers;
  }
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
  if (filters.favorite === "1") q = q.eq("is_favorite", true);
  if (filters.q) q = q.or(`full_name.ilike.%${filters.q}%,employee_code.ilike.%${filters.q}%,email.ilike.%${filters.q}%`);
  const { data } = await q;
  return (data as Worker[]) ?? [];
}

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; favorite?: string; tier?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [allWorkers, locale] = await Promise.all([load(sp), getLocale()]);
  const byState = isDemoMode() ? demoWorkersByState() : [];
  const PAGE_SIZE = 50;
  const page = Math.max(1, Number(sp.page) || 1);
  const workers = allWorkers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title={t(locale, "a.workers.title")}
        subtitle={t(locale, "a.workers.subtitle")}
        count={allWorkers.length}
        action={{ href: "/admin/workers/new", label: t(locale, "a.workers.new") }}
      />

      {byState.length > 0 && (
        <section className="mb-6 rounded-xl border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t(locale, "a.workers.by_state")}
            </h2>
            <span className="text-xs text-muted-foreground">
              {byState.length} {t(locale, "a.workers.states_count")} · {fmtNum(byState.reduce((s, x) => s + x.count, 0))} {t(locale, "a.dash.workers_count")}
            </span>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="text-foreground">
              <USTileMap
                data={Object.fromEntries(byState.map((s) => [s.state, s.count]))}
                color={CHART_COLORS.accent}
                formatter={(n) => `${fmtNum(n)} ${t(locale, "a.dash.workers_count")}`}
              />
            </div>
            <div className="text-foreground">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t(locale, "a.workers.top_states")}
              </p>
              <HorizontalBarChart
                data={byState.slice(0, 8).map((s) => ({
                  label: s.state,
                  value: s.count,
                }))}
                formatter={(n) => fmtNum(n)}
                color={CHART_COLORS.accent}
                labelWidth={36}
              />
            </div>
          </div>
        </section>
      )}
      <FilterBar
        searchValue={sp.q}
        searchPlaceholder={t(locale, "a.search.placeholder")}
        filters={[
          {
            name: "status",
            label: t(locale, "a.filter.status"),
            value: sp.status,
            options: [
              { value: "active", label: t(locale, "a.status.active") },
              { value: "onboarding", label: t(locale, "a.status.onboarding") },
              { value: "inactive", label: t(locale, "a.status.inactive") },
            ],
          },
          {
            name: "favorite",
            label: t(locale, "a.filter.favorites"),
            value: sp.favorite,
            options: [{ value: "1", label: t(locale, "a.filter.favorites_only") }],
          },
          {
            name: "tier",
            label: t(locale, "a.tier.tier"),
            value: sp.tier,
            options: [
              { value: "elite", label: t(locale, "a.tier.elite") },
              { value: "pro", label: t(locale, "a.tier.pro") },
              { value: "standard", label: t(locale, "a.tier.standard") },
              { value: "new", label: t(locale, "a.tier.new") },
            ],
          },
        ]}
      />
      {workers.length === 0 ? (
        <EmptyState
          icon={<HardHat className="h-5 w-5" />}
          title={t(locale, "a.table.no_match")}
          body={t(locale, "a.table.adjust_filter")}
        />
      ) : (
        <DataTable
          head={
            <>
              <Th className="w-8"></Th>
              <Th>{t(locale, "a.col.name")}</Th>
              <Th>{t(locale, "a.col.rating")}</Th>
              <Th>{t(locale, "a.filter.status")}</Th>
              <Th>{t(locale, "a.col.pay_rate")}</Th>
              <Th>{t(locale, "a.col.contact")}</Th>
            </>
          }
        >
          {workers.map((w) => (
            <Tr key={w.id}>
              <Td>
                <FavoriteToggle workerId={w.id} initial={w.is_favorite} />
              </Td>
              <Td>
                <Link
                  href={`/admin/workers/${w.id}`}
                  className="flex items-center gap-2 hover:text-accent"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {initials(w.full_name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{w.full_name}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {w.employee_code ?? "—"}
                    </span>
                  </span>
                </Link>
              </Td>
              <Td>
                {(() => {
                  const rel = reliabilityFromWorker(w);
                  return (
                    <div className="flex flex-col gap-1">
                      <StarRating value={w.rating} count={w.ratings_count} size="xs" />
                      <div className="flex items-center gap-1">
                        <TierBadge tier={rel.tier} score={rel.score} size="xs" />
                        {w.no_show_count > 0 && (
                          <span className="text-[10px] text-red-600 dark:text-red-400">
                            {w.no_show_count} no-show{w.no_show_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
                {w.default_pay_rate ? `${fmtUsd(w.default_pay_rate, { decimals: 2 })}/hr` : "—"}
              </Td>
              <Td className="text-xs text-muted-foreground">{w.email ?? w.phone ?? "—"}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={allWorkers.length}
        basePath="/admin/workers"
        preservedParams={{ status: sp.status, q: sp.q, favorite: sp.favorite, tier: sp.tier }}
      />
    </div>
  );
}
