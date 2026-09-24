import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletAdapterProvider } from "@solana/wallet-adapter-react";

// Solana's default public mainnet RPC (clusterApiUrl) aggressively rate-limits and
// intermittently blocks browser traffic, which was surfacing as false "insufficient
// balance" reads. Prefer an RPC URL supplied via env (e.g. a Helius/QuickNode/Alchemy
// endpoint) for production, and fall back to a more browser-friendly public endpoint.
const ENDPOINT = import.meta.env.VITE_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";

/**
 * Wraps the app with the real Solana connection + wallet-adapter context.
 * No explicit wallet list is passed — modern wallets (Phantom, Solflare, Backpack)
 * register themselves via the Wallet Standard and are auto-detected.
 */
const SolanaAdapters = ({ children }: { children: ReactNode }) => {
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <SolanaWalletAdapterProvider wallets={wallets} autoConnect>
        {children}
      </SolanaWalletAdapterProvider>
    </ConnectionProvider>
  );
};

export default SolanaAdapters;
