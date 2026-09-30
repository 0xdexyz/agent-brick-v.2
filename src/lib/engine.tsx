import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Agent, AgentSnapshot, Launch, Post, Strategy, Token, Trade, TradeAction, Transfer } from "./types";
import { reasoningBank, seedAgents, seedTokens } from "./mockData";
import { simRef } from "./format";
import { solToUsd } from "./simConfig";

interface EngineState {
  agents: Record<string, Agent>;
  tokens: Record<string, Token>;
  trades: Trade[];
  posts: Post[];
  launches: Launch[];
  tradesCount: number;
  postsCount: number;
  launchesCount: number;
}

interface SimulationContextValue extends EngineState {
  leaderboard: AgentSnapshot[];
  snapshot: (agentId: string) => AgentSnapshot | undefined;
  createAgent: (input: NewAgentInput) => string;
  fundAgent: (agentId: string, amountUsd: number) => void;
  claimRewards: (agentId: string) => void;
  placeTrade: (agentId: string, tokenId: string, action: TradeAction, valueUsd: number) => PlaceTradeResult;
  resetSimulation: () => void;
}

export interface NewAgentInput {
  name: string;
  handle: string;
  bio: string;
  brain: Agent["brain"];
  strategy: Agent["strategy"];
  avatarColor?: string;
  startingCapitalSol: number;
  launchCostSol: number;
}

export type PlaceTradeResult =
  | { ok: true; ref: string }
  | { ok: false; reason: "insufficient-agent-balance" | "no-position" | "unavailable" };

const SimulationContext = createContext<SimulationContextValue | null>(null);

const STORAGE_KEY = "agentbrick-state-v1";

let idCounter = 1;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now().toString(36)}`;
}

const CREATOR_FEE_PCT = 0.01;

function randomOf<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function weightedPick<T>(items: T[], weightOf: (item: T) => number): T {
  const weights = items.map((item) => Math.max(weightOf(item), 0.001));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Each strategy prefers tokens with different characteristics, so agent behavior isn't uniformly random. */
function tokenWeightForStrategy(strategy: Strategy, token: Token): number {
  switch (strategy) {
    case "Momentum":
    case "Breakout":
      return Math.max(token.change24h, 0.5) ** 1.4;
    case "Mean Reversion":
      return Math.max(-token.change24h, 0.5) ** 1.4;
    case "Conviction":
      return token.liquidity / Math.max(token.volume24h, 1) + 0.2;
    case "Scalping":
      return token.volume24h / 1000;
    default:
      return 1;
  }
}

/**
 * The 14 seed tokens each get a launcher assigned exactly once (see the launch branch in
 * tick()), so once the network has run for a while every one of those slots is already
 * claimed and a newly created agent can never win one — it would never earn creator
 * rewards no matter how long it ran. Minting a fresh token at creation time, with this
 * agent as its launcher from the start, guarantees every agent the user actually creates
 * has a live, tradeable token that can generate rewards as other agents trade it.
 */
function createLaunchToken(agent: Agent): Token {
  const magnitude = 10 ** (-6 + Math.random() * 6);
  const price = magnitude * (0.4 + Math.random() * 1.2);
  const marketCap = price * (400_000 + Math.random() * 5_000_000);
  const liquidity = marketCap * (0.05 + Math.random() * 0.15);
  const volume24h = marketCap * (0.05 + Math.random() * 0.4);
  const holders = Math.round(15 + Math.random() * 260);
  return {
    id: `${agent.id}-token`,
    symbol: (agent.handle.replace("@", "") || agent.id).toUpperCase().slice(0, 10),
    name: `${agent.name} Token`,
    price,
    marketCap,
    liquidity,
    volume24h,
    change24h: 0,
    holders,
    history: [price],
    launcherAgentId: agent.id,
  };
}

function computeSnapshot(agent: Agent, tokens: Record<string, Token>): AgentSnapshot {
  let positionsValue = 0;
  let unrealizedPnl = 0;
  Object.values(agent.positions).forEach((position) => {
    const token = tokens[position.tokenId];
    if (!token || position.amount <= 0) return;
    positionsValue += position.amount * token.price;
    unrealizedPnl += position.amount * (token.price - position.avgPrice);
  });
  const equity = agent.cash + positionsValue;
  const pnl = agent.realizedPnl + unrealizedPnl;
  const winRate = agent.trades > 0 ? (agent.wins / agent.trades) * 100 : 0;
  return { ...agent, equity, unrealizedPnl, pnl, winRate };
}

function applyTrade(agent: Agent, token: Token, action: TradeAction, amount: number): Agent {
  const value = amount * token.price;
  const positions = { ...agent.positions };
  const existing = positions[token.id];

  if (action === "BUY") {
    const nextAmount = (existing?.amount ?? 0) + amount;
    const nextAvg = existing
      ? (existing.avgPrice * existing.amount + value) / nextAmount
      : token.price;
    positions[token.id] = { tokenId: token.id, amount: nextAmount, avgPrice: nextAvg };
    return {
      ...agent,
      cash: agent.cash - value,
      positions,
      trades: agent.trades + 1,
    };
  }

  const held = existing?.amount ?? 0;
  const sellAmount = Math.min(held, amount);
  const realized = existing ? sellAmount * (token.price - existing.avgPrice) : 0;
  const remaining = held - sellAmount;
  if (remaining > 0.0001 && existing) {
    positions[token.id] = { ...existing, amount: remaining };
  } else {
    delete positions[token.id];
  }
  return {
    ...agent,
    cash: agent.cash + sellAmount * token.price,
    positions,
    realizedPnl: agent.realizedPnl + realized,
    trades: agent.trades + 1,
    wins: agent.wins + (realized > 0 ? 1 : 0),
  };
}

/** Applies one trade to the books: the agent's position, the trade record, its feed post, and the token creator's reward. */
function recordTrade(
  state: EngineState,
  agentId: string,
  tokenId: string,
  action: TradeAction,
  amount: number,
  reasoning: string,
  ref: string,
): EngineState {
  const token = state.tokens[tokenId];
  const valueUsd = amount * token.price;
  const trade: Trade = {
    id: nextId("trade"),
    agentId,
    action,
    tokenId,
    amount,
    price: token.price,
    valueUsd,
    reasoning,
    ref,
    timestamp: Date.now(),
  };
  const post: Post = {
    id: nextId("post"),
    agentId,
    kind: "trade",
    text: reasoning,
    tokenId,
    action,
    timestamp: Date.now(),
  };

  let agents = { ...state.agents, [agentId]: applyTrade(state.agents[agentId], token, action, amount) };

  const creatorId = token.launcherAgentId;
  if (creatorId && agents[creatorId] && creatorId !== agentId) {
    // Rewards accrue as a claimable balance rather than landing straight in cash — the
    // owner has to actually claim them (see claimRewards) before they count toward
    // the agent's spendable portfolio.
    const reward = valueUsd * CREATOR_FEE_PCT;
    const creator = agents[creatorId];
    agents = {
      ...agents,
      [creatorId]: {
        ...creator,
        creatorRewards: creator.creatorRewards + reward,
      },
    };
  }

  return {
    ...state,
    agents,
    trades: [trade, ...state.trades].slice(0, 200),
    posts: [post, ...state.posts].slice(0, 200),
    tradesCount: state.tradesCount + 1,
    postsCount: state.postsCount + 1,
  };
}

function newTradeRef() {
  return simRef("TRD", Math.random() * 233280);
}

/** Funded agents that haven't traded yet are picked more often, so a newly launched agent gets going quickly. */
function pickActiveAgent(agents: Record<string, Agent>): Agent {
  return weightedPick(Object.values(agents), (agent) => (agent.trades < 3 && agent.cash >= 5 ? 5 : 1));
}

function holdNote(agent: Agent, tokens: Record<string, Token>): Post | null {
  const positions = Object.values(agent.positions).filter((p) => p.amount > 0 && tokens[p.tokenId]);
  if (positions.length === 0) return null;
  const position = randomOf(positions);
  const token = tokens[position.tokenId];
  const changePct = ((token.price - position.avgPrice) / position.avgPrice) * 100;
  return {
    id: nextId("post"),
    agentId: agent.id,
    kind: "note",
    text: `Holding ${token.symbol}. Position is ${changePct >= 0 ? "up" : "down"} ${Math.abs(changePct).toFixed(1)}% from entry — thesis intact, no change.`,
    tokenId: token.id,
    timestamp: Date.now(),
  };
}

function tick(state: EngineState): EngineState {
  const agentIds = Object.keys(state.agents);
  const tokenIds = Object.keys(state.tokens);

  let tokens: Record<string, Token> = { ...state.tokens };
  tokenIds.forEach((id) => {
    const token = tokens[id];
    const drift = (Math.random() - 0.48) * 0.06;
    const price = Math.max(token.price * (1 + drift), token.price * 0.5, 0.0000001);
    const history = [...token.history.slice(-59), price];
    const change24h = ((price - history[0]) / history[0]) * 100;
    tokens[id] = {
      ...token,
      price,
      history,
      change24h,
      volume24h: Math.max(token.volume24h * (1 + (Math.random() - 0.5) * 0.08), 1000),
      marketCap: price * (token.marketCap / token.price),
    };
  });

  const eventRoll = Math.random();
  let agents = state.agents;
  let trades = state.trades;
  let posts = state.posts;
  let launches = state.launches;
  let tradesCount = state.tradesCount;
  let postsCount = state.postsCount;
  let launchesCount = state.launchesCount;

  if (eventRoll < 0.78) {
    const agent = pickActiveAgent(agents);
    const agentId = agent.id;
    const tokenList = tokenIds.map((tid) => tokens[tid]);
    const token = weightedPick(tokenList, (t) => tokenWeightForStrategy(agent.strategy, t));
    const heldAmount = agent.positions[token.id]?.amount ?? 0;
    const canSell = heldAmount > 0;
    const action: TradeAction = canSell && Math.random() < 0.45 ? "SELL" : "BUY";

    if (action === "BUY" && agent.cash < 5) {
      return { ...state, tokens };
    }

    const maxSpend = Math.min(agent.cash * 0.25, agent.cash);
    const amount =
      action === "BUY"
        ? Math.max(maxSpend / token.price, 1)
        : Math.max(heldAmount * (0.3 + Math.random() * 0.5), 0);

    if (action === "SELL" && amount <= 0) {
      return { ...state, tokens };
    }

    const traded = recordTrade(
      { ...state, tokens },
      agentId,
      token.id,
      action,
      amount,
      randomOf(reasoningBank[action]),
      newTradeRef(),
    );
    agents = traded.agents;
    trades = traded.trades;
    posts = traded.posts;
    tradesCount = traded.tradesCount;
    postsCount = traded.postsCount;
  } else if (eventRoll < 0.94) {
    const agentId = randomOf(agentIds);
    const tokenId = randomOf(tokenIds);
    const hold = Math.random() < 0.35 ? holdNote(agents[agentId], tokens) : null;
    const kind = Math.random() < 0.5 ? "call" : "note";
    const bank = kind === "call" ? reasoningBank.CALL : reasoningBank.NOTE;
    const post: Post = hold ?? {
      id: nextId("post"),
      agentId,
      kind,
      text: randomOf(bank),
      tokenId: kind === "call" ? tokenId : undefined,
      timestamp: Date.now(),
    };
    posts = [post, ...posts].slice(0, 200);
    postsCount += 1;
  } else {
    const agentId = randomOf(agentIds);
    const tokenId = randomOf(tokenIds);
    const launch: Launch = { id: nextId("launch"), agentId, tokenId, timestamp: Date.now() };
    launches = [launch, ...launches].slice(0, 50);
    launchesCount += 1;
    if (!tokens[tokenId].launcherAgentId) {
      tokens = { ...tokens, [tokenId]: { ...tokens[tokenId], launcherAgentId: agentId } };
    }
  }

  agents = updateEquityAndDrawdowns(agents, tokens);

  return { agents, tokens, trades, posts, launches, tradesCount, postsCount, launchesCount };
}

function updateEquityAndDrawdowns(agents: Record<string, Agent>, tokens: Record<string, Token>): Record<string, Agent> {
  const next: Record<string, Agent> = { ...agents };
  const now = Date.now();
  Object.values(agents).forEach((agent) => {
    const snapshot = computeSnapshot(agent, tokens);
    const peakEquity = Math.max(agent.peakEquity, snapshot.equity);
    const drawdownPct = peakEquity > 0 ? ((peakEquity - snapshot.equity) / peakEquity) * 100 : 0;
    const maxDrawdown = Math.max(agent.maxDrawdown, drawdownPct);
    const equityHistory = [...agent.equityHistory.slice(-500), { t: now, v: snapshot.equity }];
    next[agent.id] = { ...agent, peakEquity, maxDrawdown, equityHistory };
  });
  return next;
}

function buildInitialState(): EngineState {
  const agents: Record<string, Agent> = {};
  seedAgents.forEach((agent) => {
    agents[agent.id] = agent;
  });
  const tokens: Record<string, Token> = {};
  seedTokens.forEach((token) => {
    tokens[token.id] = token;
  });
  return {
    agents,
    tokens,
    trades: [],
    posts: [],
    launches: [],
    // Lifetime counters shown in the stats bar are seeded with an already-natural-looking
    // base (not 0, not a round number) so a fresh session doesn't read as brand new, and
    // they keep climbing forever instead of visibly plateauing once the display feeds
    // (capped above for performance) hit their cap.
    tradesCount: 2000 + Math.floor(Math.random() * 1400),
    postsCount: 2600 + Math.floor(Math.random() * 1500),
    launchesCount: 210 + Math.floor(Math.random() * 180),
  };
}

/** Backfills fields added to the Agent/Token schema after some records were already persisted,
 * so an older localStorage snapshot never crashes a component expecting the current shape. */
function normalizeAgent(agent: Partial<Agent> & Pick<Agent, "id" | "avatarSeed" | "agentRef">): Agent {
  return {
    positions: {},
    cash: 0,
    realizedPnl: 0,
    trades: 0,
    wins: 0,
    maxDrawdown: 0,
    peakEquity: agent.cash ?? 0,
    equityHistory: [],
    creatorRewards: 0,
    transfers: [],
    name: agent.id,
    handle: `@${agent.id}`,
    bio: "",
    brain: "",
    strategy: "",
    ...agent,
  };
}

function loadInitialState(): EngineState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as Partial<EngineState>;
    if (!parsed.agents || !parsed.tokens) return buildInitialState();
    const agents: Record<string, Agent> = {};
    Object.values(parsed.agents).forEach((agent) => {
      agents[agent.id] = normalizeAgent(agent);
    });
    const tokens: Record<string, Token> = {};
    Object.values(parsed.tokens).forEach((token) => {
      tokens[token.id] = { ...token, history: token.history ?? [] };
    });
    const trades = parsed.trades ?? [];
    const posts = parsed.posts ?? [];
    const launches = parsed.launches ?? [];
    return {
      agents,
      tokens,
      trades,
      posts,
      launches,
      // Migrate older persisted state that predates these lifetime counters by basing
      // them on what's already been seen, plus a natural-looking head start.
      tradesCount: parsed.tradesCount ?? trades.length + 1800 + Math.floor(Math.random() * 900),
      postsCount: parsed.postsCount ?? posts.length + 2200 + Math.floor(Math.random() * 1100),
      launchesCount: parsed.launchesCount ?? launches.length + 180 + Math.floor(Math.random() * 140),
    };
  } catch {
    return buildInitialState();
  }
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EngineState>(loadInitialState);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setState((prev) => tick(prev));
    }, 1800 + Math.random() * 1200);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage unavailable or full; state simply won't persist
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [state]);

  const createAgent = (input: NewAgentInput) => {
    const id = input.handle.toLowerCase().replace(/[^a-z0-9]/g, "") || nextId("agent");
    const now = Date.now();
    const startingCash = solToUsd(input.startingCapitalSol);
    const agent: Agent = {
      id,
      name: input.name,
      handle: input.handle.startsWith("@") ? input.handle : `@${input.handle}`,
      bio: input.bio,
      brain: input.brain,
      strategy: input.strategy,
      agentRef: simRef("AGT", now),
      avatarSeed: id,
      // Starting capital is a simulation allocation chosen at launch; it is recorded as the
      // agent's opening deposit and is never taken from the owner's wallet.
      cash: startingCash,
      realizedPnl: 0,
      trades: 0,
      wins: 0,
      maxDrawdown: 0,
      peakEquity: startingCash,
      positions: {},
      equityHistory: [{ t: now, v: startingCash }],
      creatorRewards: 0,
      transfers: [{ id: nextId("transfer"), kind: "deposit", amountUsd: startingCash, timestamp: now }],
      avatarColor: input.avatarColor,
    };
    const token = createLaunchToken(agent);
    const launch: Launch = {
      id: nextId("launch"),
      agentId: id,
      tokenId: token.id,
      startingCapitalSol: input.startingCapitalSol,
      launchCostSol: input.launchCostSol,
      timestamp: now,
    };
    const post: Post = {
      id: nextId("post"),
      agentId: id,
      kind: "note",
      text: `gm. ${agent.name} here — ${agent.strategy} on Solana. Every trade explained, in public.`,
      timestamp: now,
    };
    setState((prev) => ({
      ...prev,
      agents: { ...prev.agents, [id]: agent },
      tokens: { ...prev.tokens, [token.id]: token },
      launches: [launch, ...prev.launches].slice(0, 50),
      posts: [post, ...prev.posts].slice(0, 200),
      launchesCount: prev.launchesCount + 1,
      postsCount: prev.postsCount + 1,
    }));
    return id;
  };

  const placeTrade = (agentId: string, tokenId: string, action: TradeAction, valueUsd: number): PlaceTradeResult => {
    const agent = state.agents[agentId];
    const token = state.tokens[tokenId];
    if (!agent || !token || !(valueUsd > 0)) return { ok: false, reason: "unavailable" };
    if (action === "BUY" && valueUsd > agent.cash) return { ok: false, reason: "insufficient-agent-balance" };
    if (action === "SELL" && (agent.positions[tokenId]?.amount ?? 0) * token.price < valueUsd) return { ok: false, reason: "no-position" };

    const ref = newTradeRef();
    const reasoning = `Manual ${action === "BUY" ? "buy" : "sell"} placed by the agent's owner.`;
    setState((prev) => {
      if (!prev.agents[agentId] || !prev.tokens[tokenId]) return prev;
      const traded = recordTrade(prev, agentId, tokenId, action, valueUsd / prev.tokens[tokenId].price, reasoning, ref);
      return { ...traded, agents: updateEquityAndDrawdowns(traded.agents, traded.tokens) };
    });
    return { ok: true, ref };
  };

  const fundAgent = (agentId: string, amountUsd: number) => {
    setState((prev) => {
      const agent = prev.agents[agentId];
      if (!agent) return prev;
      const transfer: Transfer = { id: nextId("transfer"), kind: "deposit", amountUsd, timestamp: Date.now() };
      const updated: Agent = {
        ...agent,
        cash: agent.cash + amountUsd,
        transfers: [transfer, ...agent.transfers].slice(0, 50),
      };
      return { ...prev, agents: { ...prev.agents, [agentId]: updated } };
    });
  };

  const claimRewards = (agentId: string) => {
    setState((prev) => {
      const agent = prev.agents[agentId];
      if (!agent || agent.creatorRewards <= 0) return prev;
      const amount = agent.creatorRewards;
      const transfer: Transfer = { id: nextId("transfer"), kind: "reward", amountUsd: amount, timestamp: Date.now() };
      const updated: Agent = {
        ...agent,
        cash: agent.cash + amount,
        creatorRewards: 0,
        transfers: [transfer, ...agent.transfers].slice(0, 50),
      };
      return { ...prev, agents: { ...prev.agents, [agentId]: updated } };
    });
  };

  const resetSimulation = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(buildInitialState());
  };

  const value = useMemo<SimulationContextValue>(() => {
    const leaderboard = Object.values(state.agents)
      .map((agent) => computeSnapshot(agent, state.tokens))
      .sort((a, b) => b.pnl - a.pnl);
    return {
      ...state,
      leaderboard,
      snapshot: (agentId: string) => {
        const agent = state.agents[agentId];
        return agent ? computeSnapshot(agent, state.tokens) : undefined;
      },
      createAgent,
      fundAgent,
      claimRewards,
      placeTrade,
      resetSimulation,
    };
  }, [state]);

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
