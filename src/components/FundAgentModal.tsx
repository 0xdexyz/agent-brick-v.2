import { useState } from "react";
import AgentAvatar from "@/components/AgentAvatar";
import ModalPortal from "@/components/ModalPortal";
import WalletSelectModal from "@/components/WalletSelectModal";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import { formatUsd } from "@/lib/format";
import type { Agent } from "@/lib/types";

const USD_AMOUNTS = [250, 1000, 2500];

type Stage = "form" | "confirming" | "confirmed";

const FundAgentModal = ({ agent, onClose }: { agent: Agent; onClose: () => void }) => {
  const { fundAgent } = useSimulation();
  const { status, address } = useWallet();

  const [amountUsd, setAmountUsd] = useState(1000);
  const [stage, setStage] = useState<Stage>("form");
  const [selecting, setSelecting] = useState(false);
  const [fundedAmount, setFundedAmount] = useState(0);

  const handleFund = () => {
    if (status !== "connected" || amountUsd <= 0) return;
    setStage("confirming");
    window.setTimeout(() => {
      fundAgent(agent.id, amountUsd);
      setFundedAmount(amountUsd);
      setStage("confirmed");
    }, 700);
  };

  return (
    <ModalPortal>
      <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in" onClick={onClose}>
        <div
          className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Fund {agent.name}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] backdrop-blur-xl backdrop-saturate-150 p-3">
            <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">{agent.name}</div>
              <div className="text-xs text-muted-foreground">{agent.handle}</div>
            </div>
            <div className="text-sm font-semibold text-foreground">{formatUsd(agent.cash)}</div>
          </div>

          {stage !== "confirmed" ? (
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Wallet</span>
                {status === "connected" && address && (
                  <span className="text-xs font-mono text-muted-foreground">{address.slice(0, 4)}...{address.slice(-4)}</span>
                )}
              </div>

              {status !== "connected" ? (
                <Button
                  variant="hero"
                  className="w-full rounded-sm"
                  onClick={() => setSelecting(true)}
                  disabled={status === "connecting"}
                >
                  {status === "connecting" ? "Connecting..." : "Connect Wallet"}
                </Button>
              ) : (
                <>
                  <div className="flex gap-2">
                    {USD_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAmountUsd(a)}
                        className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                          amountUsd === a ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        {formatUsd(a, { compact: true })}
                      </button>
                    ))}
                  </div>
                  <input
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(Number(e.target.value.replace(/[^0-9.]/g, "")) || 0)}
                    className="w-full mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                  <Button
                    variant="hero"
                    className="w-full mt-3 rounded-sm"
                    onClick={handleFund}
                    disabled={stage === "confirming" || amountUsd <= 0}
                  >
                    {stage === "confirming" ? "Funding..." : `Fund ${formatUsd(amountUsd)}`}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-6 text-center">
              <div className="text-primary text-2xl font-bold">+{formatUsd(fundedAmount)}</div>
              <p className="mt-1 text-sm text-muted-foreground">{agent.name} is funded and ready to trade.</p>
              <Button variant="hero" className="w-full mt-5 rounded-sm" onClick={onClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </div>

      {selecting && <WalletSelectModal onClose={() => setSelecting(false)} />}
    </ModalPortal>
  );
};

export default FundAgentModal;
