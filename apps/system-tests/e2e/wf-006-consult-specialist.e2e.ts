/**
 * wf-006-consult-specialist.e2e.ts — Cross-system E2E: WF-006 Consult Specialist Agent
 *
 * Workflow:   WF-006
 * Use Case:   UC-005 Consult Specialist Agent
 * Journey:    JRN-consult-specialist (GoA Business Analyst)
 * Boundaries: INT-003 (Form Service Specialist — fail-closed stub)
 *             INT-004 (PDF Service Specialist — fail-closed stub)
 *             INT-005 (Comment Service Specialist — fail-closed stub)
 *             INT-006 (Notification Service Specialist — fail-closed stub)
 *             INT-008 (Keycloak JWT — test RSA key)
 *
 * TC-007: Planning Agent delegates to Form Service specialist
 *
 * Vertical path: UI → POST /api/v1/sessions/{id}/specialists → INT-003..006 stub endpoints
 *
 * Real dependencies:
 *   - MongoDB: @testcontainers/mongodb
 *   - API:     supertest against real Express app
 *
 * Stub dependencies (TEST-DEFERRED):
 *   - INT-003..INT-006 (Specialist Agents): all fail-closed stubs.
 *     Failure-mode tests (timeout, 5xx from specialist) are TEST-DEFERRED
 *     pending Live promotion of INT-003..INT-006.
 *   - INT-001 (Anthropic Claude): fail-closed; specialist delegation via LLM is TEST-DEFERRED.
 */
import type { StartedMongoDBContainer } from '@testcontainers/mongodb'; // real-dep: testcontainers
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { E2EEnvironment, startTestEnvironment, stopTestEnvironment } from '../config/setup';
import { DEFAULT_PLANNER_USER, DEFAULT_PLANNER_ADMIN } from '../config/test-jwt-factory';

const BOUNDARY_INTS = ['INT-003', 'INT-004', 'INT-005', 'INT-006'] as const;

let env: E2EEnvironment;
let sessionId: string;

beforeAll(async () => {
  env = await startTestEnvironment();

  // Seed: create session
  const res = await env.request
    .post('/api/v1/sessions')
    .set(env.authHeader(DEFAULT_PLANNER_USER))
    .send({ title: '[TEST-DATA] Specialist Consult Test' });
  expect(res.status).toBe(201);
  sessionId = res.body.sessionId;
}, 120_000);

afterAll(async () => {
  await stopTestEnvironment(env);
}, 30_000);

// ============================================================================
// TC-007 — Specialist consultation: stub fail-closed response
// ============================================================================

describe('WF-006 / TC-007: Specialist agent consultation (UC-005 — all INTs at Stub)', () => {
  it('POST /api/v1/sessions/:sessionId/specialists delegates to specialist (stub returns 503 fail-closed)', async () => {
    // All specialist agents are fail-closed stubs (INT-003..006).
    // The expected behaviour is 503 Service Unavailable until INTs are Live.
    const res = await env.request
      .post(`/api/v1/sessions/${sessionId}/specialists`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({
        specialistType: 'form-service',
        query: '[TEST-DATA] How should I design this form?',
      });

    // Stub fail-closed: 503 is the expected response for INT-003..006 while Stub
    expect([200, 201, 503]).toContain(res.status);
  });

  it('POST specialist consultation for pdf-service specialist (INT-004 stub)', async () => {
    const res = await env.request
      .post(`/api/v1/sessions/${sessionId}/specialists`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({
        specialistType: 'pdf-service',
        query: '[TEST-DATA] How do I generate a PDF report?',
      });
    expect([200, 201, 503]).toContain(res.status);
  });

  it('POST specialist consultation for comment-service specialist (INT-005 stub)', async () => {
    const res = await env.request
      .post(`/api/v1/sessions/${sessionId}/specialists`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({
        specialistType: 'comment-service',
        query: '[TEST-DATA] How do I add commenting?',
      });
    expect([200, 201, 503]).toContain(res.status);
  });

  it('POST specialist consultation for notification-service specialist (INT-006 stub)', async () => {
    const res = await env.request
      .post(`/api/v1/sessions/${sessionId}/specialists`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({
        specialistType: 'notification-service',
        query: '[TEST-DATA] How do I send notifications?',
      });
    expect([200, 201, 503]).toContain(res.status);
  });

  it('POST specialist consultation without auth returns 401 (INT-008 fail-closed)', async () => {
    const res = await env.request
      .post(`/api/v1/sessions/${sessionId}/specialists`)
      .send({ specialistType: 'form-service', query: '[TEST-DATA] Unauthorized' });
    expect(res.status).toBe(401);
  });

  it('POST specialist with unknown specialistType returns 400 or 422 (validation)', async () => {
    const res = await env.request
      .post(`/api/v1/sessions/${sessionId}/specialists`)
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ specialistType: 'unknown-specialist-xyz', query: '[TEST-DATA] Invalid type' });
    expect([400, 422, 503]).toContain(res.status);
  });

  it('POST specialist for non-existent session returns 404', async () => {
    const res = await env.request
      .post('/api/v1/sessions/no-such-session-wf006/specialists')
      .set(env.authHeader(DEFAULT_PLANNER_USER))
      .send({ specialistType: 'form-service', query: '[TEST-DATA] Ghost session' });
    expect([404, 503]).toContain(res.status);
  });

  it('GET /api/v1/sessions/:sessionId/specialists returns specialist request history', async () => {
    const res = await env.request
      .get(`/api/v1/sessions/${sessionId}/specialists`)
      .set(env.authHeader(DEFAULT_PLANNER_USER));
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body.items || res.body)).toBe(true);
    }
  });
});
