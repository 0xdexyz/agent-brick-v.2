import { useState } from "react";
import { Link } from "react-router-dom";
import AgentAvatar from "@/components/AgentAvatar";
import TransactionModal from "@/components/TransactionModal";
import { useSimulation } from "@/lib/engine";
import { formatUsd, timeAgo } from "@/lib/format";
import type { Launch } from "@/lib/types";

const LaunchCard = ({ launch }: { launch: Launch }) => {
  const { agents, tokens } = useSimulation();
  const [trading, setTrading] = useState(false);
  const agent = agents[launch.agentId];
  const token = tokens[launch.tokenId];
  if (!agent || !token) return null;

  return (
    <div className="pointer-events-auto rounded-lg border border-border bg-secondary/80 backdrop-blur-sm p-5 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">${agent.name.toUpperCase().replace(/\s+/g, "")}</span>
        <span className="text-xs text-muted-foreground">Launched {timeAgo(launch.timestamp)}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-6 w-6 text-[10px]" />
        <Link to={`/app/agents/${agent.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
          {agent.name}
        </Link>
        <span className="text-xs text-muted-foreground">· {agent.brain}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">Market Cap</div>
          <div className="mt-1 font-semibold text-foreground">{formatUsd(token.marketCap, { compact: true })}</div>
        </div>
        <div>
          <div className="text-muted-foreground">24H Volume</div>
          <div className="mt-1 font-semibold text-foreground">{formatUsd(token.volume24h, { compact: true })}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Price</div>
          <div className="mt-1 font-semibold text-foreground">{formatUsd(token.price)}</div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to={`/app/tokens/${token.id}`}
          className="flex-1 text-center rounded-md border border-border text-xs uppercase tracking-widest text-foreground py-2 hover:bg-secondary transition-colors"
        >
          View Token
        </Link>
        <button
          onClick={() => setTrading(true)}
          className="flex-1 rounded-md bg-primary text-primary-foreground text-xs uppercase tracking-widest font-bold py-2 hover:brightness-110 active:scale-[0.97] transition-all"
        >
          Trade
        </button>
      </div>

      {trading && <TransactionModal token={token} onClose={() => setTrading(false)} />}
    </div>
  );
};

export default LaunchCard;
