import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";

import { fmtUsd, fmtNum, fmtHours } from "@/lib/format";
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
    zelle_full_name: String(formData.get("zelle_full_name") || "").trim() || null,
    travel_available: formData.get("travel_available") === "1",
    travel_region: String(formData.get("travel_region") || "") || null,
  };
  await supabase.from("workers").update(payload).eq("id", worker.id);
  revalidatePath("/worker/profile");
}

async function changePassword(formData: FormData) {
  "use server";
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login");
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    throw new Error("Senha precisa ter pelo menos 8 caracteres");
  }
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada");
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });
  if (error) throw new Error(error.message);
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
          <Field label="Default rate" value={worker.default_pay_rate ? `${fmtUsd(worker.default_pay_rate, { decimals: 2 })}/hr` : "—"} />
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
            ACH é o mais rápido. Pra ACH ou Zelle, registre seus dados abaixo.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Zelle full name</span>
          <input
            name="zelle_full_name"
            defaultValue={worker.zelle_full_name ?? ""}
            placeholder="Name on Zelle"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <fieldset className="block rounded-md border border-border p-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Travel</legend>
          <label className="mt-1 inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="travel_available"
              value="1"
              defaultChecked={worker.travel_available}
              className="h-4 w-4 accent-yellow-400"
            />
            <span className="text-sm">Disponível para viagens</span>
          </label>
          <label className="mt-2 block">
            <span className="text-xs text-muted-foreground">Região máxima</span>
            <select
              name="travel_region"
              defaultValue={worker.travel_region ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">— selecionar —</option>
              <option value="local">Local apenas (mesma cidade)</option>
              <option value="state">No estado</option>
              <option value="national">Em todo o país</option>
              <option value="international">Internacional</option>
            </select>
          </label>
        </fieldset>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-bold text-accent-foreground hover:opacity-90"
        >
          Save changes
        </button>
      </form>

      <form action={changePassword} className="mt-6 space-y-3 rounded-xl border border-border bg-background p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Alterar senha
        </p>
        <label className="block">
          <span className="text-sm font-medium">Nova senha</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md border border-border bg-background px-5 text-sm font-bold hover:bg-muted"
        >
          Atualizar senha
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
