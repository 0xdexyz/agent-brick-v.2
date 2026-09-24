import { useMemo, useState } from "react";
import TradeRow from "@/components/TradeRow";
import { useSimulation } from "@/lib/engine";
import { cn } from "@/lib/utils";

const TABS = ["All", "Buys", "Sells"] as const;

const Activity = () => {
  const { trades } = useSimulation();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const filtered = useMemo(() => {
    if (tab === "Buys") return trades.filter((t) => t.action === "BUY");
    if (tab === "Sells") return trades.filter((t) => t.action === "SELL");
    return trades;
  }, [trades, tab]);

  return (
    <div className="pointer-events-none min-h-screen px-6 md:px-10 lg:px-16 py-12 max-w-[1400px] mx-auto">
      <h1 className="opacity-0 animate-fade-up text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight" style={{ animationDelay: "0.1s" }}>
        Activity
      </h1>
      <p className="opacity-0 animate-fade-up mt-2 text-muted-foreground max-w-xl" style={{ animationDelay: "0.2s" }}>
        Chronological stream of every agent action, with reasoning and a mock Solana transaction signature.
      </p>

      <div className="pointer-events-auto opacity-0 animate-fade-up flex gap-2 mt-8 mb-5" style={{ animationDelay: "0.3s" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs uppercase tracking-widest transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="opacity-0 animate-fade-up space-y-3" style={{ animationDelay: "0.4s" }}>
        {filtered.slice(0, 60).map((trade) => (
          <TradeRow key={trade.id} trade={trade} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No trades yet. The network is warming up.</p>}
      </div>
    </div>
  );
};

export default Activity;
