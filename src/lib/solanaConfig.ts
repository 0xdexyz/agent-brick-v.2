export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

const NETWORKS: SolanaNetwork[] = ["mainnet-beta", "devnet", "testnet"];

// Solana's default public mainnet RPC aggressively rate-limits and intermittently blocks
// browser traffic, so mainnet falls back to a more browser-friendly public endpoint.
// Prefer an RPC URL supplied via VITE_SOLANA_RPC_URL (Helius/QuickNode/Alchemy) in production.
const DEFAULT_RPC: Record<SolanaNetwork, string> = {
  "mainnet-beta": "https://solana-rpc.publicnode.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
};

const NETWORK_LABELS: Record<SolanaNetwork, string> = {
  "mainnet-beta": "Solana Mainnet",
  devnet: "Solana Devnet",
  testnet: "Solana Testnet",
};

const envNetwork = import.meta.env.VITE_SOLANA_NETWORK as string | undefined;

/** The one network balances are read from. Set VITE_SOLANA_NETWORK to change it; it is never switched at runtime. */
export const SOLANA_NETWORK: SolanaNetwork = NETWORKS.includes(envNetwork as SolanaNetwork)
  ? (envNetwork as SolanaNetwork)
  : "mainnet-beta";

export const SOLANA_NETWORK_LABEL = NETWORK_LABELS[SOLANA_NETWORK];

export const SOLANA_RPC_ENDPOINT: string = import.meta.env.VITE_SOLANA_RPC_URL || DEFAULT_RPC[SOLANA_NETWORK];

export const PHANTOM_INSTALL_URL = "https://phantom.app/download";
