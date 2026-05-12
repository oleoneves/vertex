import { LoginForm } from "./login-form";

export default function EmployerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-2xl border border-border bg-background p-7 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          EMPLOYER PORTAL
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your placed workers, hours, and invoices.
        </p>
        <div className="mt-8">
          <LoginForm searchParams={searchParams} />
        </div>
      </div>
    </div>
  );
}
