import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

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

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const parsed = new URL(url);
const client = new pg.Client({
  host: parsed.hostname,
  port: Number(parsed.port) || 5432,
  database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  ssl: { rejectUnauthorized: false },
});
await client.connect();
console.log(`Connected. Applying ${files.length} migration(s) in order.`);

for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");
  process.stdout.write(`  • ${f} ... `);
  try {
    await client.query(sql);
    console.log("ok");
  } catch (err) {
    console.log("FAILED");
    console.error(err.message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("Done.");
