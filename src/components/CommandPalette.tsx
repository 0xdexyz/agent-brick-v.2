import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalPortal from "@/components/ModalPortal";
import { useSimulation } from "@/lib/engine";
import { onOpenCommandPalette } from "@/lib/commandPalette";
import { formatPercent, formatSignedUsd, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  sub: string;
  action: () => void;
}

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const { leaderboard, tokens, resetDemo } = useSimulation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => onOpenCommandPalette(() => setOpen(true)), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const nav = (path: string) => () => {
      navigate(path);
      setOpen(false);
    };
    const staticItems: CommandItem[] = [
      { id: "go-pulse", label: "Go to Pulse", sub: "Live agent activity", action: nav("/app") },
      { id: "go-leaderboard", label: "Go to Leaderboard", sub: "Ranked agent performance", action: nav("/app/leaderboard") },
      { id: "go-launches", label: "Go to Launches", sub: "Tokens launched by agents", action: nav("/app/launches") },
      { id: "go-activity", label: "Go to Activity", sub: "Chronological trade stream", action: nav("/app/activity") },
      {
        id: "reset-demo",
        label: "Reset Demo Data",
        sub: "Restore the initial agents, tokens, and activity",
        action: () => {
          resetDemo();
          setOpen(false);
        },
      },
    ];
    const agentItems: CommandItem[] = leaderboard.map((agent) => ({
      id: `agent-${agent.id}`,
      label: agent.name,
      sub: `AI Trading Agent · ${agent.strategy} · ${formatSignedUsd(agent.pnl)}`,
      action: nav(`/app/agents/${agent.id}`),
    }));
    const tokenItems: CommandItem[] = Object.values(tokens).map((token) => ({
      id: `token-${token.id}`,
      label: token.symbol,
      sub: `Solana Token · ${formatUsd(token.price)} · ${formatPercent(token.change24h)}`,
      action: nav(`/app/tokens/${token.id}`),
    }));
    const walletItems: CommandItem[] = leaderboard.map((agent) => ({
      id: `wallet-${agent.id}`,
      label: agent.wallet,
      sub: `Solana wallet · ${agent.name}`,
      action: nav(`/app/agents/${agent.id}`),
    }));

    const all = [...staticItems, ...agentItems, ...tokenItems, ...walletItems];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((item) => item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q));
  }, [query, leaderboard, tokens, navigate, resetDemo]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <ModalPortal>
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-24 px-4 animate-fade-in" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-hero-bg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              items[activeIndex]?.action();
            }
          }}
          placeholder="Search agents, tokens, or pages..."
          className="w-full bg-transparent border-b border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground text-center">No results</div>}
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={item.action}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full flex-col items-start px-4 py-2.5 text-left transition-colors",
                i === activeIndex ? "bg-secondary" : "",
              )}
            >
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

export default CommandPalette;
