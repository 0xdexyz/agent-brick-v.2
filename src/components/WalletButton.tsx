import { useState } from "react";
import AgentAvatar from "@/components/AgentAvatar";
import FundAgentModal from "@/components/FundAgentModal";
import LaunchAgentModal from "@/components/LaunchAgentModal";
import ProfileMenu from "@/components/ProfileMenu";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import { shortAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";

const formatPortfolio = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const WalletButton = ({ className }: { className?: string }) => {
  const { address, blurBalances, ownedAgentIds, activeAgentId } = useWallet();
  const { agents } = useSimulation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [funding, setFunding] = useState<Agent | null>(null);
  const [launching, setLaunching] = useState(false);

  const ownedAgents = ownedAgentIds.map((id) => agents[id]).filter((a): a is Agent => Boolean(a));
  const activeAgent = (activeAgentId ? agents[activeAgentId] : undefined) ?? ownedAgents[0];
  const portfolio = ownedAgents.reduce((sum, agent) => sum + agent.cash, 0);

  // This bar always renders, whether or not an agent has been launched yet — owning an
  // agent (local to this browser) is independent of having a real Solana wallet
  // connected. With no agent yet, Portfolio reads $0.00 and Fund routes into the launch
  // flow instead of a transfer, since there's nothing to fund yet. Connecting a real
  // wallet lives inside the profile dropdown (and inside Fund Agent itself) instead of
  // as its own nav button, so this bar never has to fight for space at narrower widths.
  return (
    <div className={cn("relative flex items-center gap-2 flex-wrap", className)}>
      <div className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
        <div className="text-[10px] uppercase tracking-widest leading-none">Portfolio</div>
        <div className="font-mono font-semibold text-foreground leading-tight">
          {blurBalances ? "••••" : formatPortfolio(portfolio)}
        </div>
      </div>
      <button
        onClick={() => (activeAgent ? setFunding(activeAgent) : setLaunching(true))}
        className="rounded-lg bg-primary text-primary-foreground text-xs uppercase tracking-widest font-bold px-3 py-2 hover:brightness-110 active:scale-[0.97] transition-all"
      >
        Fund
      </button>
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg bg-nav-button hover:bg-nav-button/80 active:scale-[0.97] transition-all px-2.5 py-1.5"
      >
        <AgentAvatar seed={activeAgent?.avatarSeed ?? address ?? "guest"} color={activeAgent?.avatarColor} className="h-6 w-6 text-[9px]" />
        <span className="font-mono text-xs text-foreground">
          {activeAgent ? activeAgent.handle : address ? shortAddress(address) : "Guest"}
        </span>
        <span className="text-muted-foreground text-[10px]">▾</span>
      </button>
      {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      {funding && <FundAgentModal agent={funding} onClose={() => setFunding(null)} />}
      {launching && <LaunchAgentModal onClose={() => setLaunching(false)} />}
    </div>
  );
};

export default WalletButton;
