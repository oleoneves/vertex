import type { Worker } from "@/types/db";

export type Tier = "elite" | "pro" | "standard" | "new";

export type Reliability = {
  score: number; // 0-100
  tier: Tier;
};

// Composite score:
//   rating_share   = (rating / 5) * 70    → max 70 pts
//   reliability    = (1 - noShowRate) * 20 → max 20 pts (noShowRate clamped 0..1)
//   experience     = min(ratings_count / 20, 1) * 10 → max 10 pts
// Total: 0..100
export function computeReliability(w: {
  rating: number | null;
  ratings_count: number;
  no_show_count: number;
}): Reliability {
  if (w.rating == null || w.ratings_count === 0) {
    return { score: 0, tier: "new" };
  }
  const ratingShare = Math.max(0, Math.min(1, w.rating / 5)) * 70;
  const noShowRate = Math.max(0, Math.min(1, w.no_show_count / Math.max(1, w.ratings_count)));
  const reliabilityShare = (1 - noShowRate) * 20;
  const experienceShare = Math.min(1, w.ratings_count / 20) * 10;
  const score = Math.round(ratingShare + reliabilityShare + experienceShare);
  return { score, tier: tierFor(score) };
}

function tierFor(score: number): Tier {
  if (score >= 90) return "elite";
  if (score >= 75) return "pro";
  if (score >= 50) return "standard";
  return "new";
}

export const TIER_META: Record<
  Tier,
  { labelKey: string; bg: string; fg: string; ring: string }
> = {
  elite: {
    labelKey: "a.tier.elite",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    fg: "text-amber-900 dark:text-amber-300",
    ring: "ring-amber-400",
  },
  pro: {
    labelKey: "a.tier.pro",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    fg: "text-blue-900 dark:text-blue-300",
    ring: "ring-blue-400",
  },
  standard: {
    labelKey: "a.tier.standard",
    bg: "bg-muted",
    fg: "text-muted-foreground",
    ring: "ring-border",
  },
  new: {
    labelKey: "a.tier.new",
    bg: "bg-slate-100 dark:bg-slate-800",
    fg: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-300",
  },
};

export function reliabilityFromWorker(w: Worker): Reliability {
  return computeReliability({
    rating: w.rating,
    ratings_count: w.ratings_count,
    no_show_count: w.no_show_count,
  });
}
