import { redirect } from "next/navigation";
import { HardHat } from "lucide-react";
import { getCurrentEmployer, listEmployerWorkers } from "@/lib/employer";

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

export default async function EmployerWorkers() {
  const scope = await getCurrentEmployer();
  if (!scope) redirect("/employer/login");

  const workers = await listEmployerWorkers(scope.employerId);

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Your workers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Labors placed with {scope.employer.name} through Vertex.
      </p>

      {workers.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <HardHat className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-muted-foreground">No active placements yet.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {workers.map((w) => (
            <li
              key={`${w.id}-${w.placement.role_title}`}
              className="rounded-xl border border-border bg-background p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {initials(w.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold tracking-tight">{w.full_name}</div>
                  <div className="text-xs text-muted-foreground">{w.placement.role_title}</div>
                </div>
                <span
                  className={
                    w.placement.status === "active"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  }
                >
                  {w.placement.status}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-border/60 pt-3 text-sm">
                <span className="text-muted-foreground">Bill rate</span>
                <span className="font-mono font-medium tabular-nums">
                  ${Number(w.placement.bill_rate).toFixed(2)}
                  <span className="text-xs text-muted-foreground">/hr</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
