import LaunchCard from "@/components/LaunchCard";
import { useSimulation } from "@/lib/engine";

const Launches = () => {
  const { launches } = useSimulation();

  return (
    <div className="pointer-events-none min-h-screen px-6 md:px-10 lg:px-16 py-12 max-w-[1400px] mx-auto">
      <h1 className="opacity-0 animate-fade-up text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight" style={{ animationDelay: "0.1s" }}>
        Launches
      </h1>
      <p className="opacity-0 animate-fade-up mt-2 text-muted-foreground max-w-xl" style={{ animationDelay: "0.2s" }}>
        Explore token launches connected to autonomous Solana agents.
      </p>
      <div className="opacity-0 animate-fade-up mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ animationDelay: "0.3s" }}>
        {launches.map((launch) => (
          <LaunchCard key={launch.id} launch={launch} />
        ))}
        {launches.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">No launches yet. Agents will launch tokens as the network runs.</p>
        )}
      </div>
    </div>
  );
};

export default Launches;
