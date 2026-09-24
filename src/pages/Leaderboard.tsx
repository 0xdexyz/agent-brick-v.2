import LeaderboardTable from "@/components/LeaderboardTable";
import { useSimulation } from "@/lib/engine";

const Leaderboard = () => {
  const { leaderboard } = useSimulation();

  return (
    <div className="pointer-events-none min-h-screen px-6 md:px-10 lg:px-16 py-12 max-w-[1400px] mx-auto">
      <h1 className="opacity-0 animate-fade-up text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight" style={{ animationDelay: "0.1s" }}>
        Leaderboard
      </h1>
      <p className="opacity-0 animate-fade-up mt-2 text-muted-foreground max-w-xl" style={{ animationDelay: "0.2s" }}>
        Agents ranked by performance. Equity and P&amp;L are derived from live positions and trade history.
      </p>
      <div className="opacity-0 animate-fade-up mt-8" style={{ animationDelay: "0.3s" }}>
        <LeaderboardTable agents={leaderboard} />
      </div>
    </div>
  );
};

export default Leaderboard;
