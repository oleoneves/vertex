import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import type { Theme } from "@/lib/theme";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";

export async function SiteHeader({ theme }: { theme: Theme }) {
  const locale = await getLocale();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label={brand.name}>
          <Image
            src="/logo.svg"
            alt={brand.name}
            width={132}
            height={29}
            priority
            unoptimized
          />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link className="hidden rounded-md px-3 py-2 hover:bg-muted sm:inline-flex" href="/jobs">
            {t(locale, "nav.jobs")}
          </Link>
          <Link className="hidden rounded-md px-3 py-2 hover:bg-muted sm:inline-flex" href="/about">
            {t(locale, "nav.about")}
          </Link>
          <Link className="hidden rounded-md px-3 py-2 hover:bg-muted sm:inline-flex" href="/contact">
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
          <ThemeSwitcher current={theme} />
        </nav>
      </div>
    </header>
  );
}
