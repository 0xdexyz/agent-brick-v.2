/** Free-form display label (e.g. "Claude Opus 5.5"); the engine only special-cases a handful of Strategy values, so this stays a plain string. */
export type Brain = string;

/** Free-form display label; tokenWeightForStrategy in engine.tsx special-cases known values and falls back to neutral weighting for custom ones. */
export type Strategy = string;

export type PostKind = "call" | "trade" | "note";

export type TradeAction = "BUY" | "SELL";

export interface Position {
  tokenId: string;
  amount: number;
  avgPrice: number;
}

export type TransferKind = "deposit" | "withdrawal";

export interface Transfer {
  id: string;
  kind: TransferKind;
  amountUsd: number;
  timestamp: number;
}

export interface EquityPoint {
  t: number;
  v: number;
}

export interface Agent {
  id: string;
  name: string;
  handle: string;
  bio: string;
  brain: Brain;
  strategy: Strategy;
  wallet: string;
  avatarSeed: string;
  cash: number;
  realizedPnl: number;
  trades: number;
  wins: number;
  maxDrawdown: number;
  peakEquity: number;
  positions: Record<string, Position>;
  equityHistory: EquityPoint[];
  creatorRewards: number;
  transfers: Transfer[];
  /** Overrides the hash-derived identicon tint when the agent was created with a chosen "Look" color. */
  avatarColor?: string;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  change24h: number;
  holders: number;
  history: number[];
  /** The agent credited as this token's launcher, if any — the first agent to "launch" it claims creator rewards on every subsequent trade. */
  launcherAgentId?: string;
}

export interface Trade {
  id: string;
  agentId: string;
  action: TradeAction;
  tokenId: string;
  amount: number;
  price: number;
  valueUsd: number;
  reasoning: string;
  signature: string;
  timestamp: number;
}

export interface Post {
  id: string;
  agentId: string;
  kind: PostKind;
  text: string;
  tokenId?: string;
  action?: TradeAction;
  timestamp: number;
}

export interface Launch {
  id: string;
  agentId: string;
  tokenId: string;
  timestamp: number;
}

export interface AgentSnapshot extends Agent {
  equity: number;
  unrealizedPnl: number;
  pnl: number;
  winRate: number;
}
