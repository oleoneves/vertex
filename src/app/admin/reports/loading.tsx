export default function ReportsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="mt-2 h-8 w-40 rounded bg-muted" />
        <div className="mt-2 h-3 w-72 rounded bg-muted/60" />
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-background p-5">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="mt-3 h-7 w-28 rounded bg-muted" />
          </div>
        ))}
      </section>

      {[0, 1, 2].map((i) => (
        <section key={i} className="rounded-xl border border-border bg-background p-5">
          <div className="h-3 w-48 rounded bg-muted" />
          <div className="mt-5 h-56 w-full rounded bg-muted/40" />
        </section>
      ))}
    </div>
  );
}
