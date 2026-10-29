import type { RateLimit } from '../configuration';
import { performance } from 'perf_hooks';

export const RATE_LIMIT_SWEEP_INTERVAL_MS = 60000;
const MILLISECONDS_PER_SECOND = 1000;

interface Bucket {
  tokens: number;
  updatedAt: number;
  limit: RateLimit;
}

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * In-memory token buckets, one per key. Each bucket holds up to `burst` tokens and refills at
 * `eventsPerSecond`. State is per process, so with several replicas the effective limit is
 * multiplied by the replica count.
 */
export class EventRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private lastSweep: number;

  constructor(private readonly now: () => number = () => performance.now()) {
    this.lastSweep = now();
  }

  get size(): number {
    return this.buckets.size;
  }

  consume(key: string, events: number, limit: RateLimit): RateLimitDecision {
    const now = this.now();
    this.sweep(now);
    const tokens = this.available(this.buckets.get(key), limit, now);
    if (tokens >= events) {
      this.buckets.set(key, { tokens: tokens - events, updatedAt: now, limit });
      return { allowed: true };
    }
    // Refused requests consume nothing. The delay assumes no intervening writes for this key.
    this.buckets.set(key, { tokens, updatedAt: now, limit });
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((events - tokens) / limit.eventsPerSecond)),
    };
  }

  private available(bucket: Bucket | undefined, limit: RateLimit, now: number): number {
    if (!bucket) return limit.burst;
    const elapsed = Math.max(0, now - bucket.updatedAt) / MILLISECONDS_PER_SECOND;
    return Math.min(limit.burst, bucket.tokens + elapsed * limit.eventsPerSecond);
  }

  // A refilled bucket is indistinguishable from a new one, so dropping it bounds memory
  // without changing any decision.
  private sweep(now: number): void {
    if (now - this.lastSweep < RATE_LIMIT_SWEEP_INTERVAL_MS) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      if (this.available(bucket, bucket.limit, now) >= bucket.limit.burst) this.buckets.delete(key);
    }
  }
}
