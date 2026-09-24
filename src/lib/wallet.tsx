import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useConnection, useWallet as useSolanaWalletAdapter } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

type WalletStatus = "disconnected" | "connecting" | "connected";

interface WalletContextValue {
  status: WalletStatus;
  address: string | null;
  provider: string | null;
  balance: number;
  balanceKnown: boolean;
  balanceError: string | null;
  ownedAgentIds: string[];
  activeAgentId: string | null;
  blurBalances: boolean;
  disconnect: () => void;
  addOwnedAgent: (id: string) => void;
  setActiveAgent: (id: string) => void;
  toggleBlurBalances: () => void;
}

const STORAGE_KEY = "sentinel-ai-account-v1";

const WalletContext = createContext<WalletContextValue | null>(null);

function loadAccountState(): { ownedAgentIds: string[]; activeAgentId: string | null } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ownedAgentIds: [], activeAgentId: null };
    const parsed = JSON.parse(raw);
    const ownedAgentIds = Array.isArray(parsed.ownedAgentIds) ? parsed.ownedAgentIds : [];
    const activeAgentId = typeof parsed.activeAgentId === "string" ? parsed.activeAgentId : null;
    return { ownedAgentIds, activeAgentId: activeAgentId && ownedAgentIds.includes(activeAgentId) ? activeAgentId : ownedAgentIds[0] ?? null };
  } catch {
    return { ownedAgentIds: [], activeAgentId: null };
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, connecting, disconnect: adapterDisconnect, wallet } = useSolanaWalletAdapter();
  const { connection } = useConnection();

  const [balance, setBalance] = useState(0);
  const [balanceKnown, setBalanceKnown] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const initialAccount = useState(loadAccountState)[0];
  const [ownedAgentIds, setOwnedAgentIds] = useState<string[]>(initialAccount.ownedAgentIds);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(initialAccount.activeAgentId);
  const [blurBalances, setBlurBalances] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ownedAgentIds, activeAgentId }));
    } catch {
      // storage unavailable; ownership list simply won't persist
    }
  }, [ownedAgentIds, activeAgentId]);

  useEffect(() => {
    if (!publicKey) {
      setBalance(0);
      setBalanceKnown(false);
      setBalanceError(null);
      return;
    }
    let cancelled = false;
    const fetchBalance = () => {
      connection
        .getBalance(publicKey)
        .then((lamports) => {
          if (cancelled) return;
          setBalance(lamports / LAMPORTS_PER_SOL);
          setBalanceKnown(true);
          setBalanceError(null);
        })
        .catch((err) => {
          // RPC hiccup (public mainnet RPC rate-limits browser calls) — keep the last
          // known balance rather than clearing it, but flag it as unverified so the UI
          // doesn't block a send on a stale/failed read.
          if (cancelled) return;
          setBalanceKnown(false);
          setBalanceError(err instanceof Error ? err.message : "Could not reach the Solana network.");
        });
    };
    fetchBalance();
    const interval = window.setInterval(fetchBalance, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [publicKey, connection]);

  const disconnect = useCallback(() => {
    adapterDisconnect().catch(() => {});
    setActiveAgentId(null);
  }, [adapterDisconnect]);

  const addOwnedAgent = useCallback((id: string) => {
    setOwnedAgentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveAgentId(id);
  }, []);

  const setActiveAgent = useCallback((id: string) => {
    setActiveAgentId(id);
  }, []);

  const toggleBlurBalances = useCallback(() => {
    setBlurBalances((prev) => !prev);
  }, []);

  const status: WalletStatus = connected ? "connected" : connecting ? "connecting" : "disconnected";
  const address = publicKey ? publicKey.toBase58() : null;
  const provider = wallet?.adapter.name ?? null;

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      address,
      provider,
      balance,
      balanceKnown,
      balanceError,
      ownedAgentIds,
      activeAgentId,
      blurBalances,
      disconnect,
      addOwnedAgent,
      setActiveAgent,
      toggleBlurBalances,
    }),
    [
      status,
      address,
      provider,
      balance,
      balanceKnown,
      balanceError,
      ownedAgentIds,
      activeAgentId,
      blurBalances,
      disconnect,
      addOwnedAgent,
      setActiveAgent,
      toggleBlurBalances,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
