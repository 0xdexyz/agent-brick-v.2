import { useState } from "react";
import type { Token } from "@/lib/types";
import { formatUsd } from "@/lib/format";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import AgentAvatar from "@/components/AgentAvatar";
import { Button } from "@/components/ui/button";
import LaunchAgentModal from "@/components/LaunchAgentModal";
import ModalPortal from "@/components/ModalPortal";

type Stage = "form" | "processing" | "completed" | "failed";

/**
 * Manual buy placed through one of the owner's agents, paid from that agent's own trading
 * balance. It is recorded by the app's engine only — no wallet transaction is involved.
 */
const TransactionModal = ({ token, onClose }: { token: Token; onClose: () => void }) => {
  const { agents, placeTrade } = useSimulation();
  const { ownedAgentIds, activeAgentId } = useWallet();
  const [amount, setAmount] = useState("50");
  const [stage, setStage] = useState<Stage>("form");
  const [tradeRef, setTradeRef] = useState("");
  const [failure, setFailure] = useState("");
  const [launching, setLaunching] = useState(false);

  const agent = agents[activeAgentId ?? ""] ?? agents[ownedAgentIds[0] ?? ""];
  const valueUsd = Number(amount) || 0;
  const insufficient = Boolean(agent) && valueUsd > agent.cash;

  const handleConfirm = () => {
    if (!agent || valueUsd <= 0 || insufficient) return;
    setStage("processing");
    window.setTimeout(() => {
      const result = placeTrade(agent.id, token.id, "BUY", valueUsd);
      if (result.ok) {
        setTradeRef(result.ref);
        setStage("completed");
      } else {
        setFailure(
          result.reason === "insufficient-agent-balance"
            ? `${agent.name} doesn't have enough balance for this trade.`
            : "The trade couldn't be placed. Please try again.",
        );
        setStage("failed");
      }
    }, 1200);
  };

  return (
    <ModalPortal>
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {stage === "completed" ? (
          <>
            <h3 className="text-lg font-semibold text-foreground">Trade</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Status" value="Completed" positive />
              <Row label="Agent" value={agent?.name ?? "—"} />
              <Row label="Action" value="BUY" />
              <Row label="Token" value={token.symbol} />
              <Row label="Value" value={formatUsd(valueUsd)} />
              <Row label="Reference" value={tradeRef} mono />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Paid from {agent?.name ?? "the agent"}&apos;s trading balance. No on-chain transfer occurred.
            </p>
            <Button variant="hero" className="w-full mt-6 rounded-sm" onClick={onClose}>
              Done
            </Button>
          </>
        ) : stage === "failed" ? (
          <>
            <h3 className="text-lg font-semibold text-foreground">Trade</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Status" value="Failed" negative />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{failure}</p>
            <Button variant="hero" className="w-full mt-6 rounded-sm" onClick={() => setStage("form")}>
              Back
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-foreground">Buy {token.symbol}</h3>

            {!agent ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Trades are placed through your agents. Launch an agent to buy {token.symbol}.
                </p>
                <Button variant="hero" className="w-full mt-6 rounded-sm" onClick={() => setLaunching(true)}>
                  + Launch Agent
                </Button>
              </>
            ) : (
              <>
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

                <label className="block mt-5 text-xs uppercase tracking-widest text-muted-foreground">Amount (USD)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                />
                {insufficient && (
                  <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <div className="font-semibold">Insufficient agent balance</div>
                    <div className="mt-0.5">Required: {formatUsd(valueUsd)}</div>
                    <div>Available: {formatUsd(agent.cash)}</div>
                  </div>
                )}
                <Button
                  variant="hero"
                  className="w-full mt-4 rounded-sm"
                  onClick={handleConfirm}
                  disabled={stage === "processing" || valueUsd <= 0 || insufficient}
                >
                  {stage === "processing" ? "Processing..." : "Confirm Trade"}
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {launching && <LaunchAgentModal onClose={() => setLaunching(false)} />}
    </div>
    </ModalPortal>
  );
};

const Row = ({ label, value, positive, negative, mono }: { label: string; value: string; positive?: boolean; negative?: boolean; mono?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={
        mono
          ? "font-mono text-foreground"
          : positive
            ? "text-primary font-semibold"
            : negative
              ? "text-destructive font-semibold"
              : "text-foreground font-semibold"
      }
    >
      {value}
    </span>
  </div>
);

export default TransactionModal;
