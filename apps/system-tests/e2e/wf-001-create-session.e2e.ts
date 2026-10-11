/**
 * wf-001-create-session.e2e.ts — Cross-system E2E: WF-001 Start Planning Session
 *
 * Workflow:   WF-001
 * Use Case:   UC-001 Start Planning Session
 * Journey:    JRN-start-session (GoA Business Analyst)
 * Boundaries: INT-008 (Keycloak JWT stub — test RSA key)
 *             INT-007 (ADSP RabbitMQ — fire-and-forget stub)
 *
 * TC-001: Create new planning session as planner-user
 * TC-002: Re-open existing paused session from session list
 *
 * Vertical path: React UI → POST /api/v1/sessions → MongoDB (Testcontainers)
 *
 * Real dependencies:
 *   - MongoDB: @testcontainers/mongodb (real container, no mock)
 *   - API:     supertest against real Express app (no MSW)
 *
 * Stub dependencies (test-deferred per degrade contract):
 *   - INT-008: replaced by test JWT signed with test RSA key
 *   - INT-007: EventService fire-and-forget stub (no real RabbitMQ)
 */
import type { StartedMongoDBContainer } from '@testcontainers/mongodb'; // real-dep: testcontainers
/** FAC-S7-001: Journey coverage annotation (executable — not comment-only) */
const COVERED_JOURNEYS = ['journey-map-goa-business-analyst'] as const;
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { E2EEnvironment, startTestEnvironment, stopTestEnvironment } from '../config/setup';
import { DEFAULT_PLANNER_USER, DEFAULT_PLANNER_ADMIN, TEST_TENANT_ID, TEST_USER_ID } from '../config/test-jwt-factory';

// ── TEST-DEFERRED failure modes for Stub INTs ────────────────────────────────
// INT-008 (Keycloak): timeout / JWKS unreachable failure mode is TEST-DEFERRED
//   pending promotion of INT-008 from Stub to Live.
// INT-007 (RabbitMQ): publish failure / queue miss failure mode is TEST-DEFERRED
//   pending promotion of INT-007 from Stub to Live.
// One Stub INT whose failure mode is TEST-DEFERRED: see test-maturity-report.json.

let env: E2EEnvironment;

beforeAll(async () => {
  env = await startTestEnvironment();
}, 120_000);

afterAll(async () => {
  await stopTestEnvironment(env);
}, 30_000);

// ============================================================================
// TC-001 — Happy path: create new planning session
// ============================================================================

describe('WF-001 / TC-001: Create new planning session as planner-user (UC-001 main flow)', () => {
  it('POST /api/v1/sessions returns 201 with sessionId and status active', async () => {
    // Arrange
    const body = { title: '[TEST-DATA] E2E Session Alpha' };

    // Act — real HTTP request against real Express app + real MongoDB container
    const res = await env.request
      .post('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send(body);

    // Assert — status code
    expect(res.status).toBe(201);

    // Assert — response body fields
    expect(res.body).toHaveProperty('sessionId');
    expect(typeof res.body.sessionId).toBe('string');
    expect(res.body.status).toBe('active');
    expect(res.body.tenantId).toBe(TEST_TENANT_ID);
    expect(res.body.userId).toBe(TEST_USER_ID);
  });

  it('GET /api/v1/sessions/:sessionId confirms session was persisted to MongoDB', async () => {
    // Arrange — create a session first
    const createRes = await env.request
      .post('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ title: '[TEST-DATA] Persistence Check Session' });
    expect(createRes.status).toBe(201);
    const { sessionId } = createRes.body;

    // Act — retrieve from DB via GET
    const getRes = await env.request
      .get(`/api/v1/sessions/${sessionId}`)
      .set(env.authHeader(DEFAULT_PLANNER_USER));

    // Assert — MongoDB round-trip confirmed
    expect(getRes.status).toBe(200);
    expect(getRes.body.sessionId).toBe(sessionId);
    expect(getRes.body.status).toBe('active');
  });

  it('POST /api/v1/sessions validates title max length (BR-001)', async () => {
    // Negative path: title exceeds 200 characters
    const longTitle = '[TEST-DATA] ' + 'x'.repeat(200);
    const res = await env.request
      .post('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ title: longTitle });

    expect(res.status).toBe(422);
  });

  it('POST /api/v1/sessions without auth returns 401 (INT-008 fail-closed)', async () => {
    // Negative path: no JWT → 401
    const res = await env.request
      .post('/api/v1/sessions')
      .send({ title: '[TEST-DATA] Unauth' });

    expect(res.status).toBe(401);
  });
});

// ============================================================================
// TC-002 — Alternate flow: re-open a paused session
// ============================================================================

describe('WF-001 / TC-002: Re-open paused session from list (UC-001 alternate flow 2a)', () => {
  it('GET /api/v1/sessions lists sessions; PATCH resumes paused session', async () => {
    // Arrange — create a session and then pause it
    const createRes = await env.request
      .post('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ title: '[TEST-DATA] Paused Session Resume' });
    expect(createRes.status).toBe(201);
    const { sessionId } = createRes.body;

    const pauseRes = await env.request
      .patch(`/api/v1/sessions/${sessionId}`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ status: 'paused' });
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.status).toBe('paused');

    // Act — list sessions and find the paused one
    const listRes = await env.request
      .get('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER));
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.items)).toBe(true);
    const found = listRes.body.items.find((s: { sessionId: string }) => s.sessionId === sessionId);
    expect(found).toBeDefined();
    expect(found.status).toBe('paused');

    // Act — resume the paused session
    const resumeRes = await env.request
      .patch(`/api/v1/sessions/${sessionId}`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ status: 'active' });
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.status).toBe('active');
  });

  it('GET /api/v1/sessions/:sessionId for unknown id returns 404', async () => {
    // Negative path: non-existent sessionId
    const res = await env.request
      .get('/api/v1/sessions/non-existent-session-id-e2e')
      .set(env.authHeader(DEFAULT_PLANNER_USER));

    expect(res.status).toBe(404);
  });

  it('planner-user cannot access another tenant session (tenant isolation)', async () => {
    // Negative path: cross-tenant access attempt
    const otherTenantHeader = env.authHeader({
      tenantId: 'other-tenant-xyz',
      userId: TEST_USER_ID,
      roles: ['planner-user'],
    });

    // Create session under DEFAULT tenant
    const createRes = await env.request
      .post('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ title: '[TEST-DATA] Tenant Isolation Test' });
    expect(createRes.status).toBe(201);
    const { sessionId } = createRes.body;

    // Attempt to access with other-tenant JWT
    const crossTenantRes = await env.request
      .get(`/api/v1/sessions/${sessionId}`)
      .set(otherTenantHeader);

    // Should return 404 (not found in other tenant's namespace — BR-001 / CAS:RULE-015)
    expect(crossTenantRes.status).toBe(404);
  });
});
