"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

export function FavoriteToggle({
  workerId,
  initial,
  action,
  size = "sm",
}: {
  workerId: string;
  initial: boolean;
  action?: (workerId: string, value: boolean) => Promise<{ ok: boolean }>;
  size?: "sm" | "md";
}) {
  const [favorited, setFavorited] = useState(initial);
  const [pending, startTransition] = useTransition();
  const px = size === "md" ? 18 : 14;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorited;
    setFavorited(next);
    if (action) {
      startTransition(async () => {
        const res = await action(workerId, next);
        if (!res.ok) setFavorited(!next);
      });
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? "Unfavorite" : "Favorite"}
      aria-pressed={favorited}
      disabled={pending}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition ${
        favorited
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${pending ? "opacity-50" : ""}`}
    >
      <Heart
        size={px}
        fill={favorited ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
