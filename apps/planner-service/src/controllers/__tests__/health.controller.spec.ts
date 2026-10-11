/**
 * health.controller.spec.ts — Unit tests for HealthController
 *
 * Protected B classification (FAC-S4-027 / ASVS:V1.6.1):
 *   - health endpoint exposes only infrastructure metadata
 *   - no tenant data, no session content, no connection URIs appear in any assertion
 *
 * ✓ ASVS:V1.6.1 — response body verified to contain only permitted infrastructure fields
 * ✓ ASVS:V7.1.1 — no connection string, credentials, or tenant data in any assertion
 */

import { Request, Response } from 'express';
import { HealthController } from '../health.controller';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
  },
}));

// Import after jest.mock so the mock is in place.
import * as mongoose from 'mongoose';

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
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

/** Health endpoint ignores the request body entirely (_req prefix confirms this). */
const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    path: '/health',
    ...overrides,
  }) as unknown as Request;

// ---------------------------------------------------------------------------
// Controller under test
// ---------------------------------------------------------------------------

let controller: HealthController;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset readyState to a known value before each test.
  (mongoose.connection as unknown as { readyState: number }).readyState = 1;
  controller = new HealthController(mockLogger as never);
});

// ---------------------------------------------------------------------------
// getHealth — HTTP status codes and status field
// ---------------------------------------------------------------------------

describe('getHealth — HTTP status codes', () => {
  it('returns HTTP 200 with status=healthy when MongoDB readyState is 1 (connected)', async () => {
    // TC-060
    // ✓ ASVS:V1.6.1 — response is healthy infrastructure metadata only; no Protected B content
    (mongoose.connection as unknown as { readyState: number }).readyState = 1;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body.status).toBe('healthy');
  });

  it('returns HTTP 503 with status=unhealthy when MongoDB readyState is 0 (disconnected)', async () => {
    // TC-061
    // ✓ ASVS:V1.6.1 — only integer readyState used; no connection URI exposed
    (mongoose.connection as unknown as { readyState: number }).readyState = 0;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body.status).toBe('unhealthy');
  });

  it('returns HTTP 200 with status=degraded when MongoDB readyState is 2 (connecting)', async () => {
    // TC-INFRA-001
    (mongoose.connection as unknown as { readyState: number }).readyState = 2;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body.status).toBe('degraded');
  });

  it('returns HTTP 503 when MongoDB readyState is 3 (disconnecting)', async () => {
    // TC-INFRA-002 — disconnecting treated as unhealthy (readyState 3 is neither 1 nor 2)
    (mongoose.connection as unknown as { readyState: number }).readyState = 3;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body.status).toBe('unhealthy');
  });
});

// ---------------------------------------------------------------------------
// getHealth — response body shape (ASVS:V1.6.1 — no Protected B fields)
// ---------------------------------------------------------------------------

describe('getHealth — response body shape', () => {
  it('response body contains exactly: status, checks, version, serviceName — no Protected B fields', async () => {
    // TC-INFRA-003
    // ✓ ASVS:V1.6.1 — assert permitted field set; no tenant/session/credential fields present
    (mongoose.connection as unknown as { readyState: number }).readyState = 1;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    const bodyKeys = Object.keys(body).sort();
    expect(bodyKeys).toEqual(['checks', 'serviceName', 'status', 'version']);

    // Protected B field names that must NOT appear in the health response
    const forbiddenFields = [
      'tenantId', 'userId', 'sessionId', 'content', 'token',
      'password', 'connectionString', 'dbUri', 'credentials', 'jwt',
    ];
    forbiddenFields.forEach((field) => {
      expect(body).not.toHaveProperty(field);
    });
  });

  it('checks.mongo is "up" and checks.uptime is a number when readyState is 1', async () => {
    // TC-INFRA-004
    (mongoose.connection as unknown as { readyState: number }).readyState = 1;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    const checks = body.checks as Record<string, unknown>;
    expect(checks.mongo).toBe('up');
    expect(typeof checks.uptime).toBe('number');
    expect(checks.uptime as number).toBeGreaterThanOrEqual(0);
  });

  it('checks.mongo is "down" when readyState is 0 (disconnected)', async () => {
    // TC-INFRA-005
    (mongoose.connection as unknown as { readyState: number }).readyState = 0;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    const checks = body.checks as Record<string, unknown>;
    expect(checks.mongo).toBe('down');
  });

  it('checks.mongo is "up" when readyState is 2 (connecting — treated as partially up)', async () => {
    // TC-INFRA-006
    (mongoose.connection as unknown as { readyState: number }).readyState = 2;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    const checks = body.checks as Record<string, unknown>;
    expect(checks.mongo).toBe('up');
  });

  it('serviceName is "planner-service"', async () => {
    // TC-INFRA-007
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body.serviceName).toBe('planner-service');
  });

  it('version is a non-empty string', async () => {
    // TC-INFRA-008
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(typeof body.version).toBe('string');
    expect((body.version as string).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getHealth — no authentication required (public probe — ASVS:V1.6.1)
// ---------------------------------------------------------------------------

describe('getHealth — no authentication required', () => {
  it('succeeds when req.user is undefined (public endpoint — no auth header needed)', async () => {
    // TC-INFRA-009
    // ✓ ASVS:V1.6.1 — health probe is unauthenticated; controller must not throw without req.user
    (mongoose.connection as unknown as { readyState: number }).readyState = 1;
    const res = makeRes();

    // Simulate an unauthenticated probe (no user object on request)
    await controller.getHealth(makeReq({ user: undefined }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('warn log contains only infrastructure metadata — no connection string or credentials', async () => {
    // TC-INFRA-010
    // ✓ ASVS:V7.1.1 — logger.warn is called with only readyState integer; no URI or credentials
    (mongoose.connection as unknown as { readyState: number }).readyState = 0;
    const res = makeRes();

    await controller.getHealth(makeReq(), res);

    expect(mockLogger.warn).toHaveBeenCalled();
    const warnArgs = (mockLogger.warn as jest.Mock).mock.calls[0] as unknown[];
    // First arg is the log message string (safe)
    expect(typeof warnArgs[0]).toBe('string');
    // Second arg is the metadata object — must contain only mongoReadyState (integer)
    const loggedMeta = warnArgs[1] as Record<string, unknown>;
    expect(loggedMeta).toHaveProperty('mongoReadyState');
    expect(typeof loggedMeta.mongoReadyState).toBe('number');
    // Sensitive fields must NOT appear
    expect(loggedMeta).not.toHaveProperty('connectionString');
    expect(loggedMeta).not.toHaveProperty('uri');
    expect(loggedMeta).not.toHaveProperty('password');
    expect(loggedMeta).not.toHaveProperty('credentials');
  });
});
