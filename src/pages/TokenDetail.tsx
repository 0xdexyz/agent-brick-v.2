import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AgentAvatar from "@/components/AgentAvatar";
import Sparkline from "@/components/Sparkline";
import TradeRow from "@/components/TradeRow";
import TransactionModal from "@/components/TransactionModal";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/lib/engine";
import { formatNumber, formatPercent, formatSignedUsd, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const TokenDetail = () => {
  const { id } = useParams();
  const { tokens, trades, agents } = useSimulation();
  const [buying, setBuying] = useState(false);
  const token = id ? tokens[id] : undefined;

  const holders = useMemo(() => {
    if (!token) return [];
    const entries: { agent: (typeof agents)[string]; amount: number; value: number; pnl: number }[] = [];
    Object.values(agents).forEach((agent) => {
      const position = agent.positions[token.id];
      if (!position || position.amount <= 0) return;
      entries.push({
        agent,
        amount: position.amount,
        value: position.amount * token.price,
        pnl: position.amount * (token.price - position.avgPrice),
      });
    });
    return entries.sort((a, b) => b.value - a.value);
  }, [agents, token]);

  if (!token) {
    return (
      <div className="min-h-screen px-6 py-12 max-w-[1400px] mx-auto">
        <p className="text-muted-foreground">
          Token not found. <Link to="/app" className="pointer-events-auto text-primary hover:underline">Back to Pulse</Link>
        </p>
      </div>
    );
  }

  const positive = token.change24h >= 0;
  const tokenTrades = trades.filter((t) => t.tokenId === token.id).slice(0, 20);

  return (
    <div className="pointer-events-none min-h-screen px-6 md:px-10 lg:px-16 py-12 max-w-[1400px] mx-auto">
      <div className="opacity-0 animate-fade-up flex flex-wrap items-start justify-between gap-4" style={{ animationDelay: "0.1s" }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{token.symbol}</h1>
          <p className="text-muted-foreground">{token.name} · Solana</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-foreground">{formatUsd(token.price)}</span>
            <span className={cn("text-sm font-semibold", positive ? "text-primary" : "text-destructive")}>
              {formatPercent(token.change24h)}
            </span>
          </div>
        </div>
        <Button variant="hero" className="pointer-events-auto rounded-sm" onClick={() => setBuying(true)}>
          Buy {token.symbol}
        </Button>
      </div>

      <div className="opacity-0 animate-fade-up mt-8 h-56 rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4" style={{ animationDelay: "0.2s" }}>
        <Sparkline data={token.history} positive={positive} className="h-full w-full" />
      </div>

      <div className="opacity-0 animate-fade-up grid grid-cols-2 md:grid-cols-4 gap-3 mt-6" style={{ animationDelay: "0.3s" }}>
        <Stat label="Market Cap" value={formatUsd(token.marketCap, { compact: true })} />
        <Stat label="Liquidity" value={formatUsd(token.liquidity, { compact: true })} />
        <Stat label="24H Volume" value={formatUsd(token.volume24h, { compact: true })} />
        <Stat label="Holders" value={formatNumber(token.holders)} />
      </div>

      {holders.length > 0 && (
        <div className="opacity-0 animate-fade-up mt-10" style={{ animationDelay: "0.35s" }}>
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Agents Holding {token.symbol}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {holders.map(({ agent, amount, value, pnl }) => (
              <Link
                key={agent.id}
                to={`/app/agents/${agent.id}`}
                className="pointer-events-auto flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4 hover:border-primary/40 transition-colors"
              >
                <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-9 w-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {amount.toFixed(2)} {token.symbol} · {formatUsd(value)}
                  </div>
                </div>
                <span className={cn("text-xs font-semibold shrink-0", pnl >= 0 ? "text-primary" : "text-destructive")}>
                  {formatSignedUsd(pnl)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="opacity-0 animate-fade-up mt-10" style={{ animationDelay: "0.4s" }}>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Recent Activity</h2>
        <div className="space-y-3">
          {tokenTrades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
          {tokenTrades.length === 0 && <p className="text-sm text-muted-foreground">No trades yet for this token.</p>}
        </div>
      </div>

      {buying && <TransactionModal token={token} onClose={() => setBuying(false)} />}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4">
    <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
  </div>
);

export default TokenDetail;
