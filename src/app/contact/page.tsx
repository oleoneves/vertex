import { brand } from "@/lib/brand";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        Email{" "}
        <a className="text-accent hover:underline" href={`mailto:${brand.supportEmail}`}>
          {brand.supportEmail}
        </a>{" "}
        and a real person will reply within one business day.
      </p>
    </div>
  );
}
