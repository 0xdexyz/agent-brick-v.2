import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgentAvatar from "@/components/AgentAvatar";
import FundAgentModal from "@/components/FundAgentModal";
import LaunchAgentModal from "@/components/LaunchAgentModal";
import WalletSelectModal from "@/components/WalletSelectModal";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import { formatUsd, shortAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";

const ProfileMenu = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const { agents } = useSimulation();
  const { status, address, ownedAgentIds, activeAgentId, blurBalances, setActiveAgent, toggleBlurBalances, disconnect } = useWallet();
  const [funding, setFunding] = useState<Agent | null>(null);
  const [launching, setLaunching] = useState(false);
  const [support, setSupport] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const ownedAgents = ownedAgentIds.map((id) => agents[id]).filter((a): a is Agent => Boolean(a));

  const goToProfile = (id: string) => {
    navigate(`/app/agents/${id}`);
    onClose();
  };

  const goToDashboard = () => {
    navigate("/app/dashboard");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div className="pointer-events-auto absolute right-0 top-full mt-2 z-[100] w-72 rounded-lg border border-border bg-hero-bg shadow-2xl overflow-hidden animate-fade-in">
        <MenuItem label="Dashboard" onClick={goToDashboard} />
        <div className="border-t border-border" />

        <div className="flex items-center justify-between px-4 py-2.5">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Solana wallet</div>
            <div className="text-sm text-foreground font-mono">
              {status === "connected" && address ? shortAddress(address) : "Not connected"}
            </div>
          </div>
          {status === "connected" && address ? (
            <button
              onClick={disconnect}
              className="rounded-md border border-border text-xs text-muted-foreground px-2.5 py-1 hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => setSelecting(true)}
              className="rounded-md bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 hover:brightness-110 transition-all"
            >
              Connect
            </button>
          )}
        </div>
        <div className="border-t border-border" />

        {ownedAgents.length > 0 && (
          <>
            <div className="px-4 py-2 text-[11px] uppercase tracking-widest text-muted-foreground">Your Agents</div>
            <div className="max-h-40 overflow-y-auto">
              {ownedAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setActiveAgent(agent.id)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-secondary/60 transition-colors"
                >
                  <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-7 w-7 text-[10px]" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-semibold text-foreground truncate">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{blurBalances ? "••••" : formatUsd(agent.cash)}</div>
                  </div>
                  {activeAgentId === agent.id && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>
            <div className="border-t border-border" />
          </>
        )}

        {activeAgentId && (
          <>
            <MenuItem label="View profile" onClick={() => goToProfile(activeAgentId)} />
            <MenuItem label="Manage agent" onClick={() => goToProfile(activeAgentId)} />
            <MenuItem
              label="Fund agent"
              onClick={() => {
                const agent = agents[activeAgentId];
                if (agent) setFunding(agent);
              }}
            />
          </>
        )}
        <MenuItem label="+ Add another agent" onClick={() => setLaunching(true)} />

        <div className="border-t border-border" />

        <ToggleItem label="Blur balances" hint="⌘B" checked={blurBalances} onChange={toggleBlurBalances} />
        <ToggleItem label="Dark theme" hint="Only theme" checked disabled />

        <div className="border-t border-border" />

        <MenuItem label="Support" onClick={() => setSupport(true)} />

        {status === "connected" && (
          <>
            <div className="border-t border-border" />
            <button
              onClick={() => {
                disconnect();
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              Disconnect wallet
            </button>
          </>
        )}
      </div>

      {funding && <FundAgentModal agent={funding} onClose={() => setFunding(null)} />}
      {launching && <LaunchAgentModal onClose={() => setLaunching(false)} />}
      {selecting && <WalletSelectModal onClose={() => setSelecting(false)} />}
      {support && (
        <div className="pointer-events-auto fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4" onClick={() => setSupport(false)}>
          <div className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground">Support</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Reach us on <a href="https://x.com/TryAgentBlock" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">X</a> for help with your account or an agent.
            </p>
            <button
              onClick={() => setSupport(false)}
              className="mt-4 w-full rounded-md bg-primary text-primary-foreground text-sm font-bold py-2 hover:brightness-110 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const MenuItem = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors">
    {label}
  </button>
);

const ToggleItem = ({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={cn(
      "w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors",
      disabled && "opacity-50 hover:bg-transparent cursor-default",
    )}
  >
    <span className="flex items-center gap-2">
      {label}
      {hint && <kbd className="rounded bg-secondary px-1 py-0.5 text-[10px] text-muted-foreground">{hint}</kbd>}
    </span>
    <span
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
        checked ? "bg-primary" : "bg-secondary",
      )}
    >
      <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
    </span>
  </button>
);

export default ProfileMenu;
