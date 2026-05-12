import { LoginForm } from "./login-form";

export default function WorkerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Worker sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Use the email Vertex provided when you onboarded.
      </p>
      <div className="mt-8">
        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  );
}
