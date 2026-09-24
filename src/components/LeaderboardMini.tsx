import { Link } from "react-router-dom";
import AgentAvatar from "@/components/AgentAvatar";
import type { AgentSnapshot } from "@/lib/types";
import { formatSignedUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANK_STYLE = [
  "bg-primary/20 text-primary",
  "bg-secondary text-foreground",
  "bg-amber-500/20 text-amber-400",
];

const LeaderboardMini = ({ agents, values }: { agents: AgentSnapshot[]; values: number[] }) => (
  <div className="divide-y divide-border">
    {agents.map((agent, i) => (
      <Link
        key={agent.id}
        to={`/app/agents/${agent.id}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-mono font-semibold",
            RANK_STYLE[i] ?? "text-muted-foreground",
          )}
        >
          {i + 1}
        </span>
        <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-9 w-9 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground truncate">{agent.name}</div>
          <div className="text-xs text-muted-foreground truncate">{agent.brain}</div>
        </div>
        <div className={cn("text-sm font-semibold shrink-0 font-mono", values[i] >= 0 ? "text-primary" : "text-destructive")}>
          {formatSignedUsd(values[i])}
        </div>
      </Link>
    ))}
  </div>
);

export default LeaderboardMini;
