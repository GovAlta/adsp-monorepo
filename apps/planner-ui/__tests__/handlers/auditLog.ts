/**
 * handlers/auditLog.ts — MSW request handlers for audit endpoints.
 *
 * Fixtures derived from api.types.ts OpenAPI contract shapes (camelCase).
 * XSTAGE-S5-011: mock shapes MUST match the OpenAPI response schema.
 *
 * actorId is Protected A (GoA employee userId) — always resolved to
 * actorDisplayName in the UI. The fixture deliberately includes raw actorId
 * so integration tests can assert it is NOT rendered (FAC-S5-025).
 */

import { http, HttpResponse } from 'msw';
import type {
  AuditEvent,
  AuditChainVerification,
  User,
  PaginatedResult,
} from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

// ──────────────────────────────────────────────────────────────────────────────
// HMAC chain fixtures
// ──────────────────────────────────────────────────────────────────────────────

/** TC-045: verified chain — HmacStatusBanner should render with type="success" */
export const mockAuditChainVerified: AuditChainVerification = {
  verified: true,
  totalEvents: 42,
  checkedAt: '2026-10-10T08:00:00Z',
};

/** TC-046: broken chain — HmacStatusBanner should render with type="emergency" */
export const mockAuditChainBroken: AuditChainVerification = {
  verified: false,
  totalEvents: 42,
  checkedAt: '2026-10-10T08:00:00Z',
  brokenAtEventId: 'evt-019',
};

// ──────────────────────────────────────────────────────────────────────────────
// Audit event fixtures
// actorId is Protected A — raw value deliberately included to prove it never
// appears in rendered DOM (security test assertion: FAC-S5-025)
// ──────────────────────────────────────────────────────────────────────────────

export const mockAuditEvent1: AuditEvent = {
  id: 'evt-001',
  actorId: 'user-admin-001',   // Protected A — NEVER rendered raw; resolved to actorDisplayName
  actionLabel: 'Pattern Created',
  resourceId: 'pattern-abc',
  outcome: 'success',
  occurredAt: '2026-10-09T14:00:00Z',
};

export const mockAuditEvent2: AuditEvent = {
  id: 'evt-002',
  actorId: 'user-admin-002',   // Protected A — NEVER rendered raw; resolved to actorDisplayName
  actionLabel: 'Role Assigned',
  resourceId: 'user-xyz',
  outcome: 'success',
  occurredAt: '2026-10-09T15:00:00Z',
};

// ──────────────────────────────────────────────────────────────────────────────
// User fixtures — needed so AuditLog component can resolve actorDisplayName
// (the component calls api.listUsers to build actorId → displayName map)
// ──────────────────────────────────────────────────────────────────────────────

export const mockAuditActorUser1: User = {
  id: 'user-admin-001',
  email: 'alice.smith@gov.ab.ca',
  displayName: 'Alice Smith',
  roles: ['planner-admin'],
  status: 'active',
  lastActivityAt: '2026-10-09T10:00:00Z',
};

export const mockAuditActorUser2: User = {
  id: 'user-admin-002',
  email: 'bob.jones@gov.ab.ca',
  displayName: 'Bob Jones',
  roles: ['planner-admin'],
  status: 'active',
  lastActivityAt: '2026-10-08T09:00:00Z',
};

// ──────────────────────────────────────────────────────────────────────────────
// Default MSW handlers for audit endpoints
// ──────────────────────────────────────────────────────────────────────────────

export const auditHandlers = [
  // GET /api/v1/audit/verify — default: chain verified (TC-045)
  http.get(`${BASE_URL}/audit/verify`, () =>
    HttpResponse.json(mockAuditChainVerified, { status: 200 })
  ),

  // GET /api/v1/audit — default: two events (TC-047)
  http.get(`${BASE_URL}/audit`, () => {
    const result: PaginatedResult<AuditEvent> = {
      items: [mockAuditEvent1, mockAuditEvent2],
      total: 2,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  // GET /api/v1/users — needed by AuditLog for actorId → displayName resolution
  http.get(`${BASE_URL}/users`, () => {
    const result: PaginatedResult<User> = {
      items: [mockAuditActorUser1, mockAuditActorUser2],
      total: 2,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),
];
