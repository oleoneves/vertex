import { brand } from "@/lib/brand";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  const updated = "May 11, 2026";
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Last updated: {updated}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Terms of Service
      </h1>

      <div className="prose prose-slate mt-8 max-w-none space-y-6 text-base leading-7">
        <p className="text-muted-foreground">
          By using {brand.name}, you agree to these terms. Plain-language summary first.
        </p>

        <Section title="Who we are">
          <p>
            {brand.legalName} is a US-based labor recruitment and workforce management platform.
            We connect workers with verified employers and handle payroll/invoicing for direct
            placements.
          </p>
        </Section>

        <Section title="Worker terms">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Applying is free — Vertex never charges workers any fee, ever.</li>
            <li>Be truthful in your application. Misrepresentation can disqualify you.</li>
            <li>Once placed, follow the employer&apos;s safety rules and report hours accurately.</li>
            <li>You may leave the platform at any time.</li>
          </ul>
        </Section>

        <Section title="Employer terms">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Employers must be lawfully registered and able to legally employ workers in the US.</li>
            <li>Pay rate, schedule, and conditions must match what is posted.</li>
            <li>Invoices are due per the payment terms agreed at placement.</li>
            <li>Discrimination or harassment will result in immediate removal from the platform.</li>
          </ul>
        </Section>

        <Section title="What we don't promise">
          <p>
            We can&apos;t guarantee any specific job, wage, or duration. We screen employers
            carefully but you should always confirm details before starting a shift. The platform
            is provided &quot;as is&quot;.
          </p>
        </Section>

        <Section title="Disputes">
          <p>
            If something goes wrong, contact{" "}
            <a href={`mailto:${brand.supportEmail}`} className="text-accent hover:underline">
              {brand.supportEmail}
            </a>{" "}
            first — we&apos;ll work to resolve it. If we can&apos;t, disputes are governed by the
            laws of the State of Florida.
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
