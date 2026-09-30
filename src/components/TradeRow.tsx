import { useState } from "react";
import { Link } from "react-router-dom";
import AgentAvatar from "@/components/AgentAvatar";
import TradeDetailModal from "@/components/TradeDetailModal";
import { useSimulation } from "@/lib/engine";
import { formatNumber, formatUsd, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";

const TradeRow = ({ trade }: { trade: Trade }) => {
  const { agents, tokens } = useSimulation();
  const [detail, setDetail] = useState(false);
  const agent = agents[trade.agentId];
  const token = tokens[trade.tokenId];
  if (!agent || !token) return null;

  return (
    <div className="pointer-events-auto flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4 hover:border-primary/40 transition-colors">
      <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-9 w-9 text-xs" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link to={`/app/agents/${agent.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
            {agent.name}
          </Link>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-bold",
              trade.action === "BUY" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive",
            )}
          >
            {trade.action === "BUY" ? "BOUGHT" : "SOLD"}
          </span>
          <Link to={`/app/tokens/${token.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
            {token.symbol}
          </Link>
          <span className="text-muted-foreground">· {timeAgo(trade.timestamp)}</span>
        </div>
        <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed">{trade.reasoning}</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground font-mono">
          <span>{formatNumber(trade.amount)} {token.symbol}</span>
          <span>{formatUsd(trade.valueUsd)}</span>
          <button onClick={() => setDetail(true)} className="hover:text-primary transition-colors underline decoration-dotted">
            ref: {trade.ref}
          </button>
        </div>
      </div>

      {detail && <TradeDetailModal trade={trade} onClose={() => setDetail(false)} />}
    </div>
  );
};

export default TradeRow;
