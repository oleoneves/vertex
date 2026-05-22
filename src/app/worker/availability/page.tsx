import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { setAvailability } from "../actions";

export const dynamic = "force-dynamic";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function nextMonday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function mondayOf(iso: string): Date {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - ((dow + 6) % 7));
  return d;
}

type AvailRow = {
  week_start: string;
  day_of_week: number;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
};

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; view?: string }>;
}) {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/availability");
  const sp = await searchParams;
  const view = sp.view === "month" ? "month" : "week";
  const weekStart = sp.week || nextMonday();

  // For month view, fetch ALL weeks of the month containing weekStart
  const supabase = await getSupabaseServer();
  let monthQuery = supabase
    .from("worker_availability")
    .select("week_start, day_of_week, morning, afternoon, evening")
    .eq("worker_id", worker.id);
  if (view === "month") {
    // Get current month range from weekStart
    const ws = new Date(weekStart);
    const monthStart = new Date(ws.getFullYear(), ws.getMonth(), 1);
    const monthEnd = new Date(ws.getFullYear(), ws.getMonth() + 1, 0);
    monthQuery = monthQuery
      .gte("week_start", new Date(monthStart.getTime() - 7 * 86400000).toISOString().slice(0, 10))
      .lte("week_start", new Date(monthEnd.getTime() + 7 * 86400000).toISOString().slice(0, 10));
  } else {
    monthQuery = monthQuery.eq("week_start", weekStart);
  }
  const { data } = await monthQuery;
  const byDay = new Map<number, AvailRow>();
  const allRows = (data as AvailRow[]) ?? [];
  for (const r of allRows) {
    if (r.week_start === weekStart) byDay.set(r.day_of_week, r);
  }

  // Build month grid (5 or 6 weeks, Sunday-first to match DB day_of_week)
  const monthCells: { date: Date; iso: string; weekStart: string; dow: number; inMonth: boolean; slotCount: number }[] = [];
  if (view === "month") {
    const ws = new Date(weekStart);
    const monthStart = new Date(ws.getFullYear(), ws.getMonth(), 1);
    const firstCell = new Date(monthStart);
    firstCell.setDate(monthStart.getDate() - monthStart.getDay()); // back to Sunday
    for (let i = 0; i < 42; i++) {
      const d = new Date(firstCell);
      d.setDate(firstCell.getDate() + i);
      // weekStart = Monday of this week (matches our DB convention)
      const cellWeekStart = mondayOf(d.toISOString().slice(0, 10)).toISOString().slice(0, 10);
      const cellDow = d.getDay(); // 0=Sun .. 6=Sat (matches DB)
      const cellRow = allRows.find(
        (r) => r.week_start === cellWeekStart && r.day_of_week === cellDow,
      );
      const slotCount =
        (cellRow?.morning ? 1 : 0) +
        (cellRow?.afternoon ? 1 : 0) +
        (cellRow?.evening ? 1 : 0);
      monthCells.push({
        date: d,
        iso: d.toISOString().slice(0, 10),
        weekStart: cellWeekStart,
        dow: cellDow,
        inMonth: d.getMonth() === ws.getMonth(),
        slotCount,
      });
      if (i >= 27 && d.getMonth() !== ws.getMonth()) break;
    }
  }

  const ws = new Date(weekStart);
  const monthLabel = ws.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const prevMonth = new Date(ws.getFullYear(), ws.getMonth() - 1, 1).toISOString().slice(0, 10);
  const nextMonthDate = new Date(ws.getFullYear(), ws.getMonth() + 1, 1).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <CalendarCheck className="inline h-6 w-6 text-accent" /> Disponibilidade
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marque os dias e turnos que você pode trabalhar. A Vertex usa isso pra alocar serviços novos.
        </p>
      </header>

      {/* View toggle */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 text-sm">
        <Link
          href={`/worker/availability?view=week&week=${weekStart}`}
          className={`flex-1 rounded-md px-3 py-1.5 text-center font-medium ${
            view === "week" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Semanal (detalhe)
        </Link>
        <Link
          href={`/worker/availability?view=month&week=${weekStart}`}
          className={`flex-1 rounded-md px-3 py-1.5 text-center font-medium ${
            view === "month" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Mês inteiro
        </Link>
      </div>

      {view === "month" && (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="mb-3 flex items-center justify-between">
            <Link
              href={`/worker/availability?view=month&week=${prevMonth}`}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-sm hover:bg-muted"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
            <h2 className="text-lg font-extrabold capitalize">{monthLabel}</h2>
            <Link
              href={`/worker/availability?view=month&week=${nextMonthDate}`}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-sm hover:bg-muted"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="text-center font-bold">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthCells.map((c) => (
              <Link
                key={c.iso}
                href={`/worker/availability?view=week&week=${c.weekStart}`}
                className={`aspect-square rounded-md border p-1 text-center text-xs transition ${
                  !c.inMonth
                    ? "border-transparent text-muted-foreground/40"
                    : c.slotCount === 3
                    ? "border-green-500/40 bg-green-500/20 text-green-700 dark:text-green-300"
                    : c.slotCount > 0
                    ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
                    : "border-border bg-muted/20 hover:bg-muted"
                }`}
              >
                <div className="font-bold">{c.date.getDate()}</div>
                {c.slotCount > 0 && c.inMonth && (
                  <div className="mt-0.5 text-[9px]">{c.slotCount}/3</div>
                )}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Clique em um dia pra editar os turnos daquela semana. Verde = pelo menos 1 turno marcado.
          </p>
        </section>
      )}

      {view === "week" && (
      <p className="text-xs text-muted-foreground">
        Semana iniciando em <strong>{weekStart}</strong>
      </p>
      )}

      <form
        action={setAvailability}
        className="rounded-xl border border-border bg-background p-5"
      >
        <input type="hidden" name="week_start" value={weekStart} />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="pb-2"></th>
              <th className="pb-2 text-center">Manhã</th>
              <th className="pb-2 text-center">Tarde</th>
              <th className="pb-2 text-center">Noite</th>
            </tr>
          </thead>
          <tbody>
            {DAYS_PT.map((day, i) => {
              const row = byDay.get(i);
              return (
                <tr key={i} className="border-t border-border/60">
                  <td className="py-3 font-bold">{day}</td>
                  <td className="py-3 text-center">
                    <input
                      type="checkbox"
                      name={`d${i}_morning`}
                      defaultChecked={row?.morning ?? false}
                      className="h-5 w-5 accent-yellow-400"
                    />
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="checkbox"
                      name={`d${i}_afternoon`}
                      defaultChecked={row?.afternoon ?? false}
                      className="h-5 w-5 accent-yellow-400"
                    />
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="checkbox"
                      name={`d${i}_evening`}
                      defaultChecked={row?.evening ?? false}
                      className="h-5 w-5 accent-yellow-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          type="submit"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-extrabold text-accent-foreground hover:opacity-90"
        >
          Salvar disponibilidade
        </button>
      </form>
    </div>
  );
}
