import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";

export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS = ["morning", "afternoon", "evening"] as const;

function mondayOf(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = out.getDay();
  out.setDate(out.getDate() - ((dow + 6) % 7));
  return out;
}

type AvailRow = {
  worker_id: string;
  day_of_week: number;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  worker: { full_name: string; employee_code: string | null } | null;
};

export default async function AdminAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const weekStart = sp.week ? mondayOf(new Date(sp.week)) : (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay();
    d.setDate(d.getDate() + (dow === 0 ? 1 : 8 - dow));
    return d;
  })();
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("worker_availability")
    .select(
      "worker_id, day_of_week, morning, afternoon, evening, worker:workers(full_name, employee_code)",
    )
    .eq("week_start", weekStartStr)
    .order("worker_id");

  const rows = (data as unknown as AvailRow[]) ?? [];

  // Group by worker
  const byWorker = new Map<
    string,
    { name: string; code: string | null; days: Record<number, AvailRow | undefined> }
  >();
  for (const r of rows) {
    const key = r.worker_id;
    const bucket = byWorker.get(key) ?? {
      name: r.worker?.full_name ?? "—",
      code: r.worker?.employee_code ?? null,
      days: {},
    };
    bucket.days[r.day_of_week] = r;
    byWorker.set(key, bucket);
  }
  const workers = Array.from(byWorker.values()).sort((a, b) => a.name.localeCompare(b.name));

  // Total slots filled per day
  const totalsByDay: number[] = Array.from({ length: 7 }, () => 0);
  for (const r of rows) {
    totalsByDay[r.day_of_week] +=
      (r.morning ? 1 : 0) + (r.afternoon ? 1 : 0) + (r.evening ? 1 : 0);
  }

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return (
    <div>
      <PageHeader
        title="Worker availability"
        subtitle="Quem está disponível na semana selecionada. Use pra alocar serviços."
        count={workers.length}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/availability?week=${prevWeek.toISOString().slice(0, 10)}`}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-2 text-sm hover:bg-muted"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Link>
          <span className="text-sm font-bold">
            <CalendarCheck className="inline h-4 w-4" /> Semana de {weekStartStr}
          </span>
          <Link
            href={`/admin/availability?week=${nextWeek.toISOString().slice(0, 10)}`}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-2 text-sm hover:bg-muted"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PageHeader>

      {workers.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum worker marcou disponibilidade para esta semana.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-bold">Worker</th>
                {DAYS.map((d, i) => (
                  <th key={d} className="px-2 py-2 text-center font-bold">
                    {d}
                    <div className="font-mono text-[9px] font-normal text-muted-foreground">
                      {totalsByDay[i]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.name} className="border-b border-border/60">
                  <td className="px-3 py-2">
                    <div className="font-medium">{w.name}</div>
                    {w.code && (
                      <div className="font-mono text-[10px] text-muted-foreground">{w.code}</div>
                    )}
                  </td>
                  {Array.from({ length: 7 }, (_, i) => {
                    const a = w.days[i];
                    return (
                      <td key={i} className="px-2 py-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {SLOTS.map((slot) => (
                            <span
                              key={slot}
                              title={slot}
                              className={`h-1.5 w-6 rounded-full ${
                                a?.[slot]
                                  ? slot === "morning"
                                    ? "bg-yellow-400"
                                    : slot === "afternoon"
                                    ? "bg-orange-400"
                                    : "bg-blue-400"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex gap-3 text-[11px] text-muted-foreground">
        <span>🟡 Manhã</span>
        <span>🟠 Tarde</span>
        <span>🔵 Noite</span>
      </div>
    </div>
  );
}
