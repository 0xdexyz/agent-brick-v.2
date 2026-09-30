import { useWallet } from "@/lib/wallet";
import { formatSol } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The connected wallet's actual on-chain SOL balance, with its loading and unavailable states and a manual refresh. */
const WalletBalance = ({ className }: { className?: string }) => {
  const { balance, balanceStatus, blurBalances, refreshBalance } = useWallet();

  const text =
    balance !== null
      ? blurBalances
        ? "••••"
        : formatSol(balance)
      : balanceStatus === "error"
        ? "Balance unavailable"
        : "Reading balance...";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("font-mono", balanceStatus === "error" ? "text-destructive" : "text-foreground")}>{text}</span>
      <button
        onClick={refreshBalance}
        disabled={balanceStatus === "loading"}
        aria-label="Refresh balance"
        title="Refresh balance"
        className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
      >
        ↻
      </button>
    </span>
  );
};

export default WalletBalance;
