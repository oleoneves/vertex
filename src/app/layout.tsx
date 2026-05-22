import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/brand";
import { getLocale } from "@/lib/i18n-server";
import { LocaleProvider } from "@/lib/i18n-client";
import { getTheme } from "@/lib/theme-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TimezoneDetector } from "@/app/_components/tz-detector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${brand.legalName} — Disaster restoration & recovery`,
    template: `%s · ${brand.name}`,
  },
  description: brand.tagline.en,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: brand.name,
    description: brand.tagline.en,
    siteName: brand.name,
    type: "website",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1F2A3D" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  const dataTheme = theme === "system" ? undefined : theme;
  return (
    <html
      lang={locale}
      data-theme={dataTheme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale}>
          <TimezoneDetector />
          <SiteHeader theme={theme} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
