import { InvalidOperationError } from '@core-services/core-common';
import { RequestHandler } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import type { Logger } from 'winston';
import type { RateLimitMetrics } from '../metrics';
import type { RateLimitService } from '../model/rate-limit';
import type { EventRateLimiter } from '../utils/rate-limiter';

export interface WriteRateLimitOptions {
  limits: RateLimitService;
  limiter: EventRateLimiter;
  metrics: RateLimitMetrics;
  logger: Logger;
}

export class RateLimitExceededError extends InvalidOperationError {
  constructor() {
    super('Audit write rate limit exceeded for this tenant and namespace. Retry after the Retry-After delay.', {
      statusCode: HttpStatusCodes.TOO_MANY_REQUESTS,
    });
    Object.setPrototypeOf(this, RateLimitExceededError.prototype);
  }
}

// Counts events rather than requests, and refuses the whole request before any event is enriched or
// buffered, so a refused request stores nothing and its retry cannot duplicate a partial write.
// Admitted requests that then fail (for example 413 or 503 from the buffer) get their allowance back.
export function limitWriteRate({ limits, limiter, metrics, logger }: WriteRateLimitOptions): RequestHandler {
  return async (req, res, next) => {
    try {
      const { namespace } = req.params;
      const tenantId = req.tenant.id;
      const events = (req.body.events as unknown[]).length;
      const limit = await limits.getLimit(tenantId);
      const key = `${tenantId} ${namespace}`;
      const decision = limiter.consume(key, events, limit);
      if (decision.allowed === false) {
        const tenant = tenantId.toString();
        metrics.recordRateLimited(tenant, namespace, events);
        logger.info(`Rate limited ${events} audit events for ${namespace}.`, {
          context: 'AuditRateLimit',
          tenant,
          retryAfterSeconds: decision.retryAfterSeconds,
        });
        res.setHeader('Retry-After', decision.retryAfterSeconds.toString());
        throw new RateLimitExceededError();
      }
      res.once('finish', () => {
        if (res.statusCode >= HttpStatusCodes.BAD_REQUEST) limiter.refund(key, events);
      });
      next();
    } catch (err) {
      next(err);
    }
  };
}
