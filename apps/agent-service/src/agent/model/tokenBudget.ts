import { Logger } from 'winston';

/** Estimate of an agent's turn before any of its turns have been recorded. */
export const DEFAULT_TURN_ESTIMATE_TOKENS = 6000;
/** Number of an agent's most recent turns that its estimate averages. */
export const ESTIMATE_TURN_COUNT = 5;

export type TokenBudgetScope = 'key' | 'agent' | 'user';

export interface TokenBudgetConfig {
  /** Tokens per minute for the model key; 0 turns the limit off. */
  limitPerMinute: number;
  /** Tokens per 5 minutes for the model key; 0 turns the limit off. */
  limitPer5Minutes: number;
  /** Share, from 0 to 1, of each key limit that an agent may use. Agents without a share only have the key limits. */
  agentShares: ReadonlyMap<string, number>;
  /** Tokens per minute for one user; 0 turns the limit off. */
  userLimitPerMinute: number;
  /** Share of a limit at which a warning is logged. */
  warnRatio: number;
}

export interface TokenBudgetEnvironment {
  AGENT_TOKEN_LIMIT_PER_MINUTE: number;
  AGENT_TOKEN_LIMIT_PER_5_MINUTES: number;
  AGENT_TOKEN_AGENT_SHARES: string;
  AGENT_USER_TOKEN_LIMIT_PER_MINUTE: number;
  AGENT_TOKEN_WARN_RATIO: number;
}

export interface TokenBudgetRequest {
  agent: string;
  /** Identifies the user across tenants, such as `${tenantId}:${userId}`. */
  userKey: string;
  estimate: number;
}

export interface TokenBudgetUsage {
  agent: string;
  userKey: string;
  tokens: number;
}

export type TokenBudgetDecision = { allowed: true } | { allowed: false; scope: TokenBudgetScope; retryAfterMs: number };

/** A turn's estimate, held against the budget from the moment the turn is allowed until it records its usage. */
export interface TokenBudgetReservation {
  readonly id: number;
}

export type TokenBudgetReservationDecision =
  | { allowed: true; reservation: TokenBudgetReservation }
  | { allowed: false; scope: TokenBudgetScope; retryAfterMs: number };

export interface AgentShares {
  shares: Map<string, number>;
  /** Entries that are not `agent=share` with a numeric share. */
  ignored: string[];
}

interface UsageEvent {
  at: number;
  tokens: number;
  agent: string;
  userKey: string;
}

interface BudgetWindow {
  name: '1m' | '5m';
  description: string;
  ms: number;
}

interface BudgetLimit {
  scope: TokenBudgetScope;
  window: BudgetWindow;
  tokens: number;
  counts: (event: UsageEvent) => boolean;
}

const ONE_MINUTE: BudgetWindow = { name: '1m', description: 'minute', ms: 60_000 };
const FIVE_MINUTES: BudgetWindow = { name: '5m', description: '5 minutes', ms: 300_000 };
const LONGEST_WINDOW_MS = FIVE_MINUTES.ms;

/**
 * Keeps agents within the token limits of the model key they all share, over sliding windows of recorded usage.
 * Usage is held in memory, so each pod enforces its own budget: with several pods, set the limits to the key's limit
 * divided by the number of pods.
 */
export class TokenBudget {
  private events: UsageEvent[] = [];
  private readonly reservations = new Map<number, UsageEvent>();
  private nextReservationId = 1;
  private readonly recentTurns = new Map<string, number[]>();

  constructor(
    private readonly config: TokenBudgetConfig,
    private readonly logger: Logger,
    private readonly now: () => number = Date.now,
  ) {}

  /** Whether a turn of the estimated size fits every limit that applies to the agent and the user. */
  check({ agent, userKey, estimate }: TokenBudgetRequest): TokenBudgetDecision {
    const now = this.now();
    const denials = this.limitsFor(agent, userKey)
      .map((limit) => ({ scope: limit.scope, retryAfterMs: this.timeUntilFits(limit, estimate, now) }))
      .filter((denial) => denial.retryAfterMs !== undefined);

    if (!denials.length) {
      return { allowed: true };
    }

    // The turn can only run once the limit that frees up last allows it.
    const latest = denials.reduce((longest, denial) => (denial.retryAfterMs > longest.retryAfterMs ? denial : longest));
    return { allowed: false, ...latest };
  }

  /**
   * Checks a turn and, when it fits, holds its estimate against the budget so that turns starting together cannot
   * overshoot it. Recording the turn's usage replaces the estimate. A turn that fails before recording keeps its
   * estimate charged until it leaves the window, which also backs off retries while the provider is rate limiting.
   */
  reserve(request: TokenBudgetRequest): TokenBudgetReservationDecision {
    const decision = this.check(request);
    if (decision.allowed === false) {
      return decision;
    }

    const now = this.now();
    for (const [id, reserved] of this.reservations) {
      if (reserved.at <= now - LONGEST_WINDOW_MS) {
        this.reservations.delete(id);
      }
    }

    const reservation = { id: this.nextReservationId++ };
    const tokens = Number.isFinite(request.estimate) ? Math.max(request.estimate, 0) : 0;
    this.reservations.set(reservation.id, { at: now, tokens, agent: request.agent, userKey: request.userKey });
    return { allowed: true, reservation };
  }

  /** Counts what a finished turn used against every window from now on, in place of its reservation. */
  record(usage: TokenBudgetUsage, reservation?: TokenBudgetReservation): void {
    if (reservation) {
      this.reservations.delete(reservation.id);
    }
    if (!Number.isFinite(usage.tokens) || usage.tokens <= 0) {
      return;
    }

    const now = this.now();
    this.events = this.events.filter((event) => event.at > now - LONGEST_WINDOW_MS);
    for (const limit of this.limitsFor(usage.agent, usage.userKey)) {
      this.warnOnCrossing(limit, usage, now);
    }
    this.events.push({ at: now, tokens: usage.tokens, agent: usage.agent, userKey: usage.userKey });
    this.rememberTurn(usage.agent, usage.tokens);
  }

  /** Average of the agent's recent turns, or a default until it has any. */
  estimate(agent: string): number {
    const turns = this.recentTurns.get(agent);
    return turns?.length ? Math.round(sumOf(turns) / turns.length) : DEFAULT_TURN_ESTIMATE_TOKENS;
  }

  private limitsFor(agent: string, userKey: string): BudgetLimit[] {
    const { limitPerMinute, limitPer5Minutes, userLimitPerMinute, agentShares } = this.config;
    const share = agentShares.get(agent) ?? 0;
    const anyEvent = () => true;
    const agentEvent = (event: UsageEvent) => event.agent === agent;
    const userEvent = (event: UsageEvent) => event.userKey === userKey;

    const limits: BudgetLimit[] = [
      { scope: 'key', window: ONE_MINUTE, tokens: limitPerMinute, counts: anyEvent },
      { scope: 'key', window: FIVE_MINUTES, tokens: limitPer5Minutes, counts: anyEvent },
      { scope: 'agent', window: ONE_MINUTE, tokens: Math.floor(limitPerMinute * share), counts: agentEvent },
      { scope: 'agent', window: FIVE_MINUTES, tokens: Math.floor(limitPer5Minutes * share), counts: agentEvent },
      { scope: 'user', window: ONE_MINUTE, tokens: userLimitPerMinute, counts: userEvent },
    ];
    // A limit of 0 is off, which includes the share of an agent that has none.
    return limits.filter((limit) => limit.tokens > 0);
  }

  private eventsIn(limit: BudgetLimit, now: number): UsageEvent[] {
    const windowStart = now - limit.window.ms;
    return [...this.events, ...this.reservations.values()]
      .filter((event) => event.at > windowStart && limit.counts(event))
      .sort((first, second) => first.at - second.at);
  }

  /**
   * Time until enough of the window's oldest usage expires for the estimate to fit, or undefined when it fits now.
   * The estimate is capped at the limit so that a turn larger than the limit can still run in an idle window.
   */
  private timeUntilFits(limit: BudgetLimit, estimate: number, now: number): number | undefined {
    const events = this.eventsIn(limit, now);
    const needed = Math.min(Math.max(estimate, 0), limit.tokens);
    const excess = tokensOf(events) + needed - limit.tokens;
    if (excess <= 0) {
      return undefined;
    }

    let freed = 0;
    for (const event of events) {
      freed += event.tokens;
      if (freed >= excess) {
        return event.at + limit.window.ms - now;
      }
    }
    // Not reached while the estimate is capped at the limit: emptying the window always frees enough.
    return limit.window.ms;
  }

  private warnOnCrossing(limit: BudgetLimit, usage: TokenBudgetUsage, now: number): void {
    const threshold = limit.tokens * this.config.warnRatio;
    const usedBefore = tokensOf(this.eventsIn(limit, now));
    const usedAfter = usedBefore + usage.tokens;
    if (!crossesThreshold(usedBefore, usedAfter, threshold)) {
      return;
    }

    this.logger.warn(
      `Token usage reached ${usedAfter} of the ${limit.tokens}-token ${limit.scope} limit per ${limit.window.description} after a reply from agent ${usage.agent}.`,
      {
        context: 'TokenBudget',
        agent: usage.agent,
        scope: limit.scope,
        window: limit.window.name,
        usedTokens: usedAfter,
        limitTokens: limit.tokens,
        ...(limit.scope === 'user' ? { user: usage.userKey } : {}),
      },
    );
  }

  private rememberTurn(agent: string, tokens: number): void {
    const turns = [...(this.recentTurns.get(agent) ?? []), tokens].slice(-ESTIMATE_TURN_COUNT);
    this.recentTurns.set(agent, turns);
  }
}

/** Reads "agent=share" entries separated by commas, clamping each share to 0..1. */
export function parseAgentShares(value: string): AgentShares {
  const result: AgentShares = { shares: new Map(), ignored: [] };
  for (const entry of value.split(',').map((part) => part.trim())) {
    if (!entry) {
      continue;
    }

    const share = readShareEntry(entry);
    if (share) {
      result.shares.set(share.agent, share.share);
    } else {
      result.ignored.push(entry);
    }
  }
  return result;
}

/** Builds the budget's configuration, logging share entries it has to ignore so a typo does not go unnoticed. */
export function readTokenBudgetConfig(env: TokenBudgetEnvironment, logger: Logger): TokenBudgetConfig {
  const { shares, ignored } = parseAgentShares(env.AGENT_TOKEN_AGENT_SHARES);
  if (ignored.length) {
    logger.warn(`Ignoring malformed agent token shares: ${ignored.join(', ')}.`, { context: 'TokenBudget' });
  }

  return {
    limitPerMinute: env.AGENT_TOKEN_LIMIT_PER_MINUTE,
    limitPer5Minutes: env.AGENT_TOKEN_LIMIT_PER_5_MINUTES,
    agentShares: shares,
    userLimitPerMinute: env.AGENT_USER_TOKEN_LIMIT_PER_MINUTE,
    warnRatio: env.AGENT_TOKEN_WARN_RATIO,
  };
}

function readShareEntry(entry: string): { agent: string; share: number } | undefined {
  const [agent, value, ...extra] = entry.split('=').map((part) => part.trim());
  if (!agent || !value || extra.length) {
    return undefined;
  }

  const share = Number(value);
  return Number.isFinite(share) ? { agent, share: Math.min(Math.max(share, 0), 1) } : undefined;
}

function crossesThreshold(usedBefore: number, usedAfter: number, threshold: number): boolean {
  return threshold > 0 && usedBefore < threshold && usedAfter >= threshold;
}

function sumOf(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function tokensOf(events: UsageEvent[]): number {
  return sumOf(events.map((event) => event.tokens));
}
