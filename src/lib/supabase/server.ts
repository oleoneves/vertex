import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function buildCookieClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context — set() is read-only. Middleware/route handlers handle it.
          }
        },
      },
    },
  );
}

export async function getSupabaseServer(): Promise<
  ReturnType<typeof buildCookieClient>
> {
  const cookieStore = await cookies();
  const hasSession = cookieStore
    .getAll()
    .some((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name));

  // TEMP: open-access mode — when no auth cookie, use service role so pages
  // still render real data instead of empty (RLS-blocked) results.
  if (!hasSession && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    ) as unknown as ReturnType<typeof buildCookieClient>;
  }

  return buildCookieClient(cookieStore);
}
