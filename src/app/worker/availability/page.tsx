import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
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

type AvailRow = {
  day_of_week: number;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
};

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/availability");
  const sp = await searchParams;
  const weekStart = sp.week || nextMonday();

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("worker_availability")
    .select("day_of_week, morning, afternoon, evening")
    .eq("worker_id", worker.id)
    .eq("week_start", weekStart);
  const byDay = new Map<number, AvailRow>();
  for (const r of ((data as AvailRow[]) ?? [])) byDay.set(r.day_of_week, r);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <CalendarCheck className="inline h-6 w-6 text-accent" /> Disponibilidade da semana
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marque os dias e turnos que você pode trabalhar. A Vertex usa isso pra alocar serviços novos.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Semana iniciando em <strong>{weekStart}</strong>
        </p>
      </header>

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
