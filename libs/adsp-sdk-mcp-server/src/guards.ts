import type * as express from 'express';
import { rateLimit } from 'express-rate-limit';
import { McpServerConfig } from './config';
import { getMetrics } from './metrics';
import { Semaphore } from './semaphore';

const RATE_LIMIT_WINDOW_MS = 60_000;

export function sendJsonRpcError(res: express.Response, status: number, message: string): void {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });
}

function isAllowedOrigin(origin: string, corsOrigins: McpServerConfig['corsOrigins']): boolean {
  // Sandboxed frames and file: pages send "null", which can't be tied to any one site.
  if (origin === 'null') {
    return false;
  }
  // Exact match: browsers send Origin as scheme://host[:port], and trimming the client's value with a regex is
  // quadratic on a header full of slashes. CORS_ORIGIN entries are normalised once in readConfig instead.
  return corsOrigins === '*' || corsOrigins.includes(origin);
}

/** MCP requires servers to validate Origin (2025-11-25). Requests without one come from non-browser clients and pass. */
export function createCorsAndOriginGuard(corsOrigins: McpServerConfig['corsOrigins']): express.RequestHandler {
  return (req, res, next) => {
    res.vary('Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, mcp-protocol-version');
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

    const origin = req.headers.origin;
    if (origin !== undefined) {
      if (!isAllowedOrigin(origin, corsOrigins)) {
        getMetrics().recordRejection('origin');
        sendJsonRpcError(res, 403, 'Origin not allowed');
        return;
      }
      res.setHeader('Access-Control-Allow-Origin', corsOrigins === '*' ? '*' : origin);
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  };
}

/** Keyed by client IP until authentication lands; then this should return the authenticated client. */
export function rateLimitKey(req: express.Request): string {
  return req.ip ?? 'unknown';
}

export function createRateLimit(limitPerMinute: number): express.RequestHandler {
  if (limitPerMinute === 0) {
    return (_req, _res, next) => next();
  }
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: limitPerMinute,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: rateLimitKey,
    // With standardHeaders on, express-rate-limit sets Retry-After before calling the handler.
    handler: (_req, res) => {
      getMetrics().recordRejection('rate_limit');
      sendJsonRpcError(res, 429, 'Rate limit exceeded');
    },
  });
}

/** Holds each admitted request's slot until its response closes; `mcp.requests.in_flight` counts admitted requests. */
export function createInFlightGate(semaphore: Semaphore, waitMs: number): express.RequestHandler {
  return async (_req, res, next) => {
    const closed = new AbortController();
    res.on('close', () => closed.abort());

    const release = await semaphore.acquire(waitMs, closed.signal);
    if (!release) {
      if (!closed.signal.aborted) {
        getMetrics().recordRejection('in_flight_cap');
        res.setHeader('Retry-After', '1');
        sendJsonRpcError(res, 503, 'Server busy');
      }
      return;
    }
    if (closed.signal.aborted) {
      release();
      return;
    }

    const metrics = getMetrics();
    metrics.addInFlight(1);
    res.on('close', () => {
      release();
      metrics.addInFlight(-1);
    });
    next();
  };
}
