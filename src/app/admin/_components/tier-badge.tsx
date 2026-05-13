import { Crown, Award } from "lucide-react";
import { TIER_META, type Tier } from "@/lib/reliability";
import { t, type TKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export async function TierBadge({
  tier,
  score,
  size = "sm",
  showScore = false,
}: {
  tier: Tier;
  score?: number;
  size?: "xs" | "sm" | "md";
  showScore?: boolean;
}) {
  const locale = await getLocale();
  const meta = TIER_META[tier];
  const Icon = tier === "elite" ? Crown : tier === "pro" ? Award : null;
  const px = size === "xs" ? "px-1.5 py-0.5 text-[9px]" : size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  const iconSize = size === "xs" ? "h-2.5 w-2.5" : size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider ${meta.bg} ${meta.fg} ${px}`}
      title={
        score != null
          ? `${t(locale, meta.labelKey as TKey)} · ${score}/100`
          : t(locale, meta.labelKey as TKey)
      }
    >
      {Icon && <Icon className={iconSize} />}
      {t(locale, meta.labelKey as TKey)}
      {showScore && score != null && (
        <span className="font-mono opacity-70">{score}</span>
      )}
    </span>
  );
}
