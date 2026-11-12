import { Logger } from 'winston';
import {
  parseAgentShares,
  readTokenBudgetConfig,
  TokenBudget,
  TokenBudgetConfig,
  TokenBudgetEnvironment,
} from './tokenBudget';

const START_MS = Date.parse('2026-11-10T15:00:00.000Z');
const ACCESS_AGENT = 'AccessServiceAgent';
const FORM_AGENT = 'formGenerationAgent';
const TENANT = 'urn:ads:platform:tenant-service:v2:/tenants/demo';
const ALICE = `${TENANT}:alice-id`;
const BOB = `${TENANT}:bob-id`;

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

/** A clock the tests move by hand, measured in milliseconds after START_MS. */
function createClock() {
  let elapsedMs = 0;
  return {
    now: () => START_MS + elapsedMs,
    moveTo: (ms: number) => {
      elapsedMs = ms;
    },
  };
}

function createBudget(config: Partial<TokenBudgetConfig> = {}) {
  const clock = createClock();
  const budget = new TokenBudget(
    {
      limitPerMinute: 0,
      limitPer5Minutes: 0,
      agentShares: new Map(),
      userLimitPerMinute: 0,
      warnRatio: 0.8,
      ...config,
    },
    logger as unknown as Logger,
    clock.now,
  );
  return { budget, clock };
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('TokenBudget', () => {
  describe('check with every limit off', () => {
    it.each([0, -1000])('allows any turn when every limit is %d', (limit) => {
      // Arrange
      const { budget } = createBudget({
        limitPerMinute: limit,
        limitPer5Minutes: limit,
        agentShares: new Map([[ACCESS_AGENT, 0.5]]),
        userLimitPerMinute: limit,
      });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 500_000 });

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 500_000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });
  });

  describe('check against the 1-minute key limit', () => {
    function budgetWithTwoRecentTurns() {
      const { budget, clock } = createBudget({ limitPerMinute: 10_000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 4000 });
      clock.moveTo(10_000);
      budget.record({ agent: FORM_AGENT, userKey: BOB, tokens: 5000 });
      clock.moveTo(20_000);
      return { budget, clock };
    }

    it('allows a turn that exactly fills the rest of the limit', () => {
      // Arrange
      const { budget } = budgetWithTwoRecentTurns();

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 1000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });

    it('denies a turn over the limit until the oldest usage leaves the minute', () => {
      // Arrange
      const { budget } = budgetWithTwoRecentTurns();

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 3000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'key', retryAfterMs: 40_000 });
    });

    it('waits until as many old turns leave the minute as the turn needs', () => {
      // Arrange
      const { budget } = budgetWithTwoRecentTurns();

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 6000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'key', retryAfterMs: 50_000 });
    });

    it('allows the turn once the retryAfterMs it was given has passed', () => {
      // Arrange
      const { budget, clock } = budgetWithTwoRecentTurns();
      clock.moveTo(20_000 + 40_000);

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 3000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });
  });

  describe('check against the 5-minute key limit', () => {
    function budgetWithUsageOverThreeMinutes() {
      const { budget, clock } = createBudget({ limitPer5Minutes: 30_000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 20_000 });
      clock.moveTo(120_000);
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 8000 });
      clock.moveTo(180_000);
      return { budget, clock };
    }

    it('denies a turn over the limit until the oldest usage leaves the 5 minutes', () => {
      // Arrange
      const { budget } = budgetWithUsageOverThreeMinutes();

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 6000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'key', retryAfterMs: 120_000 });
    });

    it('allows the turn once the oldest usage is five minutes old', () => {
      // Arrange
      const { budget, clock } = budgetWithUsageOverThreeMinutes();
      clock.moveTo(300_000);

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 6000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });
  });

  describe('check against agent shares', () => {
    function budgetWithAccessAgentShare() {
      return createBudget({ limitPerMinute: 20_000, agentShares: new Map([[ACCESS_AGENT, 0.25]]) });
    }

    it('denies an agent that has used up its share of the 1-minute key limit', () => {
      // Arrange
      const { budget, clock } = budgetWithAccessAgentShare();
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 4000 });
      clock.moveTo(15_000);

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 2000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'agent', retryAfterMs: 45_000 });
    });

    it('denies an agent that has used up its share of the 5-minute key limit', () => {
      // Arrange
      const { budget, clock } = createBudget({
        limitPer5Minutes: 100_000,
        agentShares: new Map([[ACCESS_AGENT, 0.1]]),
      });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 8000 });
      clock.moveTo(60_000);

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 4000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'agent', retryAfterMs: 240_000 });
    });

    it("does not count other agents' usage against an agent's share", () => {
      // Arrange
      const { budget, clock } = budgetWithAccessAgentShare();
      budget.record({ agent: FORM_AGENT, userKey: ALICE, tokens: 15_000 });
      clock.moveTo(15_000);

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 2000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });

    it('lets an agent without a share use more than the shares of listed agents', () => {
      // Arrange
      const { budget, clock } = budgetWithAccessAgentShare();
      budget.record({ agent: FORM_AGENT, userKey: ALICE, tokens: 15_000 });
      clock.moveTo(15_000);

      // Act
      const decision = budget.check({ agent: FORM_AGENT, userKey: ALICE, estimate: 2000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });

    it('holds an agent without a share to the key limit', () => {
      // Arrange
      const { budget, clock } = budgetWithAccessAgentShare();
      budget.record({ agent: FORM_AGENT, userKey: ALICE, tokens: 15_000 });
      clock.moveTo(15_000);

      // Act
      const decision = budget.check({ agent: FORM_AGENT, userKey: ALICE, estimate: 6000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'key', retryAfterMs: 45_000 });
    });
  });

  describe('check against the per-user limit', () => {
    function budgetWithAliceUsage() {
      const { budget, clock } = createBudget({ userLimitPerMinute: 8000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 6000 });
      clock.moveTo(30_000);
      return budget;
    }

    it('denies a user who has used up the per-user limit', () => {
      // Arrange
      const budget = budgetWithAliceUsage();

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 3000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'user', retryAfterMs: 30_000 });
    });

    it("does not count another user's usage against a user's limit", () => {
      // Arrange
      const budget = budgetWithAliceUsage();

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: BOB, estimate: 3000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });
  });

  describe('check with estimates outside the limit', () => {
    it('allows a turn estimated above the limit when the window is idle', () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 10_000 });

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 50_000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });

    it('makes a turn estimated above the limit wait only until the limit can be met', () => {
      // Arrange
      const { budget, clock } = createBudget({ limitPerMinute: 10_000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 1000 });
      clock.moveTo(20_000);
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 3000 });
      clock.moveTo(30_000);

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 50_000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'key', retryAfterMs: 50_000 });
    });

    it('treats a negative estimate as a turn that needs no tokens', () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 10_000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 10_000 });

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: -2000 });

      // Assert
      expect(decision).toEqual({ allowed: true });
    });
  });

  describe('check when several limits deny', () => {
    it('reports the agent 5-minute wait when it is longer than the user 1-minute wait', () => {
      // Arrange
      const { budget, clock } = createBudget({
        limitPer5Minutes: 40_000,
        agentShares: new Map([[ACCESS_AGENT, 0.25]]),
        userLimitPerMinute: 5000,
      });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 6000 });
      clock.moveTo(100_000);
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 3000 });
      clock.moveTo(120_000);

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 3000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'agent', retryAfterMs: 180_000 });
    });

    it('reports the user wait when it is longer than the key wait', () => {
      // Arrange
      const { budget, clock } = createBudget({ limitPerMinute: 20_000, userLimitPerMinute: 5000 });
      budget.record({ agent: ACCESS_AGENT, userKey: BOB, tokens: 15_000 });
      clock.moveTo(50_000);
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 4000 });
      clock.moveTo(55_000);

      // Act
      const decision = budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 3000 });

      // Assert
      expect(decision).toEqual({ allowed: false, scope: 'user', retryAfterMs: 55_000 });
    });
  });

  describe('record', () => {
    it.each([0, -1200, NaN, Infinity])('does not count a reply of %p tokens against the budget', (tokens) => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 1000 });

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens });

      // Assert
      expect(budget.check({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 1000 })).toEqual({ allowed: true });
    });

    it.each([0, -1200, NaN, Infinity])("leaves the agent's estimate alone for a reply of %p tokens", (tokens) => {
      // Arrange
      const { budget } = createBudget();

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens });

      // Assert
      expect(budget.estimate(ACCESS_AGENT)).toBe(6000);
    });
  });

  describe('reserve', () => {
    it('holds an allowed turn so a turn starting at the same time cannot overshoot the limit', () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 10000 });

      // Act
      const first = budget.reserve({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 6000 });
      const second = budget.reserve({ agent: ACCESS_AGENT, userKey: BOB, estimate: 6000 });

      // Assert
      expect(first.allowed).toBe(true);
      expect(second).toMatchObject({ allowed: false, scope: 'key' });
    });

    it("replaces the reservation with the turn's recorded usage", () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 10000 });
      const first = budget.reserve({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 6000 });

      // Act
      budget.record(
        { agent: ACCESS_AGENT, userKey: ALICE, tokens: 2000 },
        first.allowed ? first.reservation : undefined,
      );

      // Assert
      expect(budget.reserve({ agent: ACCESS_AGENT, userKey: BOB, estimate: 6000 }).allowed).toBe(true);
    });

    it('keeps the estimate of a turn that never records until it leaves the window', () => {
      // Arrange
      const { budget, clock } = createBudget({ limitPerMinute: 10000 });
      budget.reserve({ agent: ACCESS_AGENT, userKey: ALICE, estimate: 6000 });

      // Act
      const during = budget.check({ agent: ACCESS_AGENT, userKey: BOB, estimate: 6000 });
      clock.moveTo(60_001);
      const after = budget.check({ agent: ACCESS_AGENT, userKey: BOB, estimate: 6000 });

      // Assert
      expect(during).toEqual({ allowed: false, scope: 'key', retryAfterMs: 60_000 });
      expect(after).toEqual({ allowed: true });
    });

    it('refuses without holding anything', () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 5000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 5000 });

      // Act
      const refused = budget.reserve({ agent: ACCESS_AGENT, userKey: BOB, estimate: 1000 });

      // Assert
      expect(refused).toMatchObject({ allowed: false, scope: 'key' });
      expect(refused).not.toHaveProperty('reservation');
    });
  });

  describe('usage warnings', () => {
    it('does not warn while usage stays below the warning ratio of a limit', () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 10_000, warnRatio: 0.8 });

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 5000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 2999 });

      // Assert
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('warns when a reply takes usage across the warning ratio of the 1-minute key limit', () => {
      // Arrange
      const { budget, clock } = createBudget({ limitPerMinute: 10_000, warnRatio: 0.8 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 5000 });
      clock.moveTo(10_000);

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 4000 });

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Token usage reached 9000 of the 10000-token key limit per minute after a reply from agent AccessServiceAgent.',
        {
          context: 'TokenBudget',
          agent: ACCESS_AGENT,
          scope: 'key',
          window: '1m',
          usedTokens: 9000,
          limitTokens: 10_000,
        },
      );
    });

    it('warns when a reply takes usage exactly to the warning ratio', () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 10_000, warnRatio: 0.8 });

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 8000 });

      // Assert
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('warns with the 5-minute window when the 5-minute key limit is crossed', () => {
      // Arrange
      const { budget, clock } = createBudget({ limitPer5Minutes: 50_000, warnRatio: 0.8 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 30_000 });
      clock.moveTo(120_000);

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 12_000 });

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Token usage reached 42000 of the 50000-token key limit per 5 minutes after a reply from agent AccessServiceAgent.',
        {
          context: 'TokenBudget',
          agent: ACCESS_AGENT,
          scope: 'key',
          window: '5m',
          usedTokens: 42_000,
          limitTokens: 50_000,
        },
      );
    });

    it('warns with the agent scope when an agent crosses the warning ratio of its share', () => {
      // Arrange
      const { budget } = createBudget({
        limitPerMinute: 100_000,
        agentShares: new Map([[ACCESS_AGENT, 0.1]]),
        warnRatio: 0.8,
      });

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 8500 });

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(expect.any(String), {
        context: 'TokenBudget',
        agent: ACCESS_AGENT,
        scope: 'agent',
        window: '1m',
        usedTokens: 8500,
        limitTokens: 10_000,
      });
    });

    it('names the user when a user crosses the warning ratio of the per-user limit', () => {
      // Arrange
      const { budget } = createBudget({ userLimitPerMinute: 5000, warnRatio: 0.8 });

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 4500 });

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(expect.any(String), {
        context: 'TokenBudget',
        agent: ACCESS_AGENT,
        scope: 'user',
        window: '1m',
        usedTokens: 4500,
        limitTokens: 5000,
        user: ALICE,
      });
    });

    it('leaves the user out of a key limit warning', () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 10_000, warnRatio: 0.8 });

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 9000 });

      // Assert
      expect(logger.warn.mock.calls[0][1]).not.toHaveProperty('user');
    });

    it('warns only once while usage stays above the warning ratio', () => {
      // Arrange
      const { budget, clock } = createBudget({ limitPerMinute: 10_000, warnRatio: 0.8 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 9000 });
      clock.moveTo(10_000);

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 500 });
      clock.moveTo(20_000);
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 300 });

      // Assert
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('warns again when usage drops below the warning ratio and then rises across it', () => {
      // Arrange
      const { budget, clock } = createBudget({ limitPerMinute: 10_000, warnRatio: 0.8 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 9000 });
      clock.moveTo(10_000);
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 500 });
      clock.moveTo(70_000);

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 9000 });

      // Assert
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });

    it('does not warn when the warning ratio is 0', () => {
      // Arrange
      const { budget } = createBudget({ limitPerMinute: 10_000, warnRatio: 0 });

      // Act
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 10_000 });

      // Assert
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('estimate', () => {
    it('estimates 6000 tokens for an agent with no recorded turns', () => {
      // Arrange
      const { budget } = createBudget();

      // Act
      const estimate = budget.estimate(ACCESS_AGENT);

      // Assert
      expect(estimate).toBe(6000);
    });

    it("averages the agent's recorded turns", () => {
      // Arrange
      const { budget } = createBudget();
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 3000 });
      budget.record({ agent: ACCESS_AGENT, userKey: BOB, tokens: 5000 });

      // Act
      const estimate = budget.estimate(ACCESS_AGENT);

      // Assert
      expect(estimate).toBe(4000);
    });

    it("averages only the agent's last five turns", () => {
      // Arrange
      const { budget } = createBudget();
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 100_000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 1000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 2000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 3000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 4000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 5000 });

      // Act
      const estimate = budget.estimate(ACCESS_AGENT);

      // Assert
      expect(estimate).toBe(3000);
    });

    it('rounds the average to a whole number of tokens', () => {
      // Arrange
      const { budget } = createBudget();
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 1000 });
      budget.record({ agent: ACCESS_AGENT, userKey: ALICE, tokens: 1001 });

      // Act
      const estimate = budget.estimate(ACCESS_AGENT);

      // Assert
      expect(estimate).toBe(1001);
    });

    it("does not use other agents' turns in an agent's estimate", () => {
      // Arrange
      const { budget } = createBudget();
      budget.record({ agent: FORM_AGENT, userKey: ALICE, tokens: 20_000 });

      // Act
      const estimate = budget.estimate(ACCESS_AGENT);

      // Assert
      expect(estimate).toBe(6000);
    });
  });
});

describe('parseAgentShares', () => {
  it('reads comma-separated agent=share entries', () => {
    // Arrange
    const value = 'AccessServiceAgent=0.25,formGenerationAgent=0.5';

    // Act
    const result = parseAgentShares(value);

    // Assert
    expect(result).toEqual({
      shares: new Map([
        [ACCESS_AGENT, 0.25],
        [FORM_AGENT, 0.5],
      ]),
      ignored: [],
    });
  });

  it('trims spaces around agents and shares', () => {
    // Arrange
    const value = '  AccessServiceAgent = 0.25 ';

    // Act
    const result = parseAgentShares(value);

    // Assert
    expect(result.shares).toEqual(new Map([[ACCESS_AGENT, 0.25]]));
  });

  it.each([
    ['1.5', 1],
    ['-0.2', 0],
    ['0', 0],
    ['1', 1],
  ])('clamps a share of %s to %d', (share, expected) => {
    // Arrange
    const value = `AccessServiceAgent=${share}`;

    // Act
    const result = parseAgentShares(value);

    // Assert
    expect(result.shares.get(ACCESS_AGENT)).toBe(expected);
  });

  it.each([
    'AccessServiceAgent',
    'AccessServiceAgent=',
    '=0.25',
    'AccessServiceAgent=quarter',
    'AccessServiceAgent=0.25=0.5',
    'AccessServiceAgent=Infinity',
  ])('ignores the malformed entry %p', (entry) => {
    // Arrange
    const value = entry;

    // Act
    const result = parseAgentShares(value);

    // Assert
    expect(result).toEqual({ shares: new Map(), ignored: [entry] });
  });

  it('keeps well-formed entries next to malformed ones', () => {
    // Arrange
    const value = 'AccessServiceAgent=0.25,formGenerationAgent';

    // Act
    const result = parseAgentShares(value);

    // Assert
    expect(result).toEqual({ shares: new Map([[ACCESS_AGENT, 0.25]]), ignored: [FORM_AGENT] });
  });

  it.each(['', '   ', ',', ' , , '])('finds no shares and ignores nothing in the blank value %p', (value) => {
    // Arrange
    const blank = value;

    // Act
    const result = parseAgentShares(blank);

    // Assert
    expect(result).toEqual({ shares: new Map(), ignored: [] });
  });

  it('skips blank entries between commas', () => {
    // Arrange
    const value = 'AccessServiceAgent=0.25,, ,formGenerationAgent=0.5,';

    // Act
    const result = parseAgentShares(value);

    // Assert
    expect(result).toEqual({
      shares: new Map([
        [ACCESS_AGENT, 0.25],
        [FORM_AGENT, 0.5],
      ]),
      ignored: [],
    });
  });

  it('uses the last share when an agent is listed twice', () => {
    // Arrange
    const value = 'AccessServiceAgent=0.25,AccessServiceAgent=0.5';

    // Act
    const result = parseAgentShares(value);

    // Assert
    expect(result.shares.get(ACCESS_AGENT)).toBe(0.5);
  });
});

describe('readTokenBudgetConfig', () => {
  function environmentWith(shares: string): TokenBudgetEnvironment {
    return {
      AGENT_TOKEN_LIMIT_PER_MINUTE: 200_000,
      AGENT_TOKEN_LIMIT_PER_5_MINUTES: 800_000,
      AGENT_TOKEN_AGENT_SHARES: shares,
      AGENT_USER_TOKEN_LIMIT_PER_MINUTE: 50_000,
      AGENT_TOKEN_WARN_RATIO: 0.7,
    };
  }

  it('builds the budget configuration from the environment', () => {
    // Arrange
    const env = environmentWith('AccessServiceAgent=0.25');

    // Act
    const config = readTokenBudgetConfig(env, logger as unknown as Logger);

    // Assert
    expect(config).toEqual({
      limitPerMinute: 200_000,
      limitPer5Minutes: 800_000,
      agentShares: new Map([[ACCESS_AGENT, 0.25]]),
      userLimitPerMinute: 50_000,
      warnRatio: 0.7,
    });
  });

  it('warns about the agent share entries it ignores', () => {
    // Arrange
    const env = environmentWith('AccessServiceAgent=0.25,formGenerationAgent,=0.5');

    // Act
    readTokenBudgetConfig(env, logger as unknown as Logger);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith('Ignoring malformed agent token shares: formGenerationAgent, =0.5.', {
      context: 'TokenBudget',
    });
  });

  it('leaves the ignored entries out of the agent shares', () => {
    // Arrange
    const env = environmentWith('AccessServiceAgent=0.25,formGenerationAgent,=0.5');

    // Act
    const config = readTokenBudgetConfig(env, logger as unknown as Logger);

    // Assert
    expect(config.agentShares).toEqual(new Map([[ACCESS_AGENT, 0.25]]));
  });

  it.each(['AccessServiceAgent=0.25,formGenerationAgent=0.5', ''])(
    'does not warn when the agent shares %p have no malformed entries',
    (shares) => {
      // Arrange
      const env = environmentWith(shares);

      // Act
      readTokenBudgetConfig(env, logger as unknown as Logger);

      // Assert
      expect(logger.warn).not.toHaveBeenCalled();
    },
  );
});
