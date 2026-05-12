import Link from "next/link";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export async function SiteFooter() {
  const locale = await getLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          © {year} {brand.legalName}. {t(locale, "footer.rights")}
        </div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            {t(locale, "footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t(locale, "footer.terms")}
          </Link>
          <a href={`mailto:${brand.supportEmail}`} className="hover:text-foreground">
            {brand.supportEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
