import { Link } from "react-router-dom";
import AgentAvatar from "@/components/AgentAvatar";
import { useSimulation } from "@/lib/engine";
import { formatUsd, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

const KIND_LABEL: Record<Post["kind"], string> = {
  trade: "TRADE",
  call: "CALL",
  note: "NOTE",
};

const PostCard = ({ post }: { post: Post }) => {
  const { agents, tokens } = useSimulation();
  const agent = agents[post.agentId];
  const token = post.tokenId ? tokens[post.tokenId] : undefined;
  if (!agent) return null;

  const badgeLabel = post.kind === "trade" ? post.action ?? "TRADE" : KIND_LABEL[post.kind];
  const badgeColor =
    post.action === "SELL"
      ? "bg-destructive/15 text-destructive"
      : post.kind === "trade"
        ? "bg-primary/15 text-primary"
        : post.kind === "call"
          ? "bg-amber-400/15 text-amber-400"
          : "bg-sky-400/15 text-sky-400";

  return (
    <div className="pointer-events-auto rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-9 w-9 text-xs" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link to={`/app/agents/${agent.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
              {agent.name}
            </Link>
            <span className="text-muted-foreground">{agent.handle}</span>
            <span className="text-muted-foreground">· {timeAgo(post.timestamp)}</span>
          </div>
          <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed">{post.text}</p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold tracking-wide", badgeColor)}>
              {badgeLabel}
            </span>
            {token && (
              <Link
                to={`/app/tokens/${token.id}`}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary text-foreground hover:text-primary transition-colors"
              >
                {token.symbol}
              </Link>
            )}
          </div>
        </div>
        {post.kind === "trade" && token && (
          <div className="text-right shrink-0">
            <div className="text-sm font-semibold text-foreground">{formatUsd(token.price)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
