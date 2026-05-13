// Pure-SVG chart primitives — no client JS, no dependencies.
// All components are server-rendered. Tooltips use native <title>.

import type { ReactNode } from "react";

const ACCENT = "var(--color-accent, #FACC15)";
const ACCENT_DARK = "var(--color-accent-dark, #CA9F0C)";

// ============================================================
// <Sparkline>
// Tiny line chart for KPI cards. ~120×32 default.
// ============================================================
export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = ACCENT,
  fill = "none",
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  if (data.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.15}
        />
      </svg>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - 2 - ((v - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const areaPath = `M0,${height} L${points
    .split(" ")
    .map((p) => p)
    .join(" L")} L${width},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      {fill !== "none" && <path d={areaPath} fill={fill} fillOpacity={0.18} />}
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================
// <AreaChart>
// Single-series area with gradient + axes.
// ============================================================
export function AreaChart({
  data,
  height = 200,
  yFormatter,
  xLabels,
  color = ACCENT,
}: {
  data: { label: string; value: number }[];
  height?: number;
  yFormatter?: (n: number) => string;
  xLabels?: number; // how many x labels to show (evenly spaced)
  color?: string;
}) {
  const width = 600;
  const padding = { top: 16, right: 16, bottom: 28, left: 56 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }

  const values = data.map((d) => d.value);
  const min = 0;
  const max = Math.max(1, ...values);
  const range = max - min || 1;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + innerH - ((d.value - min) / range) * innerH,
    label: d.label,
    value: d.value,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${
    padding.top + innerH
  } L${points[0].x.toFixed(1)},${padding.top + innerH} Z`;

  // Y axis ticks (4 levels)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padding.top + innerH - t * innerH,
    value: min + t * range,
  }));

  // X axis labels (evenly distributed)
  const labelCount = xLabels ?? Math.min(6, data.length);
  const xLabelIdxs =
    labelCount >= data.length
      ? data.map((_, i) => i)
      : Array.from({ length: labelCount }, (_, i) =>
          Math.round((i * (data.length - 1)) / (labelCount - 1)),
        );

  const gradientId = `area-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ maxHeight: height }}
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={width - padding.right}
          y1={t.y}
          y2={t.y}
          stroke="currentColor"
          strokeOpacity={0.08}
        />
      ))}
      {/* Y labels */}
      {yTicks.map((t, i) => (
        <text
          key={i}
          x={padding.left - 8}
          y={t.y + 3}
          fontSize="10"
          textAnchor="end"
          fill="currentColor"
          fillOpacity={0.5}
        >
          {yFormatter ? yFormatter(t.value) : Math.round(t.value)}
        </text>
      ))}

      {/* Area */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2.5} fill={color} />
          <circle cx={p.x} cy={p.y} r={10} fill="transparent">
            <title>
              {p.label}: {yFormatter ? yFormatter(p.value) : p.value}
            </title>
          </circle>
        </g>
      ))}

      {/* X labels */}
      {xLabelIdxs.map((i) => (
        <text
          key={i}
          x={points[i].x}
          y={height - 8}
          fontSize="10"
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.5}
        >
          {data[i].label}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// <BarChart>
// Single-series vertical bars.
// ============================================================
export function BarChart({
  data,
  height = 180,
  yFormatter,
  color = ACCENT,
}: {
  data: { label: string; value: number }[];
  height?: number;
  yFormatter?: (n: number) => string;
  color?: string;
}) {
  const width = 600;
  const padding = { top: 16, right: 16, bottom: 28, left: 56 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (data.length === 0) return <EmptyChart height={height} />;

  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = (innerW / data.length) * 0.7;
  const gap = (innerW / data.length) * 0.3;

  const yTicks = [0, 0.5, 1].map((t) => ({
    y: padding.top + innerH - t * innerH,
    value: t * max,
  }));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ maxHeight: height }}
      role="img"
    >
      {/* Grid */}
      {yTicks.map((t, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={width - padding.right}
          y1={t.y}
          y2={t.y}
          stroke="currentColor"
          strokeOpacity={0.08}
        />
      ))}
      {/* Y labels */}
      {yTicks.map((t, i) => (
        <text
          key={i}
          x={padding.left - 8}
          y={t.y + 3}
          fontSize="10"
          textAnchor="end"
          fill="currentColor"
          fillOpacity={0.5}
        >
          {yFormatter ? yFormatter(t.value) : Math.round(t.value)}
        </text>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = padding.left + i * (barW + gap) + gap / 2;
        const y = padding.top + innerH - h;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, d.value > 0 ? 1 : 0)}
              rx={3}
              fill={color}
            >
              <title>
                {d.label}: {yFormatter ? yFormatter(d.value) : d.value}
              </title>
            </rect>
            <text
              x={x + barW / 2}
              y={height - 8}
              fontSize="10"
              textAnchor="middle"
              fill="currentColor"
              fillOpacity={0.7}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// <StackedBarChart>
// Multi-series stacked bars (e.g., cost + margin = revenue).
// ============================================================
export function StackedBarChart({
  data,
  series,
  height = 220,
  yFormatter,
}: {
  data: { label: string; values: number[] }[];
  series: { name: string; color: string }[];
  height?: number;
  yFormatter?: (n: number) => string;
}) {
  const width = 600;
  const padding = { top: 16, right: 16, bottom: 28, left: 64 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (data.length === 0) return <EmptyChart height={height} />;

  const totals = data.map((d) => d.values.reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...totals);
  const barW = (innerW / data.length) * 0.7;
  const gap = (innerW / data.length) * 0.3;

  const yTicks = [0, 0.5, 1].map((t) => ({
    y: padding.top + innerH - t * innerH,
    value: t * max,
  }));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ maxHeight: height }}
      role="img"
    >
      {yTicks.map((t, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={width - padding.right}
          y1={t.y}
          y2={t.y}
          stroke="currentColor"
          strokeOpacity={0.08}
        />
      ))}
      {yTicks.map((t, i) => (
        <text
          key={i}
          x={padding.left - 8}
          y={t.y + 3}
          fontSize="10"
          textAnchor="end"
          fill="currentColor"
          fillOpacity={0.5}
        >
          {yFormatter ? yFormatter(t.value) : Math.round(t.value)}
        </text>
      ))}

      {data.map((d, i) => {
        const x = padding.left + i * (barW + gap) + gap / 2;
        let cumY = padding.top + innerH;
        return (
          <g key={i}>
            {d.values.map((v, j) => {
              const h = (v / max) * innerH;
              cumY -= h;
              return (
                <rect
                  key={j}
                  x={x}
                  y={cumY}
                  width={barW}
                  height={Math.max(h, 0)}
                  fill={series[j]?.color ?? ACCENT}
                  rx={j === d.values.length - 1 ? 3 : 0}
                >
                  <title>
                    {d.label} · {series[j]?.name}:{" "}
                    {yFormatter ? yFormatter(v) : v}
                  </title>
                </rect>
              );
            })}
            <text
              x={x + barW / 2}
              y={height - 8}
              fontSize="10"
              textAnchor="middle"
              fill="currentColor"
              fillOpacity={0.7}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// <HorizontalBarChart>
// Ranked horizontal bars (top employers, top workers).
// ============================================================
export function HorizontalBarChart({
  data,
  formatter,
  color = ACCENT,
  labelWidth = 140,
}: {
  data: { label: string; value: number; sub?: string }[];
  formatter?: (n: number) => string;
  color?: string;
  labelWidth?: number;
}) {
  if (data.length === 0) return <EmptyChart height={120} />;

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span
              className="truncate font-medium"
              style={{ minWidth: labelWidth, maxWidth: labelWidth }}
              title={d.label}
            >
              {d.label}
            </span>
            <div className="relative flex-1 overflow-hidden rounded-full bg-muted/40 h-5">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="shrink-0 font-mono tabular-nums text-right text-xs font-bold">
              {formatter ? formatter(d.value) : d.value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ============================================================
// <DonutChart>
// Simple SVG donut with legend.
// ============================================================
export function DonutChart({
  data,
  size = 160,
  thickness = 22,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart height={size} />;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumPct = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const frac = d.value / total;
            const dasharray = `${frac * circumference} ${circumference}`;
            const dashoffset = -cumPct * circumference;
            cumPct += frac;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
              >
                <title>
                  {d.label}: {d.value} ({Math.round(frac * 100)}%)
                </title>
              </circle>
            );
          })}
        </g>
        <text
          x={size / 2}
          y={size / 2 - 2}
          fontSize="22"
          fontWeight="800"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
        >
          {total}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 16}
          fontSize="9"
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.5}
          style={{ textTransform: "uppercase", letterSpacing: 1 }}
        >
          total
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="font-medium">{d.label}</span>
            <span className="ml-auto font-mono tabular-nums text-xs text-muted-foreground">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// <MultiLineChart>
// Multiple series sharing the same X axis.
// ============================================================
export function MultiLineChart({
  data, // common X labels
  series, // { name, color, values } where values aligns with data
  height = 220,
  yFormatter,
  xLabels,
}: {
  data: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
  yFormatter?: (n: number) => string;
  xLabels?: number;
}) {
  const width = 600;
  const padding = { top: 16, right: 16, bottom: 28, left: 64 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (data.length === 0 || series.length === 0) return <EmptyChart height={height} />;

  const allValues = series.flatMap((s) => s.values);
  const min = 0;
  const max = Math.max(1, ...allValues);
  const range = max - min || 1;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padding.top + innerH - t * innerH,
    value: min + t * range,
  }));

  const labelCount = xLabels ?? Math.min(8, data.length);
  const xLabelIdxs =
    labelCount >= data.length
      ? data.map((_, i) => i)
      : Array.from({ length: labelCount }, (_, i) =>
          Math.round((i * (data.length - 1)) / (labelCount - 1)),
        );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ maxHeight: height }}
      role="img"
    >
      {yTicks.map((t, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={width - padding.right}
          y1={t.y}
          y2={t.y}
          stroke="currentColor"
          strokeOpacity={0.08}
        />
      ))}
      {yTicks.map((t, i) => (
        <text
          key={i}
          x={padding.left - 8}
          y={t.y + 3}
          fontSize="10"
          textAnchor="end"
          fill="currentColor"
          fillOpacity={0.5}
        >
          {yFormatter ? yFormatter(t.value) : Math.round(t.value)}
        </text>
      ))}

      {series.map((s, si) => {
        const points = s.values.map((v, i) => ({
          x: padding.left + i * stepX,
          y: padding.top + innerH - ((v - min) / range) * innerH,
        }));
        const path = points
          .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(" ");
        return (
          <g key={si}>
            <path
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={2} fill={s.color} />
                <circle cx={p.x} cy={p.y} r={8} fill="transparent">
                  <title>
                    {data[i]} · {s.name}:{" "}
                    {yFormatter ? yFormatter(s.values[i]) : s.values[i]}
                  </title>
                </circle>
              </g>
            ))}
          </g>
        );
      })}

      {xLabelIdxs.map((i) => (
        <text
          key={i}
          x={padding.left + i * stepX}
          y={height - 8}
          fontSize="10"
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.5}
        >
          {data[i]}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// <FunnelChart>
// Sequential stages with descending widths.
// ============================================================
export function FunnelChart({
  data,
  formatter,
}: {
  data: { label: string; value: number; color: string }[];
  formatter?: (n: number) => string;
}) {
  if (data.length === 0) return <EmptyChart height={140} />;
  const max = Math.max(1, ...data.map((d) => d.value));
  const totalEntries = data[0]?.value ?? 0;

  return (
    <ul className="space-y-1.5">
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        const conversionPct =
          totalEntries > 0 ? Math.round((d.value / totalEntries) * 100) : 0;
        return (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span
              className="shrink-0 font-medium"
              style={{ minWidth: 100, maxWidth: 100 }}
              title={d.label}
            >
              {d.label}
            </span>
            <div className="relative flex-1">
              <div
                className="h-7 rounded-md transition-all flex items-center px-3"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  backgroundColor: d.color,
                  minWidth: "fit-content",
                }}
              >
                <span className="text-xs font-bold text-black/80 whitespace-nowrap">
                  {formatter ? formatter(d.value) : d.value}
                </span>
              </div>
            </div>
            <span className="w-12 shrink-0 text-right text-xs font-mono tabular-nums text-muted-foreground">
              {i === 0 ? "—" : `${conversionPct}%`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ============================================================
// <Heatmap>
// 2D grid (days × hours, or any rows × cols) with cell intensity.
// ============================================================
export function Heatmap({
  data,
  rowLabels,
  colLabels,
  color = ACCENT,
  cellSize = 18,
  valueFormatter,
}: {
  // 2D matrix indexed [row][col]
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  color?: string;
  cellSize?: number;
  valueFormatter?: (n: number) => string;
}) {
  if (data.length === 0) return <EmptyChart height={160} />;

  const max = Math.max(1, ...data.flat());
  const rowLabelW = 36;
  const colLabelH = 18;
  const gap = 2;
  const innerW = colLabels.length * (cellSize + gap);
  const innerH = rowLabels.length * (cellSize + gap);
  const width = rowLabelW + innerW + 8;
  const height = colLabelH + innerH + 4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="xMinYMid meet"
      style={{ maxHeight: height + 4 }}
      role="img"
    >
      {/* Col labels (every 3rd) */}
      {colLabels.map((c, i) =>
        i % 3 === 0 ? (
          <text
            key={i}
            x={rowLabelW + i * (cellSize + gap) + cellSize / 2}
            y={colLabelH - 6}
            fontSize="9"
            textAnchor="middle"
            fill="currentColor"
            fillOpacity={0.5}
          >
            {c}
          </text>
        ) : null,
      )}

      {/* Row labels */}
      {rowLabels.map((r, i) => (
        <text
          key={i}
          x={rowLabelW - 6}
          y={colLabelH + i * (cellSize + gap) + cellSize / 2 + 3}
          fontSize="10"
          textAnchor="end"
          fill="currentColor"
          fillOpacity={0.6}
        >
          {r}
        </text>
      ))}

      {/* Cells */}
      {data.map((row, ri) =>
        row.map((v, ci) => {
          const intensity = v / max;
          const opacity = v > 0 ? Math.max(0.08, intensity) : 0.04;
          const x = rowLabelW + ci * (cellSize + gap);
          const y = colLabelH + ri * (cellSize + gap);
          return (
            <rect
              key={`${ri}-${ci}`}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={v > 0 ? color : "currentColor"}
              fillOpacity={opacity}
            >
              <title>
                {rowLabels[ri]} · {colLabels[ci]}:{" "}
                {valueFormatter ? valueFormatter(v) : v}
              </title>
            </rect>
          );
        }),
      )}
    </svg>
  );
}

// ============================================================
// Helpers
// ============================================================
function EmptyChart({ height, children }: { height: number; children?: ReactNode }) {
  return (
    <div
      className="flex items-center justify-center text-xs text-muted-foreground"
      style={{ height }}
    >
      {children ?? "No data yet."}
    </div>
  );
}

export const CHART_COLORS = {
  accent: "#FACC15",
  accentDark: "#CA9F0C",
  green: "#22C55E",
  greenDark: "#15803D",
  blue: "#3B82F6",
  red: "#EF4444",
  amber: "#F59E0B",
  muted: "#94A3B8",
  slate: "#64748B",
};
