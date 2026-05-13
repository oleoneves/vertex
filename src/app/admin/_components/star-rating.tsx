import { Star } from "lucide-react";

export function StarRating({
  value,
  count,
  size = "sm",
  showNumber = true,
}: {
  value: number | null;
  count?: number;
  size?: "xs" | "sm" | "md";
  showNumber?: boolean;
}) {
  if (value == null) {
    return (
      <span className="text-xs text-muted-foreground">No ratings yet</span>
    );
  }
  const px = size === "xs" ? 12 : size === "sm" ? 14 : 18;
  const rounded = Math.round(value * 10) / 10;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex" aria-label={`${rounded} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fillPct =
            value >= star
              ? 100
              : value >= star - 1
              ? Math.round((value - (star - 1)) * 100)
              : 0;
          return (
            <span
              key={star}
              className="relative inline-block"
              style={{ width: px, height: px }}
            >
              <Star
                className="absolute inset-0 text-muted-foreground/40"
                size={px}
              />
              {fillPct > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPct}%` }}
                >
                  <Star
                    className="text-amber-400"
                    fill="currentColor"
                    size={px}
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showNumber && (
        <span
          className={`font-mono tabular-nums font-medium ${
            size === "xs" ? "text-[10px]" : "text-xs"
          }`}
        >
          {rounded.toFixed(1)}
        </span>
      )}
      {count != null && count > 0 && (
        <span
          className={`text-muted-foreground ${
            size === "xs" ? "text-[10px]" : "text-xs"
          }`}
        >
          ({count})
        </span>
      )}
    </span>
  );
}
