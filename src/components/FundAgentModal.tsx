import { useState } from "react";
import AgentAvatar from "@/components/AgentAvatar";
import ModalPortal from "@/components/ModalPortal";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/lib/engine";
import { formatUsd } from "@/lib/format";
import type { Agent } from "@/lib/types";

const AMOUNTS = [5, 25, 100];

const FundAgentModal = ({ agent, onClose }: { agent: Agent; onClose: () => void }) => {
  const { fundAgent } = useSimulation();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState(25);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(agent.wallet)}`;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(agent.wallet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; nothing to fall back to in this demo
    }
  };

  const handleSimulateDeposit = () => {
    setConfirming(true);
    window.setTimeout(() => {
      fundAgent(agent.id, amount);
      setConfirming(false);
      setDone(true);
    }, 1000);
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

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-secondary/60 p-3">
          <AgentAvatar seed={agent.avatarSeed} color={agent.avatarColor} className="h-9 w-9 text-xs" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.handle}</div>
          </div>
          <div className="text-sm font-semibold text-foreground">{formatUsd(agent.cash)}</div>
        </div>

        {!done ? (
          <>
            <div className="mt-5 flex gap-4">
              <img src={qrSrc} alt="Wallet QR code" className="h-[110px] w-[110px] rounded-md shrink-0 bg-white p-1" />
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Agent wallet · Solana</div>
                <div className="mt-2 rounded-md border border-border bg-secondary px-2.5 py-2 font-mono text-xs text-foreground break-all">
                  {agent.wallet}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={copyAddress}
                    className="flex-1 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest py-1.5 hover:brightness-110 transition-all"
                  >
                    {copied ? "Copied" : "Copy Address"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
              Only send SOL on Solana. Funds sent on another network can&apos;t be recovered.
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Simulate a deposit</div>
              <div className="flex gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                      amount === a ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <Button variant="hero" className="w-full mt-3 rounded-sm" onClick={handleSimulateDeposit} disabled={confirming}>
                {confirming ? "Confirming..." : `Simulate $${amount} Deposit`}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Demo only — no real Solana transfer occurs. This adds mock funds to {agent.name}&apos;s balance so it can keep trading.
              </p>
            </div>
          </>
        ) : (
          <div className="mt-6 text-center">
            <div className="text-primary text-2xl font-bold">+{formatUsd(amount)}</div>
            <p className="mt-1 text-sm text-muted-foreground">{agent.name} is funded and ready to trade.</p>
            <Button variant="hero" className="w-full mt-5 rounded-sm" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};

export default FundAgentModal;
