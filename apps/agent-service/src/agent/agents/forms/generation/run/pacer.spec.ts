jest.mock('../../../../../environments/environment', () => ({ environment: {} }));

import { UsageRecorder } from '../../../../model/conversationUsage';
import { createGenerationPacer, DEFAULT_STEP_ESTIMATE_TOKENS, getGenerationTokensPerMinute } from './pacer';

describe('getGenerationTokensPerMinute', () => {
  const env = {
    AGENT_FORM_GENERATION_TOKENS_PER_MINUTE: 18000,
    AGENT_TOKEN_LIMIT_PER_MINUTE: 0,
    AGENT_TOKEN_AGENT_SHARES: '',
  };

  it('uses the form generation limit when no key budget is configured', () => {
    // Act
    const limit = getGenerationTokensPerMinute(env);

    // Assert
    expect(limit).toBe(18000);
  });

  it("lowers the limit to the agent's share of the key budget", () => {
    // Act
    const limit = getGenerationTokensPerMinute({
      ...env,
      AGENT_TOKEN_LIMIT_PER_MINUTE: 20000,
      AGENT_TOKEN_AGENT_SHARES: 'formGenerationAgent=0.5',
    });

    // Assert
    expect(limit).toBe(10000);
  });

  it('turns pacing off when the form generation limit is 0', () => {
    // Act
    const limit = getGenerationTokensPerMinute({ ...env, AGENT_FORM_GENERATION_TOKENS_PER_MINUTE: 0 });

    // Assert
    expect(limit).toBe(0);
  });
});

describe('createGenerationPacer', () => {
  let now: number;
  let usage: UsageRecorder;
  const sleep = jest.fn(async (ms: number) => {
    now += ms;
  });

  beforeEach(() => {
    now = 1_000_000;
    usage = new UsageRecorder(() => now);
    sleep.mockClear();
  });

  it('does not wait while a call fits in the last minute', async () => {
    // Arrange
    const pacer = createGenerationPacer({ tokensPerMinute: 14000, usage, now: () => now, sleep });
    usage.observe({ totalTokens: 4500 });
    usage.record({ totalTokens: 1500 });

    // Act
    await pacer.waitForRoom(8000);

    // Assert
    expect(sleep).not.toHaveBeenCalled();
  });

  it("counts the agent's own calls in the reply, not only the build's", async () => {
    // Arrange
    const pacer = createGenerationPacer({ tokensPerMinute: 14000, usage, now: () => now, sleep });
    usage.observe({ totalTokens: 9000 });

    // Act
    await pacer.waitForRoom(8000);

    // Assert
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('waits until enough of the window has expired for the next call', async () => {
    // Arrange
    const pacer = createGenerationPacer({ tokensPerMinute: 14000, usage, now: () => now, sleep });
    usage.record({ totalTokens: 7000 });
    now += 10_000;
    usage.record({ totalTokens: 7000 });

    // Act
    await pacer.waitForRoom(7000);

    // Assert
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(now).toBeGreaterThanOrEqual(1_000_000 + 60_000);
  });

  it('never waits when pacing is off', async () => {
    // Arrange
    const pacer = createGenerationPacer({ tokensPerMinute: 0, usage, now: () => now, sleep });
    usage.record({ totalTokens: 50000 });

    // Act
    await pacer.waitForRoom(50000);

    // Assert
    expect(sleep).not.toHaveBeenCalled();
  });

  it('estimates the next step from the last step call', () => {
    // Arrange
    const pacer = createGenerationPacer({ tokensPerMinute: 14000, usage, now: () => now, sleep });

    // Act
    const before = pacer.stepEstimate;
    pacer.noteStep(7400);

    // Assert
    expect(before).toBe(DEFAULT_STEP_ESTIMATE_TOKENS);
    expect(pacer.stepEstimate).toBe(7400);
  });

  it('stops waiting once the run is aborted', async () => {
    // Arrange
    const controller = new AbortController();
    const pacer = createGenerationPacer({
      tokensPerMinute: 10000,
      usage,
      abortSignal: controller.signal,
      now: () => now,
      sleep: jest.fn(async () => controller.abort()),
    });
    usage.record({ totalTokens: 10000 });

    // Act
    await pacer.waitForRoom(5000);

    // Assert
    expect(controller.signal.aborted).toBe(true);
  });
});
