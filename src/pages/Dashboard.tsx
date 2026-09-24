import { useState } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import LaunchAgentModal from "@/components/LaunchAgentModal";
import FundAgentModal from "@/components/FundAgentModal";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import { formatSignedUsd, formatUsd } from "@/lib/format";
import type { Agent } from "@/lib/types";

const Dashboard = () => {
  const { agents, snapshot } = useSimulation();
  const { ownedAgentIds, blurBalances } = useWallet();
  const [launching, setLaunching] = useState(false);
  const [funding, setFunding] = useState<Agent | null>(null);

  const ownedAgents = ownedAgentIds.map((id) => agents[id]).filter((a): a is Agent => Boolean(a));
  const ownedSnapshots = ownedAgents.map((a) => snapshot(a.id)).filter((s): s is NonNullable<typeof s> => Boolean(s));

  const portfolio = ownedSnapshots.reduce((sum, s) => sum + s.equity, 0);
  const totalPnl = ownedSnapshots.reduce((sum, s) => sum + s.pnl, 0);

  return (
    <div className="pointer-events-none min-h-screen px-6 md:px-10 lg:px-16 py-12 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="opacity-0 animate-fade-up text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight" style={{ animationDelay: "0.1s" }}>
            Dashboard
          </h1>
          <p className="opacity-0 animate-fade-up mt-2 text-muted-foreground max-w-xl" style={{ animationDelay: "0.2s" }}>
            Every agent you've launched or connected, in one place.
          </p>
        </div>
        <button
          onClick={() => setLaunching(true)}
          className="pointer-events-auto opacity-0 animate-fade-up inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs uppercase tracking-widest px-4 py-2.5 font-bold hover:brightness-110 active:scale-[0.97] transition-all"
          style={{ animationDelay: "0.2s" }}
        >
          + Add another agent
        </button>
      </div>

      {ownedAgents.length === 0 ? (
        <div className="opacity-0 animate-fade-up mt-8 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 p-8 text-center" style={{ animationDelay: "0.3s" }}>
          <p className="text-sm text-muted-foreground">You haven't launched or connected an agent yet.</p>
          <button
            onClick={() => setLaunching(true)}
            className="pointer-events-auto mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs uppercase tracking-widest px-4 py-2.5 font-bold hover:brightness-110 transition-all"
          >
            + Launch your first agent
          </button>
        </div>
      ) : (
        <>
          <div className="opacity-0 animate-fade-up mt-8 grid grid-cols-2 md:grid-cols-4 gap-3" style={{ animationDelay: "0.3s" }}>
            <StatCard label="Portfolio" value={blurBalances ? "••••" : formatUsd(portfolio)} />
            <StatCard label="Total P&L" value={blurBalances ? "••••" : formatSignedUsd(totalPnl)} tone={totalPnl >= 0 ? "up" : "down"} />
            <StatCard label="Agents" value={String(ownedAgents.length)} />
            <StatCard label="Total Trades" value={String(ownedSnapshots.reduce((sum, s) => sum + s.trades, 0))} />
          </div>

          <div className="opacity-0 animate-fade-up mt-6 flex flex-wrap gap-2" style={{ animationDelay: "0.35s" }}>
            {ownedAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setFunding(agent)}
                className="pointer-events-auto rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-primary/40 transition-colors"
              >
                Fund {agent.name}
              </button>
            ))}
          </div>

          <div className="opacity-0 animate-fade-up mt-4" style={{ animationDelay: "0.4s" }}>
            <LeaderboardTable agents={ownedSnapshots} />
          </div>
        </>
      )}

      {launching && <LaunchAgentModal onClose={() => setLaunching(false)} />}
      {funding && <FundAgentModal agent={funding} onClose={() => setFunding(null)} />}
    </div>
  );
};

const StatCard = ({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 p-4">
    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className={`mt-1 text-lg font-semibold font-mono ${tone === "up" ? "text-primary" : tone === "down" ? "text-destructive" : "text-foreground"}`}>
      {value}
    </div>
  </div>
);

export default Dashboard;
