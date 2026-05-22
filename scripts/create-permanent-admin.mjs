import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Provisions an eternal super_admin user with access to all three portals:
//   - /admin  → admin_users row, role=super_admin
//   - /worker → workers row linked to user_id
//   - /employer → employer_users row linked to first existing employer
//
// Usage:
//   ADMIN_EMAIL=caiobarreto0404@gmail.com \
//   ADMIN_PASSWORD=ChangeMe-StrongPass123 \
//   FULL_NAME="Caio Barreto" \
//   node scripts/create-permanent-admin.mjs

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
const fullName = process.env.FULL_NAME || email?.split("@")[0] || "Admin";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!email || !password) {
  console.error("Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/create-permanent-admin.mjs");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// 1. Create or find the auth user
console.log(`[1/4] Creating auth user ${email} ...`);
const { data: created, error: createErr } = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});

let userId = created?.user?.id;
if (createErr) {
  if (createErr.status === 422 || /already/i.test(createErr.message)) {
    console.log("      user exists, looking it up + resetting password ...");
    const { data: list } = await sb.auth.admin.listUsers({ perPage: 200 });
    const found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error("user said to exist but not found");
    userId = found.id;
    await sb.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    throw new Error(`createUser: ${createErr.message}`);
  }
}
if (!userId) throw new Error("no userId after create/lookup");
console.log(`      user_id: ${userId}`);

// 2. admin_users → super_admin
console.log(`[2/4] Granting admin_users.super_admin ...`);
const { error: adminErr } = await sb
  .from("admin_users")
  .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id" });
if (adminErr) throw new Error(`admin_users upsert: ${adminErr.message}`);

// 3. workers → ensure a worker row exists for this user
console.log(`[3/4] Ensuring workers row ...`);
const { data: existingWorker } = await sb
  .from("workers")
  .select("id")
  .eq("user_id", userId)
  .maybeSingle();
if (existingWorker) {
  console.log(`      worker already linked: ${existingWorker.id}`);
} else {
  const { data: newWorker, error: workerErr } = await sb
    .from("workers")
    .insert({ user_id: userId, full_name: fullName, email })
    .select("id")
    .single();
  if (workerErr) throw new Error(`workers insert: ${workerErr.message}`);
  console.log(`      created worker: ${newWorker.id}`);
}

// 4. employer_users → link to first existing employer (or skip if none)
console.log(`[4/4] Linking employer_users ...`);
const { data: firstEmployer } = await sb
  .from("employers")
  .select("id, name")
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();

if (!firstEmployer) {
  console.log(`      no employers in DB — skipping employer link`);
} else {
  const { error: empErr } = await sb
    .from("employer_users")
    .upsert(
      { user_id: userId, employer_id: firstEmployer.id },
      { onConflict: "user_id" },
    );
  if (empErr) throw new Error(`employer_users upsert: ${empErr.message}`);
  console.log(`      linked to employer: ${firstEmployer.name} (${firstEmployer.id})`);
}

console.log(`\n✅ Done. ${email} can sign in at:`);
console.log(`   /admin/login    (super_admin, eternal via allowlist)`);
console.log(`   /worker/login   (worker profile created)`);
console.log(`   /employer/login (linked to first employer)`);
