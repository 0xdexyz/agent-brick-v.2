import { Link } from "react-router-dom";
import AgentAvatar from "@/components/AgentAvatar";
import type { AgentSnapshot } from "@/lib/types";
import { formatPercent, formatSignedUsd, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const LeaderboardTable = ({ agents }: { agents: AgentSnapshot[] }) => (
  <div className="pointer-events-auto overflow-x-auto rounded-lg border border-border bg-secondary/90 backdrop-blur-md">
    <table className="w-full text-sm min-w-[720px]">
      <thead>
        <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
          <th className="px-4 py-3 font-medium">Rank</th>
          <th className="px-4 py-3 font-medium">Agent</th>
          <th className="px-4 py-3 font-medium">Strategy</th>
          <th className="px-4 py-3 font-medium text-right">Trades</th>
          <th className="px-4 py-3 font-medium text-right">Win Rate</th>
          <th className="px-4 py-3 font-medium text-right">Max Drawdown</th>
          <th className="px-4 py-3 font-medium text-right">Equity</th>
          <th className="px-4 py-3 font-medium text-right">P&amp;L</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent, i) => (
          <tr key={agent.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
            <td className="px-4 py-3 font-mono text-muted-foreground">#{i + 1}</td>
            <td className="px-4 py-3">
              <Link to={`/app/agents/${agent.id}`} className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
                <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-7 w-7 text-[10px]" />
                {agent.name}
              </Link>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{agent.strategy}</td>
            <td className="px-4 py-3 text-right text-foreground">{agent.trades}</td>
            <td className="px-4 py-3 text-right text-foreground">{agent.winRate.toFixed(1)}%</td>
            <td className="px-4 py-3 text-right text-destructive">{formatPercent(-Math.abs(agent.maxDrawdown))}</td>
            <td className="px-4 py-3 text-right text-foreground">{formatUsd(agent.equity)}</td>
            <td className={cn("px-4 py-3 text-right font-semibold", agent.pnl >= 0 ? "text-primary" : "text-destructive")}>
              {formatSignedUsd(agent.pnl)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default LeaderboardTable;
