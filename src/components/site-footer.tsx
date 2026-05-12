import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export async function SiteFooter() {
  const locale = await getLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Image
              src="/logo.svg"
              alt={brand.name}
              width={132}
              height={29}
              unoptimized
              className="opacity-90"
            />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {brand.tagline[locale] ?? brand.tagline.en}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink href={`mailto:${brand.supportEmail}`} label="Email">
                <Mail className="h-4 w-4" />
              </SocialLink>
              {brand.social.instagram && (
                <SocialLink
                  href={`https://instagram.com/${brand.social.instagram}`}
                  label="Instagram"
                >
                  <InstagramIcon className="h-4 w-4" />
                </SocialLink>
              )}
              {brand.social.linkedin && (
                <SocialLink
                  href={`https://linkedin.com/company/${brand.social.linkedin}`}
                  label="LinkedIn"
                >
                  <LinkedinIcon className="h-4 w-4" />
                </SocialLink>
              )}
            </div>
          </div>

          <FooterCol title="For workers">
            <FooterLink href="/jobs">{t(locale, "jobs.title")}</FooterLink>
            <FooterLink href="/jobs">{t(locale, "nav.apply")}</FooterLink>
            <FooterLink href="/worker/login">Worker sign-in</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="/about">{t(locale, "nav.about")}</FooterLink>
            <FooterLink href="/contact">{t(locale, "nav.contact")}</FooterLink>
            <FooterLink href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</FooterLink>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href="/privacy">{t(locale, "footer.privacy")}</FooterLink>
            <FooterLink href="/terms">{t(locale, "footer.terms")}</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.legalName}. {t(locale, "footer.rights")}
          </p>
          <p>Built in the United States · Hablamos español · Falamos português</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-muted-foreground hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </a>
  );
}
