import Link from "next/link";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { LocaleSwitcher } from "./locale-switcher";

export async function SiteHeader() {
  const locale = await getLocale();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="inline-block h-6 w-6 rounded bg-accent" />
          <span>{brand.name}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/jobs">
            {t(locale, "nav.jobs")}
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/about">
            {t(locale, "nav.about")}
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/contact">
            {t(locale, "nav.contact")}
          </Link>
          <Link
            className="ml-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
            href="/jobs"
          >
            {t(locale, "nav.apply")}
          </Link>
          <div className="ml-2">
            <LocaleSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}
