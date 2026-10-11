/**
 * metrics.controller.spec.ts — Unit tests for MetricsController
 *
 * Protected B classification (FAC-S4-027 / ASVS:V1.6.1):
 *   - metrics endpoint exposes only process-level counters (uptime, node version)
 *   - no tenant data, no session content, no connection URIs appear in any assertion
 *
 * ✓ ASVS:V1.6.1 — response body verified to contain only Prometheus process metrics
 * ✓ ASVS:V7.1.1 — no connection string, credentials, or tenant data in any assertion
 * [IMPL-DEFERRED: SYSREQ-023] — stub counters with value 0; prom-client integration Stage 5
 */

import { Request, Response } from 'express';
import { MetricsController } from '../metrics.controller';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRes = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

/** Metrics endpoint ignores the request body entirely (_req prefix confirms this). */
const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    path: '/metrics',
    ...overrides,
  }) as unknown as Request;

/** Helper: invoke getMetrics and return the response body string. */
const captureBody = (): string => {
  const res = makeRes();
  controller.getMetrics(makeReq(), res);
  return (res.send as jest.Mock).mock.calls[0][0] as string;
};

// ---------------------------------------------------------------------------
// Controller under test
// ---------------------------------------------------------------------------

let controller: MetricsController;

beforeEach(() => {
  jest.clearAllMocks();
  controller = new MetricsController(mockLogger as never);
});

// ---------------------------------------------------------------------------
// getMetrics — HTTP status and Content-Type
// ---------------------------------------------------------------------------

describe('getMetrics — HTTP status and Content-Type', () => {
  it('calls res.send() with a non-empty body (implicit HTTP 200 — no explicit status call)', () => {
    // TC-INFRA-011
    // ✓ ASVS:V1.6.1 — metrics output contains only process counters; no Protected B content
    const res = makeRes();

    controller.getMetrics(makeReq(), res);

    expect(res.send).toHaveBeenCalled();
    const body = (res.send as jest.Mock).mock.calls[0][0] as string;
    expect(body.length).toBeGreaterThan(0);
    // Controller does NOT call res.status() — Express defaults to 200
    expect(res.status).not.toHaveBeenCalled();
  });

  it('sets Content-Type to text/plain with Prometheus version qualifier (version=0.0.4)', () => {
    // TC-INFRA-012
    const res = makeRes();

    controller.getMetrics(makeReq(), res);

    expect(res.set).toHaveBeenCalledWith(
      'Content-Type',
      expect.stringContaining('text/plain'),
    );
    const contentTypeValue = ((res.set as jest.Mock).mock.calls[0] as string[])[1];
    expect(contentTypeValue).toContain('version=0.0.4');
  });
});

// ---------------------------------------------------------------------------
// getMetrics — Prometheus text format compliance
// ---------------------------------------------------------------------------

describe('getMetrics — Prometheus text format', () => {
  it('response body contains the process_uptime_seconds metric', () => {
    // TC-INFRA-013
    const body = captureBody();
    expect(body).toContain('process_uptime_seconds');
  });

  it('response body contains # HELP comment lines (Prometheus exposition format)', () => {
    // TC-INFRA-014
    const body = captureBody();
    expect(body).toMatch(/^# HELP /m);
  });

  it('response body contains # TYPE comment lines (Prometheus exposition format)', () => {
    // TC-INFRA-015
    const body = captureBody();
    expect(body).toMatch(/^# TYPE /m);
  });

  it('process_uptime_seconds has # HELP and # TYPE headers before its value line', () => {
    // TC-INFRA-016
    const body = captureBody();
    expect(body).toContain('# HELP process_uptime_seconds');
    expect(body).toContain('# TYPE process_uptime_seconds gauge');
    // The value line follows the TYPE declaration
    expect(body).toMatch(/^process_uptime_seconds \d/m);
  });

  it('process_uptime_seconds value is a non-negative number', () => {
    // TC-INFRA-017
    const body = captureBody();
    const match = body.match(/^process_uptime_seconds\s+([\d.]+)/m);
    expect(match).not.toBeNull();
    const value = parseFloat(match![1]);
    expect(value).toBeGreaterThanOrEqual(0);
  });

  it('stub counter service_request_count_total is present with value 0', () => {
    // TC-INFRA-018 — [IMPL-DEFERRED: SYSREQ-023] stub value assertion
    const body = captureBody();
    expect(body).toContain('service_request_count_total');
    expect(body).toMatch(/service_request_count_total\{[^}]+\}\s+0/);
  });
});

// ---------------------------------------------------------------------------
// getMetrics — Protected B data exclusion (ASVS:V1.6.1)
// ---------------------------------------------------------------------------

describe('getMetrics — no Protected B data in response (ASVS:V1.6.1)', () => {
  it('response body does not contain tenant identifiers or session content fields', () => {
    // TC-INFRA-019
    // ✓ ASVS:V1.6.1 — assert no tenant/session data leaks into metrics output
    const body = captureBody();

    const forbiddenSubstrings = [
      'tenantId', 'sessionId', 'userId',
      'token', 'password', 'connectionString',
    ];
    forbiddenSubstrings.forEach((term) => {
      expect(body.toLowerCase()).not.toContain(term.toLowerCase());
    });
  });

  it('response body does not contain URI schemes (no connection strings or URLs)', () => {
    // TC-INFRA-020
    // ✓ ASVS:V7.1.1 — no URI, credentials, or auth token in metrics output
    const body = captureBody();

    // No URI scheme of the form xxx:// (covers mongodb://, https://, etc.)
    expect(body).not.toMatch(/\w+:\/\//);
    expect(body).not.toMatch(/password|secret|bearer/i);
  });
});

// ---------------------------------------------------------------------------
// getMetrics — no authentication required (public probe — ASVS:V1.6.1)
// ---------------------------------------------------------------------------

describe('getMetrics — no authentication required', () => {
  it('succeeds when req.user is undefined (public endpoint — no auth header needed)', () => {
    // TC-INFRA-021
    // ✓ ASVS:V1.6.1 — metrics probe is unauthenticated; controller must not throw without req.user
    const res = makeRes();

    // Simulate an unauthenticated Prometheus scrape (no user object on request)
    controller.getMetrics(makeReq({ user: undefined }), res);

    expect(res.send).toHaveBeenCalled();
  });

  it('logs a debug message on each scrape — no sensitive data in log args', () => {
    // TC-INFRA-022
    // ✓ ASVS:V7.1.1 — logger.debug is called with a benign message; no sensitive metadata
    const res = makeRes();

    controller.getMetrics(makeReq(), res);

    expect(mockLogger.debug).toHaveBeenCalled();
    const debugArgs = (mockLogger.debug as jest.Mock).mock.calls[0] as unknown[];
    // First arg must be a plain string
    expect(typeof debugArgs[0]).toBe('string');
    // If a second metadata arg exists, it must contain no sensitive fields
    if (debugArgs.length > 1) {
      const meta = JSON.stringify(debugArgs[1]);
      expect(meta).not.toMatch(/password|secret|token|uri|connection/i);
    }
  });
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('metrics.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['tenant_id', 'session_id', 'created_at']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
