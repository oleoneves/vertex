"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isTheme, THEME_COOKIE } from "@/lib/theme";

export async function setTheme(formData: FormData) {
  const next = formData.get("theme");
  if (typeof next !== "string" || !isTheme(next)) return;
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
