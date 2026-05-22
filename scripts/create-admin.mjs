import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      if (i < 0) return null;
      const k = l.slice(0, i).trim();
      let v = l.slice(i + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return [k, v];
    })
    .filter(Boolean),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const role = process.env.ADMIN_ROLE || "super_admin";
if (!["super_admin", "assistant"].includes(role)) {
  console.error(`Invalid ADMIN_ROLE "${role}". Must be super_admin or assistant.`);
  process.exit(1);
}

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!email || !password) {
  console.error("Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/create-admin.mjs");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

console.log(`Creating auth user ${email} ...`);
const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

let userId = created?.user?.id;

if (createErr) {
  if (createErr.status === 422 || /already/i.test(createErr.message)) {
    console.log("  user already exists — looking it up");
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (listErr) throw new Error(`listUsers: ${listErr.message}`);
    const found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error("user said to exist but not found via listUsers");
    userId = found.id;
  } else {
    throw new Error(`createUser: ${createErr.message}`);
  }
}

if (!userId) throw new Error("no userId after create/lookup");
console.log(`  user_id: ${userId}`);

console.log(`Granting role: ${role} ...`);
const { error: upsertErr } = await supabase
  .from("admin_users")
  .upsert({ user_id: userId, role }, { onConflict: "user_id" });
if (upsertErr) throw new Error(`admin_users upsert: ${upsertErr.message}`);

console.log(`Done. Sign in at /admin/login as ${email} (role: ${role}).`);
