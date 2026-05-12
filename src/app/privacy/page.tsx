import { brand } from "@/lib/brand";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  const updated = "May 11, 2026";
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Last updated: {updated}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy Policy</h1>

      <div className="prose prose-slate mt-8 max-w-none space-y-6 text-base leading-7">
        <p className="text-muted-foreground">
          This policy describes how {brand.legalName} (&quot;{brand.name}&quot;, &quot;we&quot;,
          &quot;us&quot;) collects, uses, and shares information when you use our website and
          services. Plain-language summary first; legal detail follows.
        </p>

        <Section title="What we collect">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Information you give us when you apply (name, email, phone, optional CV)</li>
            <li>Employment details once you&apos;re placed (hours worked, pay rate, shift records)</li>
            <li>Basic device data (browser, language, anonymized IP) for security and analytics</li>
          </ul>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Match you with verified employers and roles you&apos;re qualified for</li>
            <li>Run payroll, invoicing, and required tax/employment reporting</li>
            <li>Send you shift reminders, application updates, and time-sensitive notices</li>
            <li>Keep the platform safe (fraud detection, abuse prevention)</li>
          </ul>
        </Section>

        <Section title="What we don't do">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>We <strong>never</strong> charge workers any fee — ever</li>
            <li>We don&apos;t sell your personal information to third parties</li>
            <li>We don&apos;t share your contact info with unverified employers</li>
          </ul>
        </Section>

        <Section title="Who sees your information">
          <p>
            Verified employers see your application only after you submit it for one of their roles.
            Vertex staff handling placements and payroll see what they need to do their job.
            Vendors we use (payment processors, cloud hosting, AI screening) are bound by data
            processing agreements.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can request a copy of your data, ask us to correct or delete it, or withdraw
            consent at any time by writing to{" "}
            <a href={`mailto:${brand.supportEmail}`} className="text-accent hover:underline">
              {brand.supportEmail}
            </a>
            . We respond within 30 days.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions: <a href={`mailto:${brand.supportEmail}`} className="text-accent hover:underline">{brand.supportEmail}</a>
          </p>
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <div className="mt-2 text-foreground/85">{children}</div>
    </section>
  );
}
