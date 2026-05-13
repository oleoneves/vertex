import Image from "next/image";
import { listWorkers } from "@/lib/workforce";
import { isDemoMode } from "@/lib/demo";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { KioskClient } from "./kiosk-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clock in / out — Vertex Restoration",
};

export default async function ClockKioskPage() {
  const [allWorkers, locale, demo] = await Promise.all([
    listWorkers(),
    getLocale(),
    Promise.resolve(isDemoMode()),
  ]);

  // Active workers only (no onboarding/inactive for the kiosk list)
  const workers = allWorkers
    .filter((w) => w.status === "active")
    .map((w) => ({
      id: w.id,
      full_name: w.full_name,
      employee_code: w.employee_code,
    }));

  return (
    <main className="kiosk-shell min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-[#1F2A3D] text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Image
            src="/vertex-mark-yellow.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-auto shrink-0"
          />
          <div className="leading-tight">
            <div className="text-lg font-black tracking-[3px] sm:text-xl">VERTEX</div>
            <div className="text-[9px] font-semibold uppercase tracking-[2px] text-[#EDB23E]">
              Restoration · Recovery
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              {t(locale, "k.title")}
            </p>
            <p className="text-xs text-white/70">{t(locale, "k.subtitle")}</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <KioskClient
          workers={workers}
          demoMode={demo}
          labels={{
            title: t(locale, "k.title"),
            subtitle: t(locale, "k.subtitle"),
            search: t(locale, "k.search"),
            enterPin: t(locale, "k.enter_pin"),
            wrongPin: t(locale, "k.wrong_pin"),
            cancel: t(locale, "k.cancel"),
            clockIn: t(locale, "k.clock_in"),
            clockOut: t(locale, "k.clock_out"),
            onClock: t(locale, "k.on_clock"),
            since: t(locale, "k.since"),
            pickPlacement: t(locale, "k.pick_placement"),
            noPlacements: t(locale, "k.no_placements"),
            successIn: t(locale, "k.success_in"),
            successOut: t(locale, "k.success_out"),
            welcome: t(locale, "k.welcome"),
            breakMinutes: t(locale, "k.break_minutes"),
            demoPinHint: t(locale, "k.demo_pin_hint"),
          }}
        />
      </section>
    </main>
  );
}
