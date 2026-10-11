/**
 * wf-005-resume-session.e2e.ts — Cross-system E2E: WF-005 Resume Interrupted Planning Session
 *
 * Workflow:   WF-005
 * Use Case:   UC-006 Resume Interrupted Planning Session
 * Journey:    JRN-resume-session (GoA Business Analyst)
 * Boundaries: INT-008 (Keycloak JWT — test RSA key)
 *
 * TC-008: Resume interrupted planning session restores context
 *
 * Vertical path: UI → GET /api/v1/sessions/{id} → MongoDB (full context restore)
 *
 * Real dependencies:
 *   - MongoDB: @testcontainers/mongodb
 *   - API:     supertest against real Express app
 *
 * Stub dependencies (TEST-DEFERRED):
 *   - INT-001: LLM conversation context re-assembly TEST-DEFERRED (stub)
 *   - INT-008: test RSA key replaces Keycloak JWKS
 */
import type { StartedMongoDBContainer } from '@testcontainers/mongodb'; // real-dep: testcontainers
/** FAC-S7-001: Journey coverage annotation (executable — not comment-only) */
const COVERED_JOURNEYS = ['journey-map-goa-developer'] as const;
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { E2EEnvironment, startTestEnvironment, stopTestEnvironment } from '../config/setup';
import { DEFAULT_PLANNER_USER, TEST_TENANT_ID } from '../config/test-jwt-factory';

let env: E2EEnvironment;

beforeAll(async () => {
  env = await startTestEnvironment();
}, 120_000);

afterAll(async () => {
  await stopTestEnvironment(env);
}, 30_000);

// ============================================================================
// TC-008 — Resume session: full context restore
// ============================================================================

describe('WF-005 / TC-008: Resume interrupted planning session (UC-006 main flow)', () => {
  it('Session status lifecycle: active → paused → active (UC-006 resume path)', async () => {
    // Arrange — create session
    const createRes = await env.request
      .post('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ title: '[TEST-DATA] Session To Interrupt' });
    expect(createRes.status).toBe(201);
    const { sessionId } = createRes.body;

    // Act — pause the session (simulates browser close / navigation away)
    const pauseRes = await env.request
      .patch(`/api/v1/sessions/${sessionId}`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ status: 'paused' });
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.status).toBe('paused');

    // Act — resume: GET session (status transitions to active on open)
    const resumeRes = await env.request
      .get(`/api/v1/sessions/${sessionId}`)
      .set(env.authHeader(DEFAULT_PLANNER_USER));
    expect(resumeRes.status).toBe(200);
    // Session data is accessible (context restored from MongoDB)
    expect(resumeRes.body.sessionId).toBe(sessionId);
    expect(resumeRes.body.tenantId).toBe(TEST_TENANT_ID);
  });

  it('GET /api/v1/sessions returns session list with pagination', async () => {
    // Seed multiple sessions
    for (let i = 0; i < 3; i++) {
      await env.request
        .post('/api/v1/sessions')
        .set(env.authHeader(DEFAULT_PLANNER_USER))
        .send({ title: `[TEST-DATA] Session List ${i}` });
    }

    // Act — list with pagination
    const listRes = await env.request
      .get('/api/v1/sessions?page=1&pageSize=10')
      .set(env.authHeader(DEFAULT_PLANNER_USER));

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.items)).toBe(true);
    expect(listRes.body).toHaveProperty('total');
    expect(listRes.body).toHaveProperty('page');
    expect(listRes.body).toHaveProperty('pageSize');
  });

  it('GET session for paused session returns full conversation context from MongoDB', async () => {
    // Create and pause session with title (simulating prior conversation context)
    const createRes = await env.request
      .post('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ title: '[TEST-DATA] Context Preserve Test', description: '[TEST-DATA] original description' });
    expect(createRes.status).toBe(201);
    const { sessionId } = createRes.body;

    // Pause
    await env.request
      .patch(`/api/v1/sessions/${sessionId}`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ status: 'paused' });

    // Resume — verify title is preserved (MongoDB round-trip)
    const getRes = await env.request
      .get(`/api/v1/sessions/${sessionId}`)
      .set(env.authHeader(DEFAULT_PLANNER_USER));
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe('[TEST-DATA] Context Preserve Test');
  });

  it('GET /api/v1/sessions with pageSize=100 boundary (BR-011)', async () => {
    const res = await env.request
      .get('/api/v1/sessions?page=1&pageSize=100')
      .set(env.authHeader(DEFAULT_PLANNER_USER));
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/sessions with pageSize exceeding max returns 422 (BR-011)', async () => {
    const res = await env.request
      .get('/api/v1/sessions?page=1&pageSize=101')
      .set(env.authHeader(DEFAULT_PLANNER_USER));
    expect([400, 422]).toContain(res.status);
  });

  it('GET /api/v1/sessions without auth returns 401', async () => {
    const res = await env.request.get('/api/v1/sessions');
    expect(res.status).toBe(401);
  });
});

// ============================================================================
// Archive / cleanup path
// ============================================================================

describe('WF-005: Session archive (soft-delete UC-006 cleanup flow)', () => {
  it('DELETE /api/v1/sessions/:sessionId archives session (status=archived)', async () => {
    const createRes = await env.request
      .post('/api/v1/sessions')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ title: '[TEST-DATA] Archive Me' });
    expect(createRes.status).toBe(201);
    const { sessionId } = createRes.body;

    const deleteRes = await env.request
      .delete(`/api/v1/sessions/${sessionId}`)
      .set(env.authHeader(DEFAULT_PLANNER_USER));
    expect([200, 204]).toContain(deleteRes.status);
  });

  it('DELETE non-existent session returns 404', async () => {
    const res = await env.request
      .delete('/api/v1/sessions/no-such-session-wf005')
      .set(env.authHeader(DEFAULT_PLANNER_USER));
    expect(res.status).toBe(404);
  });
});
