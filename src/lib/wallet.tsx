import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useConnection, useWallet as useSolanaWalletAdapter } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

type WalletStatus = "disconnected" | "connecting" | "connected";

type BalanceStatus = "idle" | "loading" | "ready" | "error";

interface WalletContextValue {
  status: WalletStatus;
  /** Public address of the connected wallet account. */
  address: string | null;
  provider: string | null;
  /** The connected account's on-chain SOL balance; null until read, or when the network read failed. */
  balance: number | null;
  balanceStatus: BalanceStatus;
  ownedAgentIds: string[];
  activeAgentId: string | null;
  blurBalances: boolean;
  disconnect: () => void;
  refreshBalance: () => void;
  addOwnedAgent: (id: string) => void;
  setActiveAgent: (id: string) => void;
  toggleBlurBalances: () => void;
}

const STORAGE_KEY = "agentbrick-account-v1";

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

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>("idle");
  const [refreshTick, setRefreshTick] = useState(0);
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
      setBalance(null);
      setBalanceStatus("idle");
      return;
    }
    let cancelled = false;
    // A different account or a manual refresh starts from "unknown" rather than showing the previous figure.
    setBalance(null);
    setBalanceStatus("loading");
    const fetchBalance = () => {
      connection
        .getBalance(publicKey)
        .then((lamports) => {
          if (cancelled) return;
          setBalance(lamports / LAMPORTS_PER_SOL);
          setBalanceStatus("ready");
        })
        .catch(() => {
          // RPC failure: report the balance as unavailable rather than keeping a stale
          // figure, so balance checks never pass or fail on a number that wasn't just read.
          if (cancelled) return;
          setBalance(null);
          setBalanceStatus("error");
        });
    };
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") fetchBalance();
    };
    fetchBalance();
    const interval = window.setInterval(refreshIfVisible, 15000);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [publicKey, connection, refreshTick]);

  const refreshBalance = useCallback(() => setRefreshTick((n) => n + 1), []);

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
      balanceStatus,
      ownedAgentIds,
      activeAgentId,
      blurBalances,
      disconnect,
      refreshBalance,
      addOwnedAgent,
      setActiveAgent,
      toggleBlurBalances,
    }),
    [
      status,
      address,
      provider,
      balance,
      balanceStatus,
      ownedAgentIds,
      activeAgentId,
      blurBalances,
      disconnect,
      refreshBalance,
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
