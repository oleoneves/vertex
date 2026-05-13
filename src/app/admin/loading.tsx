export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="mt-2 h-8 w-32 rounded bg-muted" />
      </div>

      {/* KPI grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-5">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="mt-3 h-7 w-32 rounded bg-muted" />
            <div className="mt-4 h-6 w-full rounded bg-muted/50" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-5">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="mt-3 h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </section>

      {/* Big chart */}
      <section className="rounded-xl border border-border bg-background p-5">
        <div className="h-3 w-40 rounded bg-muted" />
        <div className="mt-5 h-56 w-full rounded bg-muted/40" />
      </section>

      {/* Two-up */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-5 lg:col-span-2">
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="mt-5 h-44 w-full rounded bg-muted/40" />
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="h-3 w-28 rounded bg-muted" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-muted" />
                <div className="h-3 flex-1 rounded bg-muted/60" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
