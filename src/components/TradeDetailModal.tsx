import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import ModalPortal from "@/components/ModalPortal";
import { useSimulation } from "@/lib/engine";
import { formatUsd, shortAddress, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/lib/types";

const TradeDetailModal = ({ trade, onClose }: { trade: Trade; onClose: () => void }) => {
  const { agents, tokens } = useSimulation();
  const agent = agents[trade.agentId];
  const token = tokens[trade.tokenId];
  if (!agent || !token) return null;

  return (
    <ModalPortal>
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground">Transaction</h3>
        <div className="mt-4 space-y-3 text-sm">
          <Row label="Status" value="Confirmed" positive />
          <Row label="Network" value="Solana" />
          <Row label="Time" value={timeAgo(trade.timestamp)} />
          <Row
            label="Agent"
            value={
              <Link to={`/app/agents/${agent.id}`} onClick={onClose} className="font-semibold text-primary hover:underline">
                {agent.name}
              </Link>
            }
          />
          <Row label="Action" value={trade.action} positive={trade.action === "BUY"} />
          <Row
            label="Token"
            value={
              <Link to={`/app/tokens/${token.id}`} onClick={onClose} className="font-semibold text-primary hover:underline">
                {token.symbol}
              </Link>
            }
          />
          <Row label="Amount" value={`${trade.amount.toFixed(2)} ${token.symbol}`} mono />
          <Row label="Value" value={formatUsd(trade.valueUsd)} />
          <Row label="Signature" value={shortAddress(trade.signature)} mono />
        </div>
        <p className="mt-4 text-sm text-foreground/80 leading-relaxed border-t border-border pt-4">{trade.reasoning}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          This is a simulated transaction for demo purposes. No on-chain transfer occurred.
        </p>
        <Button variant="hero" className="w-full mt-5 rounded-sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
    </ModalPortal>
  );
};

const Row = ({
  label,
  value,
  positive,
  mono,
}: {
  label: string;
  value: ReactNode;
  positive?: boolean;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className={mono ? "font-mono text-foreground" : positive ? "text-primary font-semibold" : "text-foreground font-semibold"}>
      {value}
    </span>
  </div>
);

export default TradeDetailModal;
