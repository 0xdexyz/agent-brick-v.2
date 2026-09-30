import { useEffect, useState } from "react";
import { useWallet as useSolanaWalletAdapter } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import ModalPortal from "@/components/ModalPortal";
import { PHANTOM_INSTALL_URL, SOLANA_NETWORK_LABEL } from "@/lib/solanaConfig";

function describeConnectError(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  if (/reject|declin|cancel|closed/i.test(message)) return "Connection request was declined. Your wallet is not connected.";
  return "Couldn't connect to the wallet. Please try again.";
}

const WalletSelectModal = ({ onClose }: { onClose: () => void }) => {
  const { wallets, wallet, select, connect, connected, connecting } = useSolanaWalletAdapter();
  const [pending, setPending] = useState<WalletName | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (connected) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  useEffect(() => {
    if (!pending || !wallet || wallet.adapter.name !== pending || connected || connecting) return;
    connect()
      .catch((err) => setError(describeConnectError(err)))
      .finally(() => setPending(null));
  }, [pending, wallet, connected, connecting, connect]);

  const phantomDetected = wallets.some((w) => w.adapter.name === "Phantom");

  const handleSelect = (name: WalletName, installed: boolean, url: string) => {
    if (!installed) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setError("");
    setPending(name);
    select(name);
  };

  return (
    <ModalPortal>
      <div
        className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-foreground">Connect a wallet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your Solana wallet. AgentBrick only reads your address and SOL balance on {SOLANA_NETWORK_LABEL}.
          </p>
          <div className="mt-5 space-y-2">
            {!phantomDetected && (
              <a
                href={PHANTOM_INSTALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-left hover:border-primary/40 transition-colors"
              >
                <span className="h-8 w-8 rounded-lg shrink-0" style={{ backgroundColor: "#AB9FF2" }} />
                <span className="flex-1">
                  <span className="block font-semibold text-foreground">Phantom</span>
                  <span className="block text-xs text-muted-foreground">Not detected in this browser</span>
                </span>
                <span className="text-xs text-primary">Install ↗</span>
              </a>
            )}
            {wallets.map((w) => {
              const installed = w.readyState === "Installed";
              const isPending = pending === w.adapter.name && connecting;
              return (
                <button
                  key={w.adapter.name}
                  onClick={() => handleSelect(w.adapter.name, installed, w.adapter.url)}
                  disabled={connecting}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-left hover:border-primary/40 transition-colors disabled:opacity-50"
                >
                  <img src={w.adapter.icon} alt="" className="h-8 w-8 rounded-lg shrink-0" />
                  <span className="font-semibold text-foreground flex-1">{w.adapter.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {isPending ? "Connecting..." : installed ? "" : "Install"}
                  </span>
                </button>
              );
            })}
          </div>
          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </ModalPortal>
  );
};

export default WalletSelectModal;
