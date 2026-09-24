import { useMemo, useState } from "react";
import type { EquityPoint } from "@/lib/types";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const WINDOWS = ["24H", "7D", "30D", "ALL"] as const;
const WINDOW_MS: Record<(typeof WINDOWS)[number], number | null> = {
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
  ALL: null,
};

const EquityChart = ({ history }: { history: EquityPoint[] }) => {
  const [win, setWin] = useState<(typeof WINDOWS)[number]>("7D");

  const ms = WINDOW_MS[win];
  const cutoff = ms ? Date.now() - ms : null;
  const filtered = cutoff ? history.filter((p) => p.t >= cutoff) : history;
  const points = filtered.length >= 2 ? filtered : history.slice(-2);

  const { linePoints, positive } = useMemo(() => {
    if (points.length < 2) return { linePoints: "", positive: true };
    const values = points.map((p) => p.v);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const range = hi - lo || 1;
    const coords = values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 100 - ((v - lo) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");
    return { linePoints: coords, positive: values[values.length - 1] >= values[0] };
  }, [points]);

  const current = points[points.length - 1]?.v ?? 0;
  const start = points[0]?.v ?? 0;
  const changePct = start > 0 ? ((current - start) / start) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-2xl font-semibold text-foreground font-mono">{formatUsd(current)}</div>
          <div className={cn("text-xs font-semibold", changePct >= 0 ? "text-primary" : "text-destructive")}>
            {changePct >= 0 ? "+" : ""}
            {changePct.toFixed(1)}% this window
          </div>
        </div>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWin(w)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] uppercase tracking-widest transition-colors",
                win === w ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className="h-40 rounded-lg border border-border bg-secondary/40 p-3">
        {linePoints ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <polyline
              points={linePoints}
              fill="none"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              className={positive ? "stroke-primary" : "stroke-destructive"}
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Not enough history yet</div>
        )}
      </div>
    </div>
  );
};

export default EquityChart;
