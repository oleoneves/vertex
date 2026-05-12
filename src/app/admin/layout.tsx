import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="lg:w-56">
        <nav className="sticky top-20 flex flex-col gap-1 text-sm">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
          <AdminLink href="/admin">Dashboard</AdminLink>
          <AdminLink href="/admin/applications">Applications</AdminLink>
          <AdminLink href="/admin/jobs">Jobs</AdminLink>
          <AdminLink href="/admin/jobs/new">New job</AdminLink>
        </nav>
      </aside>
      <section className="flex-1">{children}</section>
    </div>
  );
}

function AdminLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-foreground hover:bg-muted"
    >
      {children}
    </Link>
  );
}
