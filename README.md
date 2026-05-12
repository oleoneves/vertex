# Vertex

Labor recruitment platform connecting workers across the United States with verified employers.

Built with **Next.js 16** (App Router) + TypeScript + Tailwind 4 + Supabase + AI SDK v6 (Vercel AI Gateway).

## Features

- Public landing page (trilingual: en / es / pt, cookie-based)
- Job listings with state / category / keyword filters
- Job detail + application form with PDF CV upload
- AI triage scoring applications against job requirements
- Admin dashboard (Supabase auth, allow-list via `admin_users` table)

## Local dev

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + AI Gateway keys
npm run dev
```

The app degrades gracefully without Supabase configured — jobs render from `src/lib/jobs-mock.ts` and the apply endpoint logs to the console.

## Database

SQL migration at `supabase/migrations/0001_init.sql`. Apply via Supabase SQL editor or Management API. Seed sample jobs with `supabase/seed.sql`.

Grant admin access:

```sql
insert into public.admin_users (user_id) values ('<auth.users uuid>');
```

## Deploy

Linked to Vercel. Set environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_GATEWAY_API_KEY`, `NEXT_PUBLIC_SITE_URL`) in the project dashboard.
