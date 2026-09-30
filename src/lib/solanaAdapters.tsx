import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletAdapterProvider } from "@solana/wallet-adapter-react";
import { SOLANA_RPC_ENDPOINT } from "./solanaConfig";

/**
 * Wraps the app with the real Solana connection + wallet-adapter context.
 * The connection is used only to read the connected account's balance; the app never
 * builds, signs, or submits a transaction.
 * No explicit wallet list is passed — modern wallets (Phantom, Solflare, Backpack)
 * register themselves via the Wallet Standard and are auto-detected.
 */
const SolanaAdapters = ({ children }: { children: ReactNode }) => {
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <SolanaWalletAdapterProvider wallets={wallets} autoConnect>
        {children}
      </SolanaWalletAdapterProvider>
    </ConnectionProvider>
  );
};

export default SolanaAdapters;
