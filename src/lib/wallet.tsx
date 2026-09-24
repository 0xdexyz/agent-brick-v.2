import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockSolanaKey } from "./format";

type WalletStatus = "disconnected" | "connecting" | "connected";

interface WalletContextValue {
  status: WalletStatus;
  address: string | null;
  provider: string | null;
  balance: number;
  portfolioUsd: number;
  ownedAgentIds: string[];
  activeAgentId: string | null;
  blurBalances: boolean;
  connect: (provider?: string) => void;
  disconnect: () => void;
  fund: () => void;
  addOwnedAgent: (id: string) => void;
  setActiveAgent: (id: string) => void;
  toggleBlurBalances: () => void;
}

const SOL_PRICE_USD = 180;
const STORAGE_KEY = "sentinel-ai-wallet-v1";

const WalletContext = createContext<WalletContextValue | null>(null);

function loadOwnedAgents(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.ownedAgentIds) ? parsed.ownedAgentIds : [];
  } catch {
    return [];
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [ownedAgentIds, setOwnedAgentIds] = useState<string[]>(loadOwnedAgents);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [blurBalances, setBlurBalances] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ownedAgentIds }));
    } catch {
      // storage unavailable; ownership list simply won't persist
    }
  }, [ownedAgentIds]);

  const connect = useCallback((selectedProvider?: string) => {
    setStatus("connecting");
    setProvider(selectedProvider ?? "Phantom");
    window.setTimeout(() => {
      setAddress(mockSolanaKey(Date.now()));
      setStatus("connected");
    }, 900);
  }, []);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setAddress(null);
    setProvider(null);
    setBalance(0);
    setActiveAgentId(null);
  }, []);

  const fund = useCallback(() => {
    setBalance((prev) => prev + 5);
  }, []);

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

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      address,
      provider,
      balance,
      portfolioUsd: balance * SOL_PRICE_USD,
      ownedAgentIds,
      activeAgentId,
      blurBalances,
      connect,
      disconnect,
      fund,
      addOwnedAgent,
      setActiveAgent,
      toggleBlurBalances,
    }),
    [status, address, provider, balance, ownedAgentIds, activeAgentId, blurBalances, connect, disconnect, fund, addOwnedAgent, setActiveAgent, toggleBlurBalances],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
