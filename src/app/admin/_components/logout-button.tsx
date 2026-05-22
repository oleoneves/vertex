"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function LogoutButton({ variant = "row" }: { variant?: "row" | "icon" } = {}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (pending) return;
    setPending(true);
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label="Sign out"
        title="Sign out"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="mt-2 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-left">{pending ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
