import { redirect } from "next/navigation";
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
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Your shifts</h1>
      <ul className="mt-4 space-y-3">
        {shifts.length === 0 && (
          <li className="rounded-lg border border-border bg-background p-5 text-sm text-muted-foreground">
            No upcoming shifts scheduled.
          </li>
        )}
        {shifts.map((s) => {
          const start = new Date(s.scheduled_start);
          const end = new Date(s.scheduled_end);
          return (
            <li
              key={s.id}
              className="rounded-lg border border-border bg-background p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-lg font-bold tracking-tight">
                  {start.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.status.replace("_", " ")}
                </div>
              </div>
              <div className="mt-1 text-sm">
                {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} —{" "}
                {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {s.placement?.employer?.name ?? "—"} · {s.placement?.role_title ?? "—"}
              </div>
              {s.location && (
                <div className="mt-1 text-xs text-muted-foreground">📍 {s.location}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
