import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AgentAvatar from "@/components/AgentAvatar";
import EquityChart from "@/components/EquityChart";
import FundAgentModal from "@/components/FundAgentModal";
import PostCard from "@/components/PostCard";
import TradeRow from "@/components/TradeRow";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/lib/engine";
import { formatPercent, formatSignedUsd, formatUsd, shortAddress, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const AgentProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { snapshot, posts, trades, tokens, agents, claimRewards } = useSimulation();
  const agent = id ? snapshot(id) : undefined;
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    if ((location.state as { promptFund?: boolean } | null)?.promptFund) {
      setFunding(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  if (!agent) {
    return (
      <div className="min-h-screen px-6 py-12 max-w-[1400px] mx-auto">
        <p className="text-muted-foreground">
          Agent not found. <Link to="/app/leaderboard" className="pointer-events-auto text-primary hover:underline">Back to leaderboard</Link>
        </p>
      </div>
    );
  }

  const agentPosts = posts.filter((p) => p.agentId === agent.id).slice(0, 20);
  const agentTrades = trades.filter((t) => t.agentId === agent.id).slice(0, 20);
  const positions = Object.values(agent.positions);

  const stats: { label: string; value: string; positive?: boolean }[] = [
    { label: "P&L", value: formatSignedUsd(agent.pnl), positive: agent.pnl >= 0 },
    { label: "Equity", value: formatUsd(agent.equity) },
    { label: "Trades", value: String(agent.trades) },
    { label: "Win Rate", value: `${agent.winRate.toFixed(1)}%` },
    { label: "Max Drawdown", value: formatPercent(-Math.abs(agent.maxDrawdown)) },
  ];

  return (
    <div className="pointer-events-none min-h-screen px-6 md:px-10 lg:px-16 py-12 max-w-[1400px] mx-auto">
      <div className="opacity-0 animate-fade-up flex items-start justify-between gap-5 flex-wrap" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-start gap-5">
          <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-16 w-16 text-lg" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground uppercase tracking-tight">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.handle}</p>
            <p className="mt-2 text-sm text-foreground/80 max-w-xl">{agent.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-secondary text-foreground">{agent.strategy}</span>
              <span className="px-2 py-1 rounded bg-secondary text-foreground">{agent.brain}</span>
              <span className="px-2 py-1 rounded bg-secondary text-foreground font-mono">{shortAddress(agent.wallet)}</span>
            </div>
          </div>
        </div>
        <Button variant="hero" className="pointer-events-auto rounded-sm" onClick={() => setFunding(true)}>
          Fund Agent
        </Button>
      </div>

      <div className="opacity-0 animate-fade-up grid grid-cols-2 md:grid-cols-6 gap-3 mt-8" style={{ animationDelay: "0.2s" }}>
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
            <div className={cn("mt-1 text-lg font-semibold", stat.positive === undefined ? "text-foreground" : stat.positive ? "text-primary" : "text-destructive")}>
              {stat.value}
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Creator Rewards</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className={cn("text-lg font-semibold", agent.creatorRewards > 0 ? "text-primary" : "text-foreground")}>
              {formatUsd(agent.creatorRewards)}
            </span>
            {agent.creatorRewards > 0 && (
              <button
                onClick={() => claimRewards(agent.id)}
                className="pointer-events-auto shrink-0 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 hover:brightness-110 active:scale-[0.97] transition-all"
              >
                Claim
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="opacity-0 animate-fade-up mt-10" style={{ animationDelay: "0.25s" }}>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Performance</h2>
        <EquityChart history={agent.equityHistory ?? []} />
      </div>

      <div className="opacity-0 animate-fade-up mt-10" style={{ animationDelay: "0.3s" }}>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Holdings</h2>
        <div className="rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4 flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Cash · SOL</div>
            <div className="text-lg font-semibold text-foreground">{formatUsd(agent.cash)}</div>
          </div>
          <span className="text-xs text-muted-foreground">{positions.length} token{positions.length === 1 ? "" : "s"}</span>
        </div>
        {positions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {positions.map((position) => {
              const token = tokens[position.tokenId];
              if (!token) return null;
              const unrealized = position.amount * (token.price - position.avgPrice);
              return (
                <Link
                  key={position.tokenId}
                  to={`/app/tokens/${token.id}`}
                  className="pointer-events-auto rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{token.symbol}</span>
                    <span className={cn("text-sm font-semibold", unrealized >= 0 ? "text-primary" : "text-destructive")}>
                      {formatSignedUsd(unrealized)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {position.amount.toFixed(2)} {token.symbol} @ avg {formatUsd(position.avgPrice)}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No token positions yet.</p>
        )}
      </div>

      <div className="opacity-0 animate-fade-up mt-10" style={{ animationDelay: "0.35s" }}>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Transfers</h2>
        {agent.transfers.length > 0 ? (
          <div className="space-y-2">
            {agent.transfers.map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-3 text-sm">
                <span className="text-foreground capitalize">{transfer.kind}</span>
                <span className="text-muted-foreground">{timeAgo(transfer.timestamp)}</span>
                <span className="font-semibold text-primary">{formatSignedUsd(transfer.amountUsd)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No transfers yet. Deposits and withdrawals adjust the balance but are never counted as profit.
          </p>
        )}
      </div>

      <div className="opacity-0 animate-fade-up grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10" style={{ animationDelay: "0.4s" }}>
        <div>
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Reasoning &amp; Posts</h2>
          <div className="space-y-3">
            {agentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {agentPosts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Recent Trades</h2>
          <div className="space-y-3">
            {agentTrades.map((trade) => (
              <TradeRow key={trade.id} trade={trade} />
            ))}
            {agentTrades.length === 0 && <p className="text-sm text-muted-foreground">No trades yet.</p>}
          </div>
        </div>
      </div>

      {funding && agents[agent.id] && <FundAgentModal agent={agents[agent.id]} onClose={() => setFunding(false)} />}
    </div>
  );
};

export default AgentProfile;
