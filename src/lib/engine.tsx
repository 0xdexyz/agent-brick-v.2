import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Agent, AgentSnapshot, Launch, Post, Strategy, Token, Trade, TradeAction, Transfer } from "./types";
import { reasoningBank, seedAgents, seedTokens } from "./mockData";
import { mockSolanaKey } from "./format";

interface EngineState {
  agents: Record<string, Agent>;
  tokens: Record<string, Token>;
  trades: Trade[];
  posts: Post[];
  launches: Launch[];
}

interface SimulationContextValue extends EngineState {
  leaderboard: AgentSnapshot[];
  snapshot: (agentId: string) => AgentSnapshot | undefined;
  createAgent: (input: NewAgentInput) => string;
  fundAgent: (agentId: string, amountUsd: number) => void;
  resetDemo: () => void;
}

export interface NewAgentInput {
  name: string;
  handle: string;
  bio: string;
  brain: Agent["brain"];
  strategy: Agent["strategy"];
  avatarColor?: string;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

const STORAGE_KEY = "sentinel-ai-demo-state-v1";

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

  if (eventRoll < 0.78) {
    const agentId = randomOf(agentIds);
    const agent = agents[agentId];
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

    const updatedAgent = applyTrade(agent, token, action, amount);
    const valueUsd = amount * token.price;
    const reasoning = randomOf(reasoningBank[action]);
    const trade: Trade = {
      id: nextId("trade"),
      agentId,
      action,
      tokenId: token.id,
      amount,
      price: token.price,
      valueUsd,
      reasoning,
      signature: mockSolanaKey(Date.now() + Math.random() * 1000),
      timestamp: Date.now(),
    };
    const post: Post = {
      id: nextId("post"),
      agentId,
      kind: "trade",
      text: reasoning,
      tokenId: token.id,
      action,
      timestamp: Date.now(),
    };

    agents = { ...agents, [agentId]: updatedAgent };

    const creatorId = tokens[token.id].launcherAgentId;
    if (creatorId && agents[creatorId]) {
      const reward = valueUsd * CREATOR_FEE_PCT;
      const creator = agents[creatorId];
      agents = {
        ...agents,
        [creatorId]: {
          ...creator,
          cash: creator.cash + reward,
          creatorRewards: creator.creatorRewards + reward,
        },
      };
    }

    trades = [trade, ...trades].slice(0, 200);
    posts = [post, ...posts].slice(0, 200);
  } else if (eventRoll < 0.94) {
    const agentId = randomOf(agentIds);
    const tokenId = randomOf(tokenIds);
    const kind = Math.random() < 0.5 ? "call" : "note";
    const bank = kind === "call" ? reasoningBank.CALL : reasoningBank.NOTE;
    const post: Post = {
      id: nextId("post"),
      agentId,
      kind,
      text: randomOf(bank),
      tokenId: kind === "call" ? tokenId : undefined,
      timestamp: Date.now(),
    };
    posts = [post, ...posts].slice(0, 200);
  } else {
    const agentId = randomOf(agentIds);
    const tokenId = randomOf(tokenIds);
    const launch: Launch = { id: nextId("launch"), agentId, tokenId, timestamp: Date.now() };
    launches = [launch, ...launches].slice(0, 50);
    if (!tokens[tokenId].launcherAgentId) {
      tokens = { ...tokens, [tokenId]: { ...tokens[tokenId], launcherAgentId: agentId } };
    }
  }

  agents = updateEquityAndDrawdowns(agents, tokens);

  return { agents, tokens, trades, posts, launches };
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
  return { agents, tokens, trades: [], posts: [], launches: [] };
}

function loadInitialState(): EngineState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as Partial<EngineState>;
    if (!parsed.agents || !parsed.tokens) return buildInitialState();
    return {
      agents: parsed.agents,
      tokens: parsed.tokens,
      trades: parsed.trades ?? [],
      posts: parsed.posts ?? [],
      launches: parsed.launches ?? [],
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
        // storage unavailable or full; demo state simply won't persist
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [state]);

  const createAgent = (input: NewAgentInput) => {
    const id = input.handle.toLowerCase().replace(/[^a-z0-9]/g, "") || nextId("agent");
    const agent: Agent = {
      id,
      name: input.name,
      handle: input.handle.startsWith("@") ? input.handle : `@${input.handle}`,
      bio: input.bio,
      brain: input.brain,
      strategy: input.strategy,
      wallet: mockSolanaKey(Date.now()),
      avatarSeed: id,
      cash: 5000,
      realizedPnl: 0,
      trades: 0,
      wins: 0,
      maxDrawdown: 0,
      peakEquity: 5000,
      positions: {},
      equityHistory: [{ t: Date.now(), v: 5000 }],
      creatorRewards: 0,
      transfers: [],
      avatarColor: input.avatarColor,
    };
    setState((prev) => ({ ...prev, agents: { ...prev.agents, [id]: agent } }));
    return id;
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

  const resetDemo = () => {
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
      resetDemo,
    };
  }, [state]);

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
