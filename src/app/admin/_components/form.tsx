import Link from "next/link";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
      <header className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

const labelCls = "text-sm font-medium";
const inputCls =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50";

export function FormField({
  label,
  name,
  required,
  hint,
  span2,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  span2?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "required">) {
  return (
    <label className={`block ${span2 ? "sm:col-span-2" : ""}`}>
      <span className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input name={name} required={required} className={inputCls} {...rest} />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function FormSelect({
  label,
  name,
  required,
  hint,
  options,
  span2,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  span2?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "required">) {
  return (
    <label className={`block ${span2 ? "sm:col-span-2" : ""}`}>
      <span className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <select name={name} required={required} className={inputCls} {...rest}>
        {rest.placeholder && <option value="">{rest.placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function FormTextarea({
  label,
  name,
  required,
  hint,
  rows = 3,
  span2 = true,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  rows?: number;
  span2?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "required" | "rows">) {
  return (
    <label className={`block ${span2 ? "sm:col-span-2" : ""}`}>
      <span className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <textarea name={name} required={required} rows={rows} className={inputCls} {...rest} />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function FormCheckbox({
  label,
  name,
  hint,
}: {
  label: string;
  name: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-yellow-400 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function FormActions({
  submitLabel,
  cancelHref,
}: {
  submitLabel: string;
  cancelHref?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-bold text-accent-foreground hover:opacity-90"
      >
        {submitLabel}
      </button>
      {cancelHref && (
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
      )}
    </div>
  );
}
