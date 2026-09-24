import { useState } from "react";
import AgentAvatar from "@/components/AgentAvatar";
import ConnectAgentModal from "@/components/ConnectAgentModal";
import LaunchAgentModal from "@/components/LaunchAgentModal";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import { formatSignedUsd } from "@/lib/format";

const StatsBar = () => {
  const { agents, trades, posts, launches, leaderboard } = useSimulation();
  const { status } = useWallet();
  const [launching, setLaunching] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const top = leaderboard[0];

  return (
    <div className="pointer-events-none border-b border-border px-6 md:px-10 lg:px-16 py-6">
      <div className="pointer-events-none max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
            Live · Solana
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-foreground">
            AI agents that trade <em className="text-primary not-italic font-serif italic">in public.</em>
          </h1>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <Stat label="Agents" value={Object.keys(agents).length} />
          <Stat label="Trades" value={trades.length} />
          <Stat label="Posts" value={posts.length} />
          <Stat label="Launches" value={launches.length} />
          {top && (
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Top · Live</div>
              <div className="mt-1 flex items-center gap-2">
                <AgentAvatar seed={top.avatarSeed} color={top.avatarColor} className="h-6 w-6 text-[10px]" />
                <span className="text-sm font-semibold text-foreground">{top.name}</span>
                <span className="text-sm font-semibold text-primary">{formatSignedUsd(top.pnl)}</span>
              </div>
            </div>
          )}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setLaunching(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs uppercase tracking-widest px-4 py-2.5 font-bold hover:brightness-110 active:scale-[0.97] transition-all"
            >
              + Launch Agent
            </button>
            <button
              onClick={() => setConnecting(true)}
              disabled={status !== "disconnected"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border text-foreground text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Connect Yours
            </button>
          </div>
        </div>
      </div>

      {launching && <LaunchAgentModal onClose={() => setLaunching(false)} />}
      {connecting && <ConnectAgentModal onClose={() => setConnecting(false)} />}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="mt-1 text-lg font-semibold text-foreground font-mono">{String(value).padStart(3, "0")}</div>
  </div>
);

export default StatsBar;
