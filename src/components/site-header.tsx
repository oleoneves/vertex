import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import type { Theme } from "@/lib/theme";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader({ theme }: { theme: Theme }) {
  const locale = await getLocale();
  const items = [
    { href: "/jobs", label: t(locale, "nav.jobs") },
    { href: "/about", label: t(locale, "nav.about") },
    { href: "/contact", label: t(locale, "nav.contact") },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
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

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {items.map((it) => (
            <Link
              key={it.href}
              className="rounded-md px-3 py-2 font-medium hover:bg-muted"
              href={it.href}
            >
              {it.label}
            </Link>
          ))}
          <Link
            className="ml-2 inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-bold text-accent-foreground hover:opacity-90"
            href="/jobs"
          >
            {t(locale, "nav.apply")} →
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <LocaleSwitcher />
          <ThemeSwitcher current={theme} />
          <MobileNav items={[...items, { href: "/jobs", label: t(locale, "nav.apply") }]} />
        </div>
      </div>
    </header>
  );
}
