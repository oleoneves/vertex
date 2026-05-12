import { redirect } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Shift } from "@/types/db";

export const dynamic = "force-dynamic";

type Row = Shift & {
  placement: { role_title: string; employer: { name: string } | null } | null;
};

export default async function WorkerShiftsPage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/shifts");

  const supabase = await getSupabaseServer();
  const { data: placementIds } = await supabase
    .from("placements")
    .select("id")
    .eq("worker_id", worker.id);
  const ids = (placementIds ?? []).map((p) => p.id);

  const { data } = await supabase
    .from("shifts")
    .select(
      "*, placement:placements(role_title, employer:employers(name))",
    )
    .in("placement_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"])
    .gte("scheduled_start", new Date(Date.now() - 7 * 86400000).toISOString())
    .order("scheduled_start", { ascending: true })
    .limit(50);

  const shifts = (data as unknown as Row[]) ?? [];

  const grouped = new Map<string, Row[]>();
  for (const s of shifts) {
    const k = new Date(s.scheduled_start).toDateString();
    const list = grouped.get(k) ?? [];
    list.push(s);
    grouped.set(k, list);
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Your shifts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Schedule for the next several days.
      </p>

      {shifts.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-muted-foreground">No upcoming shifts scheduled.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {Array.from(grouped.entries()).map(([day, list]) => {
            const d = new Date(day);
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <section key={day}>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    {d.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </h2>
                  {isToday && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                      Today
                    </span>
                  )}
                </div>
                <ul className="mt-2 space-y-2">
                  {list.map((s) => {
                    const start = new Date(s.scheduled_start);
                    const end = new Date(s.scheduled_end);
                    const hrs = (end.getTime() - start.getTime()) / 3600000;
                    return (
                      <li
                        key={s.id}
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="text-lg font-bold tracking-tight">
                            {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            <span className="text-muted-foreground"> — </span>
                            {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </div>
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            {hrs.toFixed(1)}h · {s.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {s.placement?.employer?.name ?? "—"} · {s.placement?.role_title ?? "—"}
                        </div>
                        {s.location && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {s.location}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
