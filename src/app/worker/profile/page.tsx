import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function updateProfile(formData: FormData) {
  "use server";
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const supabase = await getSupabaseServer();
  const payload = {
    phone: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    payment_method: String(formData.get("payment_method") || "check"),
  };
  await supabase.from("workers").update(payload).eq("id", worker.id);
  revalidatePath("/worker/profile");
}

export default async function WorkerProfilePage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/profile");

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Keep your contact and payment details current so we can reach you and pay you.
      </p>

      <section className="mt-6 rounded-xl border border-border bg-background p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Identity
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="Name" value={worker.full_name} />
          <Field label="Employee code" value={worker.employee_code ?? "—"} mono />
          <Field label="Status" value={worker.status} capitalize />
          <Field label="Default rate" value={worker.default_pay_rate ? `$${Number(worker.default_pay_rate).toFixed(2)}/hr` : "—"} />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          To change your name or code, contact Vertex.
        </p>
      </section>

      <form action={updateProfile} className="mt-6 space-y-4 rounded-xl border border-border bg-background p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Contact & payment
        </p>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={worker.email ?? ""}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Phone</span>
          <input
            name="phone"
            type="tel"
            defaultValue={worker.phone ?? ""}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Payment method</span>
          <select
            name="payment_method"
            defaultValue={worker.payment_method}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="check">Check</option>
            <option value="ach">ACH (direct deposit)</option>
            <option value="zelle">Zelle</option>
            <option value="cashapp">CashApp</option>
          </select>
          <span className="mt-1 block text-xs text-muted-foreground">
            ACH is fastest. For ACH or Zelle, contact Vertex to register your account details.
          </span>
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-bold text-accent-foreground hover:opacity-90"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd
        className={`mt-0.5 ${mono ? "font-mono" : "font-medium"} ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
