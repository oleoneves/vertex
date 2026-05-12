import { Mail, MessageCircle, Phone, Clock } from "lucide-react";
import { brand } from "@/lib/brand";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
        GET IN TOUCH
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
        We&apos;re here when you need us.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        For workers, employers, or anything in between. Real people, English / Spanish / Portuguese.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Channel
          icon={<Mail className="h-5 w-5" />}
          label="Email"
          value={brand.supportEmail}
          href={`mailto:${brand.supportEmail}`}
          hint="Replies within 1 business day"
        />
        <Channel
          icon={<MessageCircle className="h-5 w-5" />}
          label="WhatsApp / SMS"
          value="+1 (555) 010-0100"
          href="https://wa.me/15550100100"
          hint="Hablamos español · Falamos português"
        />
        <Channel
          icon={<Phone className="h-5 w-5" />}
          label="Phone"
          value="+1 (555) 010-0100"
          href="tel:+15550100100"
          hint="Mon–Fri 8am–6pm ET"
        />
        <Channel
          icon={<Clock className="h-5 w-5" />}
          label="Office hours"
          value="Mon–Fri 8am – 6pm ET"
          hint="Closed Saturdays and Sundays"
        />
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Already a Vertex worker? Sign in at{" "}
        <a href="/worker/login" className="text-accent hover:underline">
          /worker/login
        </a>{" "}
        to view your shifts and hours.
      </p>
    </div>
  );
}

function Channel({
  icon,
  label,
  value,
  href,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border bg-background p-5 transition hover:border-foreground/40">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="font-semibold tracking-tight">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
}
