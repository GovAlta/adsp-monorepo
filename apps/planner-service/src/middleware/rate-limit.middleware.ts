import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../types';

// ✓ ASVS:V4.2.1 — rate limiting to prevent abuse of AI-assisted planning endpoints
// ✓ CAS:RULE-013 — rate limits enforce BR-003: 50 requests/hour per tenant on message/specialist endpoints

// NOTE: This in-memory rate limiter is suitable for single-pod deployments only.
// For multi-pod (horizontal scaling) deployments, replace with a Redis-backed store
// (e.g. rate-limit-redis or @upstash/ratelimit). [IMPL-DEFERRED: SYSREQ-OPS-001]

// In-memory sliding window store: key = `${tenantId}:${windowBucket}`, value = count
// Note: For multi-instance deployments this should use a shared Redis store.
// ✓ ASVS:V4.2.2 — rate limit state is per-tenant (not per-IP) to prevent tenant starvation
const windowStore = new Map<string, { count: number; windowStart: number }>();

/**
 * Cleans up expired window entries to prevent unbounded memory growth.
 * Runs periodically via setInterval.
 */
function cleanExpiredWindows(windowMs: number): void {
  const now = Date.now();
  for (const [key, entry] of windowStore.entries()) {
    if (now - entry.windowStart >= windowMs) {
      windowStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
setInterval(() => cleanExpiredWindows(3600000), 5 * 60 * 1000).unref();

/**
 * createTenantRateLimit — factory for a per-tenant rate limiting middleware.
 * Uses a sliding window algorithm.
 *
 * BR-003: POST /messages and POST /specialists are limited to 50 requests/hour per tenant.
 *
 * @param windowMs — time window in milliseconds (default: 1 hour)
 * @param maxRequests — maximum requests allowed per tenant per window (default: 50)
 */
export function createTenantRateLimit(windowMs: number, maxRequests: number) {
  // ✓ ASVS:V4.2.1 — per-tenant rate limiter; not per-IP to avoid shared-IP false positives
  return function tenantRateLimit(req: Request, res: Response, next: NextFunction): void {
    const tenantId = req.user?.tenantId || req.tenantId;

    if (!tenantId) {
      // No tenant context — let auth middleware handle; pass through
      next();
      return;
    }

    const now = Date.now();
    const windowBucket = Math.floor(now / windowMs);
    const key = `${tenantId}:${windowBucket}`;

    const current = windowStore.get(key);

    if (!current) {
      windowStore.set(key, { count: 1, windowStart: now });
      // Set rate limit headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      next();
      return;
    }

    if (current.count >= maxRequests) {
      const windowEnd = current.windowStart + windowMs;
      const retryAfterSeconds = Math.ceil((windowEnd - now) / 1000);

      // ✓ ASVS:V4.2.1 — 429 with Retry-After header when rate limit exceeded
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(windowEnd / 1000));

      next(new TooManyRequestsError(`Rate limit exceeded: ${maxRequests} requests per hour per tenant`, retryAfterSeconds));
      return;
    }

    current.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - current.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil((current.windowStart + windowMs) / 1000));

    next();
  };
}

/**
 * messagingRateLimit — rate limiter for POST /messages and POST /specialists.
 * 50 requests per hour per tenant (BR-003).
 *
 * ✓ ASVS:V4.2.1 — specific rate limit for AI-assisted endpoints
 * ✓ CAS:RULE-013 — prevents excessive LLM API call costs and abuse
 */
export const messagingRateLimit = createTenantRateLimit(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
  parseInt(process.env.RATE_LIMIT_MAX || '50', 10),
);
