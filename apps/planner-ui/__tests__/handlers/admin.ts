/**
 * MSW request handlers for the ADSP Planner API — admin endpoints.
 *
 * Covers: listAuditEvents (GET /audit), listSessions aggregate stats,
 * and the AdminHub stats aggregate (listPatterns + listSessions + listAuditEvents
 * with pageSize=1 for badge counts).
 *
 * All field names are camelCase to match the OpenAPI response schemas
 * (XSTAGE-S5-011: mock fixtures must match the contract shape).
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type {
  AuditEvent,
  PlanningSession,
  BusinessPattern,
  PaginatedResult,
} from '../../src/services/api.types';
import { mockPatternActive, mockPatternInactive } from './patterns';

// ──────────────────────────────────────────────────────────────────────────────
// Fixture data — shapes derived from OpenAPI / api.types.ts
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

export const mockAuditEvent: AuditEvent = {
  id: 'audit-001',
  tenantId: 'tenant-xyz',
  actorId: 'user-abc',          // Protected A — never rendered raw in UI
  actionLabel: 'PATTERN_CREATED',
  resourceType: 'pattern',
  resourceId: 'pattern-001',
  outcome: 'success',
  hmacHash: 'abc123def456',
  occurredAt: '2026-09-20T10:00:00Z',
};

export const mockAuditEventDeactivate: AuditEvent = {
  id: 'audit-002',
  tenantId: 'tenant-xyz',
  actorId: 'user-abc',
  actionLabel: 'PATTERN_DEACTIVATED',
  resourceType: 'pattern',
  resourceId: 'pattern-002',
  outcome: 'success',
  hmacHash: 'def789ghi012',
  occurredAt: '2026-10-01T12:00:00Z',
};

export const mockAdminSession: PlanningSession = {
  id: 'session-admin-001',
  userId: 'user-abc',
  tenantId: 'tenant-xyz',
  title: 'Admin-visible Session',
  status: 'active',
  businessProblemSummary: 'An admin-visible planning session.',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-15T14:30:00Z',
};

// ──────────────────────────────────────────────────────────────────────────────
// Default MSW handlers for admin/audit endpoints
// ──────────────────────────────────────────────────────────────────────────────

export const adminHandlers = [
  // GET /api/v1/audit — default: returns two audit events
  http.get(`${BASE_URL}/audit`, () => {
    const result: PaginatedResult<AuditEvent> = {
      items: [mockAuditEvent, mockAuditEventDeactivate],
      total: 47,
      page: 1,
      pageSize: 25,
      totalPages: 2,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  // GET /api/v1/patterns (pageSize=1) — used by AdminHub for stats badge count
  // Note: full listPatterns handler is in patterns.ts; this handler handles
  // both pageSize=1 (stats) and larger pageSize (list) by checking the URL query.
  http.get(`${BASE_URL}/patterns`, ({ request }) => {
    const url = new URL(request.url);
    const pageSize = url.searchParams.get('pageSize');
    if (pageSize === '1') {
      // Stats badge call — return only total count, minimal item set
      const result: PaginatedResult<BusinessPattern> = {
        items: [mockPatternActive],
        total: 7,
        page: 1,
        pageSize: 1,
        totalPages: 7,
      };
      return HttpResponse.json(result, { status: 200 });
    }
    // Full list call
    const result: PaginatedResult<BusinessPattern> = {
      items: [mockPatternActive, mockPatternInactive],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  // GET /api/v1/sessions (pageSize=1) — used by AdminHub for stats badge count
  http.get(`${BASE_URL}/sessions`, ({ request }) => {
    const url = new URL(request.url);
    const pageSize = url.searchParams.get('pageSize');
    if (pageSize === '1') {
      const result: PaginatedResult<PlanningSession> = {
        items: [mockAdminSession],
        total: 23,
        page: 1,
        pageSize: 1,
        totalPages: 23,
      };
      return HttpResponse.json(result, { status: 200 });
    }
    const result: PaginatedResult<PlanningSession> = {
      items: [mockAdminSession],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  // GET /api/v1/audit (pageSize=1) — used by AdminHub for stats badge count
  // The generic /audit handler above covers both pageSize=1 and default;
  // here we keep it separate for clarity if the integration test overrides it.
];

// ──────────────────────────────────────────────────────────────────────────────
// MSW Node server export (admin handlers only)
// ──────────────────────────────────────────────────────────────────────────────

export const adminServer = setupServer(...adminHandlers);
