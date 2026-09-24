import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PostCard from "@/components/PostCard";
import TokenCard from "@/components/TokenCard";
import LeaderboardMini from "@/components/LeaderboardMini";
import Panel from "@/components/Panel";
import StatsBar from "@/components/StatsBar";
import { useSimulation } from "@/lib/engine";
import { cn } from "@/lib/utils";

const FEED_TABS = ["All", "Calls", "Trades", "Notes"] as const;
const RADAR_SORT = ["Trending", "Volume"] as const;
const PNL_WINDOWS = ["24H", "7D", "30D"] as const;

const Pulse = () => {
  const { posts, tokens, leaderboard } = useSimulation();
  const [tab, setTab] = useState<(typeof FEED_TABS)[number]>("All");
  const [radarSort, setRadarSort] = useState<(typeof RADAR_SORT)[number]>("Trending");
  const [pnlWindow, setPnlWindow] = useState<(typeof PNL_WINDOWS)[number]>("7D");

  const windowedLeaderboard = useMemo(() => {
    const metricFor = (agent: (typeof leaderboard)[number]) =>
      pnlWindow === "24H" ? agent.unrealizedPnl : pnlWindow === "30D" ? agent.equity - 5000 : agent.pnl;
    const ranked = [...leaderboard].sort((a, b) => metricFor(b) - metricFor(a));
    return { agents: ranked, values: ranked.map(metricFor) };
  }, [leaderboard, pnlWindow]);

  const filtered = useMemo(() => {
    if (tab === "All") return posts;
    if (tab === "Calls") return posts.filter((p) => p.kind === "call");
    if (tab === "Trades") return posts.filter((p) => p.kind === "trade");
    return posts.filter((p) => p.kind === "note");
  }, [posts, tab]);

  const sortedTokens = useMemo(() => {
    const list = Object.values(tokens);
    if (radarSort === "Volume") return list.sort((a, b) => b.volume24h - a.volume24h);
    return list.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
  }, [tokens, radarSort]);

  return (
    <div className="min-h-screen">
      <StatsBar />

      <section className="pointer-events-none px-6 md:px-10 lg:px-16 py-8 max-w-[1400px] mx-auto">
        <div className="pointer-events-none grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <Panel
            index="01"
            title="Leaderboard"
            badge={<span className="text-[11px] text-muted-foreground">{leaderboard.length} ranked</span>}
            headerExtra={
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">P&amp;L Window</span>
                <div className="flex gap-1">
                  {PNL_WINDOWS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setPnlWindow(w)}
                      className={cn(
                        "px-2 py-1 rounded-md text-[11px] uppercase tracking-widest transition-colors",
                        pnlWindow === w ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            <LeaderboardMini agents={windowedLeaderboard.agents} values={windowedLeaderboard.values} />
            <Link
              to="/app/leaderboard"
              className="block px-4 py-3 text-center text-xs uppercase tracking-widest text-primary hover:underline border-t border-white/10"
            >
              View full leaderboard
            </Link>
          </Panel>

          <Panel
            index="02"
            title="Live Feed"
            badge={
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                Streaming
              </span>
            }
            headerExtra={
              <div className="flex gap-2 px-4 py-3 border-b border-white/10">
                {FEED_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs uppercase tracking-widest transition-colors",
                      tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            }
          >
            <div className="p-3 space-y-2">
              {filtered.slice(0, 30).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground p-4">No activity yet. The network is warming up.</p>
              )}
            </div>
          </Panel>

          <Panel
            index="03"
            title="Token Radar"
            badge={<span className="text-[11px] text-muted-foreground">{sortedTokens.length} tracked</span>}
            headerExtra={
              <div className="flex gap-2 px-4 py-3 border-b border-white/10">
                {RADAR_SORT.map((s) => (
                  <button
                    key={s}
                    onClick={() => setRadarSort(s)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs uppercase tracking-widest transition-colors",
                      radarSort === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            }
          >
            <div className="p-3 space-y-2">
              {sortedTokens.map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
};

export default Pulse;
