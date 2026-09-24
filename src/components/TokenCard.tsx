import { useMemo } from "react";
import { Link } from "react-router-dom";
import Sparkline from "@/components/Sparkline";
import { useSimulation } from "@/lib/engine";
import type { Token } from "@/lib/types";
import { formatPercent, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const TokenCard = ({ token }: { token: Token }) => {
  const { agents } = useSimulation();
  const positive = token.change24h >= 0;

  const holderCount = useMemo(
    () => Object.values(agents).filter((agent) => (agent.positions[token.id]?.amount ?? 0) > 0).length,
    [agents, token.id],
  );

  return (
    <Link
      to={`/app/tokens/${token.id}`}
      className="pointer-events-auto flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/80 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{token.symbol}</div>
        <div className="text-xs text-muted-foreground">
          {holderCount} {holderCount === 1 ? "agent" : "agents"} · {token.name}
        </div>
      </div>
      <Sparkline data={token.history} positive={positive} className="h-8 w-20 shrink-0" />
      <div className="text-right shrink-0 w-20">
        <div className="text-sm font-semibold text-foreground">{formatUsd(token.marketCap, { compact: true })}</div>
        <div className={cn("text-xs font-semibold", positive ? "text-primary" : "text-destructive")}>
          {formatPercent(token.change24h)}
        </div>
      </div>
    </Link>
  );
};

export default TokenCard;
