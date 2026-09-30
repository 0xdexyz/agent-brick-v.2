import { useState } from "react";
import AgentAvatar from "@/components/AgentAvatar";
import ModalPortal from "@/components/ModalPortal";
import WalletBalance from "@/components/WalletBalance";
import WalletSelectModal from "@/components/WalletSelectModal";
import { Button } from "@/components/ui/button";
import { checkBalance } from "@/lib/balanceCheck";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import { formatSol, formatUsd } from "@/lib/format";
import { FUND_OPTIONS_SOL, solToUsd } from "@/lib/simConfig";
import type { Agent } from "@/lib/types";

type Stage = "form" | "processing" | "completed";

const FundAgentModal = ({ agent, onClose }: { agent: Agent; onClose: () => void }) => {
  const { fundAgent } = useSimulation();
  const { status, address, balance, balanceStatus, refreshBalance } = useWallet();

  const [amountSol, setAmountSol] = useState(FUND_OPTIONS_SOL[1]);
  const [stage, setStage] = useState<Stage>("form");
  const [selecting, setSelecting] = useState(false);
  const [fundedSol, setFundedSol] = useState(0);

  const connected = status === "connected";
  // The allocation is checked against the wallet's actual balance; nothing is deducted.
  const balanceCheck = checkBalance(amountSol, connected ? balance : null);

  const handleFund = () => {
    if (!connected || amountSol <= 0 || !balanceCheck.ok) return;
    setStage("processing");
    // Funding is an allocation inside the app's own engine: no transaction is built, signed, or sent.
    window.setTimeout(() => {
      fundAgent(agent.id, solToUsd(amountSol));
      setFundedSol(amountSol);
      setStage("completed");
    }, 900);
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
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Agent balance</div>
              <div className="text-sm font-semibold text-foreground">{formatUsd(agent.cash)}</div>
            </div>
          </div>

          {stage !== "completed" ? (
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Wallet</span>
                {connected && address && (
                  <span className="text-xs font-mono text-muted-foreground">{address.slice(0, 4)}...{address.slice(-4)}</span>
                )}
              </div>

              {!connected ? (
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Available balance</span>
                    <WalletBalance />
                  </div>
                  <div className="flex gap-2">
                    {FUND_OPTIONS_SOL.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAmountSol(a)}
                        className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                          amountSol === a ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        {a} SOL
                      </button>
                    ))}
                  </div>
                  <input
                    value={amountSol}
                    onChange={(e) => setAmountSol(Number(e.target.value.replace(/[^0-9.]/g, "")) || 0)}
                    aria-label="Amount in SOL"
                    className="w-full mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />

                  {!balanceCheck.ok && balanceCheck.reason === "insufficient" && (
                    <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <div className="font-semibold">Insufficient SOL balance</div>
                      <div className="mt-0.5">Required: {formatSol(balanceCheck.required)}</div>
                      <div>Available: {formatSol(balanceCheck.available ?? 0)}</div>
                    </div>
                  )}
                  {balanceStatus === "error" && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                      <span>Couldn&apos;t read your balance from the Solana network.</span>
                      <button onClick={refreshBalance} className="shrink-0 font-semibold hover:underline">
                        Retry
                      </button>
                    </div>
                  )}

                  <Button
                    variant="hero"
                    className="w-full mt-3 rounded-sm"
                    onClick={handleFund}
                    disabled={stage === "processing" || amountSol <= 0 || !balanceCheck.ok}
                  >
                    {stage === "processing" ? "Processing..." : `Fund ${formatSol(amountSol)}`}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your wallet balance is checked, not charged. No SOL leaves your wallet.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="mt-6 text-center">
              <div className="text-primary text-2xl font-bold">+{formatSol(fundedSol)}</div>
              <p className="mt-1 text-sm text-muted-foreground">{agent.name} is funded and ready to trade.</p>
              <p className="mt-1 text-xs text-muted-foreground">Your wallet balance is unchanged.</p>
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
