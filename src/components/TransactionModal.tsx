import { useState } from "react";
import type { Token } from "@/lib/types";
import { formatUsd, mockSolanaKey, shortAddress } from "@/lib/format";
import { useWallet } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import ModalPortal from "@/components/ModalPortal";
import WalletSelectModal from "@/components/WalletSelectModal";

type Stage = "form" | "confirming" | "confirmed";

const TransactionModal = ({ token, onClose }: { token: Token; onClose: () => void }) => {
  const { status, address } = useWallet();
  const [amount, setAmount] = useState("50");
  const [stage, setStage] = useState<Stage>("form");
  const [signature, setSignature] = useState("");
  const [selecting, setSelecting] = useState(false);

  const handleConfirm = () => {
    setStage("confirming");
    window.setTimeout(() => {
      setSignature(mockSolanaKey(Date.now()));
      setStage("confirmed");
    }, 1400);
  };

  return (
    <ModalPortal>
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {stage !== "confirmed" ? (
          <>
            <h3 className="text-lg font-semibold text-foreground">Buy {token.symbol}</h3>
            <p className="text-sm text-muted-foreground mt-1">Simulated Solana transaction. No real funds move.</p>

            {status !== "connected" ? (
              <>
                <Button
                  variant="hero"
                  className="w-full mt-6 rounded-sm"
                  onClick={() => setSelecting(true)}
                  disabled={status === "connecting"}
                >
                  {status === "connecting" ? "Connecting..." : "Connect Wallet"}
                </Button>
                {selecting && <WalletSelectModal onClose={() => setSelecting(false)} />}
              </>
            ) : (
              <>
                <label className="block mt-6 text-xs uppercase tracking-widest text-muted-foreground">Amount (USD)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                />
                <Button
                  variant="hero"
                  className="w-full mt-4 rounded-sm"
                  onClick={handleConfirm}
                  disabled={stage === "confirming" || !amount}
                >
                  {stage === "confirming" ? "Confirming..." : "Confirm Trade"}
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-foreground">Transaction</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Status" value="Confirmed" positive />
              <Row label="Network" value="Solana" />
              <Row label="Action" value="BUY" />
              <Row label="Token" value={token.symbol} />
              <Row label="Value" value={formatUsd(Number(amount) || 0)} />
              <Row label="Wallet" value={address ? shortAddress(address) : "—"} mono />
              <Row label="Signature" value={shortAddress(signature)} mono />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              This is a simulated transaction for demo purposes. No on-chain transfer occurred.
            </p>
            <Button variant="hero" className="w-full mt-6 rounded-sm" onClick={onClose}>
              Done
            </Button>
          </>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};

const Row = ({ label, value, positive, mono }: { label: string; value: string; positive?: boolean; mono?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={mono ? "font-mono text-foreground" : positive ? "text-primary font-semibold" : "text-foreground font-semibold"}>
      {value}
    </span>
  </div>
);

export default TransactionModal;
