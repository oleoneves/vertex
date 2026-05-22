import { readFileSync } from "node:fs";
import pg from "pg";

// DANGER: Truncates every business table so the app starts from a blank slate
// for real-data testing. Preserves only:
//   - auth.users (Supabase auth — your admin/worker/employer logins stay valid)
//   - public.admin_users (so super_admins keep access after the wipe)
//
// Run with: node scripts/wipe-all-data.mjs --yes-i-am-sure
// (the flag is required to prevent muscle-memory disasters).

if (!process.argv.includes("--yes-i-am-sure")) {
  console.error("Refusing to run without --yes-i-am-sure flag.");
  console.error("Usage: node scripts/wipe-all-data.mjs --yes-i-am-sure");
  process.exit(1);
}

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

const url = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL_NON_POOLING/POSTGRES_URL missing from .env.local");
  process.exit(1);
}

const parsed = new URL(url);
const client = new pg.Client({
  host: parsed.hostname,
  port: Number(parsed.port) || 5432,
  database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  ssl: { rejectUnauthorized: false },
});

// Every business table created across the migrations. CASCADE handles FKs;
// RESTART IDENTITY resets serial counters. admin_users is intentionally
// excluded — we want admins to keep DB access after the wipe.
const TABLES = [
  "payments",
  "invoice_line_items",
  "invoices",
  "project_expenses",
  "project_timesheets",
  "projects",
  "time_entries",
  "shifts",
  "placements",
  "worker_ratings_given",
  "worker_referrals",
  "worker_signatures",
  "worker_availability",
  "time_off_requests",
  "incident_reports",
  "documents",
  "applications",
  "jobs",
  "candidates",
  "sent_emails",
  "employer_contacts",
  "employer_users",
  "employers",
  "workers",
];

await client.connect();
console.log(`Connected. Wiping ${TABLES.length} table(s).`);

const qualified = TABLES.map((t) => `public.${t}`).join(", ");
const sql = `truncate table ${qualified} restart identity cascade;`;
try {
  await client.query(sql);
  console.log("✅ Wipe complete.");
} catch (err) {
  console.error("FAILED:", err.message);
  await client.end();
  process.exit(1);
}

// Sanity report
const { rows } = await client.query(`
  select table_name,
         (xpath('/row/cnt/text()', xml_count))[1]::text::int as count
  from (
    select table_name,
           query_to_xml(format('select count(*) as cnt from %I.%I', table_schema, table_name), false, true, '') as xml_count,
           table_schema
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name = any($1::text[])
  ) t
  order by table_name;
`, [TABLES.concat(["admin_users"])]);

console.log("\nRow counts after wipe:");
for (const r of rows) {
  console.log(`  ${r.table_name.padEnd(28)} ${r.count}`);
}

await client.end();
console.log("\nDone. admin_users + auth.users preserved.");
console.log("To re-link Caio to a worker/employer after this wipe, rerun:");
console.log("  node scripts/create-permanent-admin.mjs (with ADMIN_EMAIL/ADMIN_PASSWORD)");
