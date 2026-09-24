import { useSimulation } from "@/lib/engine";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOT_COLORS = ["#22c55e", "#f472b6", "#38bdf8", "#facc15", "#a78bfa", "#fb923c"];

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

const Ticker = () => {
  const { tokens } = useSimulation();
  const list = Object.values(tokens);
  const items = [...list, ...list];

  return (
    <div className="pointer-events-auto border-b border-border bg-hero-bg/60 backdrop-blur overflow-hidden whitespace-nowrap">
      <div className="flex w-max animate-marquee py-2">
        {items.map((token, i) => (
          <span key={`${token.id}-${i}`} className="flex items-center gap-2 px-6 text-xs font-medium tracking-wide">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: DOT_COLORS[hashSeed(token.id) % DOT_COLORS.length] }}
            />
            <span className="text-foreground">{token.symbol}</span>
            <span className={cn(token.change24h >= 0 ? "text-primary" : "text-destructive")}>
              {formatPercent(token.change24h)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
