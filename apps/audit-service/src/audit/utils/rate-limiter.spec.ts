import { EventRateLimiter, RATE_LIMIT_SWEEP_INTERVAL_MS } from './rate-limiter';
import { performance } from 'perf_hooks';

describe('EventRateLimiter', () => {
  const limit = { eventsPerSecond: 500, burst: 500 };
  let now: number;
  let limiter: EventRateLimiter;

  beforeEach(() => {
    now = 1_000_000;
    limiter = new EventRateLimiter(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts requests within the burst allowance', () => {
    expect(limiter.consume('tenant-a case-service', 500, limit)).toEqual({ allowed: true });
  });

  it('refuses a request that exceeds the remaining allowance with the seconds needed to refill it', () => {
    limiter.consume('tenant-a case-service', 500, limit);

    expect(limiter.consume('tenant-a case-service', 250, limit)).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it('rounds Retry-After up so a retry after the delay has enough allowance', () => {
    const slow = { eventsPerSecond: 100, burst: 500 };
    limiter.consume('tenant-a case-service', 500, slow);

    const decision = limiter.consume('tenant-a case-service', 250, slow);
    now += 3000;

    expect(decision).toEqual({ allowed: false, retryAfterSeconds: 3 });
    expect(limiter.consume('tenant-a case-service', 250, slow)).toEqual({ allowed: true });
  });

  it('counts events rather than requests, so one batch of 500 uses the same allowance as 500 single events', () => {
    const batched = new EventRateLimiter(() => now);
    const single = new EventRateLimiter(() => now);

    batched.consume('key', 500, limit);
    for (let i = 0; i < 500; i++) expect(single.consume('key', 1, limit)).toEqual({ allowed: true });

    expect(batched.consume('key', 1, limit).allowed).toBe(false);
    expect(single.consume('key', 1, limit).allowed).toBe(false);
  });

  it('does not consume allowance for a refused request', () => {
    limiter.consume('key', 400, limit);
    expect(limiter.consume('key', 200, limit).allowed).toBe(false);

    expect(limiter.consume('key', 100, limit)).toEqual({ allowed: true });
  });

  it('accepts a previously limited caller again after the window elapses', () => {
    limiter.consume('key', 500, limit);
    expect(limiter.consume('key', 500, limit).allowed).toBe(false);

    now += 1000;

    expect(limiter.consume('key', 500, limit)).toEqual({ allowed: true });
  });

  it('refills gradually and never above the burst', () => {
    limiter.consume('key', 500, limit);
    now += 500;
    expect(limiter.consume('key', 251, limit).allowed).toBe(false);
    expect(limiter.consume('key', 250, limit)).toEqual({ allowed: true });

    now += 60_000;
    expect(limiter.consume('key', 500, limit)).toEqual({ allowed: true });
    expect(limiter.consume('key', 1, limit).allowed).toBe(false);
  });

  it('keeps separate allowances per key', () => {
    limiter.consume('tenant-a case-service', 500, limit);

    expect(limiter.consume('tenant-a payment-service', 500, limit)).toEqual({ allowed: true });
    expect(limiter.consume('tenant-b case-service', 500, limit)).toEqual({ allowed: true });
  });

  it('applies a changed limit to an existing bucket', () => {
    const raised = { eventsPerSecond: 500, burst: 1000 };
    limiter.consume('key', 500, { eventsPerSecond: 250, burst: 500 });
    now += 1000;

    expect(limiter.consume('key', 1000, raised)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    now += 1000;
    expect(limiter.consume('key', 1000, raised)).toEqual({ allowed: true });
  });

  it('does not refill from wall-clock adjustments', () => {
    const monotonicClock = jest.spyOn(performance, 'now').mockReturnValue(0);
    const wallClock = jest.spyOn(Date, 'now').mockReturnValue(0);
    const realClockLimiter = new EventRateLimiter();
    realClockLimiter.consume('tenant-a case-service', 500, limit);

    wallClock.mockReturnValue(3_600_000);

    expect(realClockLimiter.consume('tenant-a case-service', 500, limit).allowed).toBe(false);
    monotonicClock.mockReturnValue(1000);
    expect(realClockLimiter.consume('tenant-a case-service', 500, limit).allowed).toBe(true);
  });

  it('clamps remaining allowance when the burst is reduced', () => {
    limiter.consume('key', 1, { eventsPerSecond: 500, burst: 1000 });

    expect(limiter.consume('key', 500, limit).allowed).toBe(true);
    expect(limiter.consume('key', 1, limit).allowed).toBe(false);
  });

  it('evicts refilled buckets on the sweep interval to bound memory', () => {
    limiter.consume('idle', 500, limit);
    now += RATE_LIMIT_SWEEP_INTERVAL_MS - 1;
    limiter.consume('busy', 1, limit);
    expect(limiter.size).toBe(2);

    now += 1;
    limiter.consume('busy', 500, limit);

    expect(limiter.size).toBe(1);
  });

  it('keeps buckets that have not refilled when sweeping', () => {
    now += RATE_LIMIT_SWEEP_INTERVAL_MS;
    limiter.consume('busy', 500, limit);

    expect(limiter.size).toBe(1);
    expect(limiter.consume('busy', 1, limit).allowed).toBe(false);
  });
});
