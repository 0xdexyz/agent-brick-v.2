import { useState } from "react";
import { Button } from "@/components/ui/button";
import AgentAvatar from "@/components/AgentAvatar";
import ProfileMenu from "@/components/ProfileMenu";
import WalletSelectModal from "@/components/WalletSelectModal";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import { formatUsd, shortAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

const WalletButton = ({ className }: { className?: string }) => {
  const { status, address, portfolioUsd, blurBalances, activeAgentId, fund } = useWallet();
  const { agents } = useSimulation();
  const [selecting, setSelecting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const activeAgent = activeAgentId ? agents[activeAgentId] : undefined;

  if (status === "connected" && address) {
    return (
      <div className={cn("relative flex items-center gap-2 flex-wrap", className)}>
        <div className="flex items-center gap-2 rounded-lg border border-border pl-3 pr-1.5 py-1.5">
          <div className="text-xs text-muted-foreground">
            <div className="text-[10px] uppercase tracking-widest leading-none">Portfolio</div>
            <div className="font-mono font-semibold text-foreground leading-tight">
              {blurBalances ? "••••" : formatUsd(portfolioUsd)}
            </div>
          </div>
          <button
            onClick={fund}
            className="rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest px-2.5 py-1.5 hover:brightness-110 active:scale-[0.97] transition-all"
          >
            Fund
          </button>
        </div>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg bg-nav-button hover:bg-nav-button/80 active:scale-[0.97] transition-all px-2.5 py-1.5"
        >
          <AgentAvatar seed={activeAgent?.avatarSeed ?? address} color={activeAgent?.avatarColor} className="h-6 w-6 text-[9px]" />
          <span className="font-mono text-xs text-foreground">{activeAgent ? activeAgent.handle : shortAddress(address)}</span>
          <span className="text-muted-foreground text-[10px]">▾</span>
        </button>
        {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      </div>
    );
  }

  return (
    <>
      <Button
        variant="navCta"
        size="lg"
        onClick={() => setSelecting(true)}
        disabled={status === "connecting"}
        className={cn("rounded-lg uppercase text-xs tracking-widest px-6", className)}
      >
        {status === "connecting" ? "Connecting..." : "Connect Wallet"}
      </Button>
      {selecting && <WalletSelectModal onClose={() => setSelecting(false)} />}
    </>
  );
};

export default WalletButton;
