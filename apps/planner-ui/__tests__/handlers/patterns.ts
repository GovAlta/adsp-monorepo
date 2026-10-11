/**
 * MSW request handlers for the ADSP Planner API — pattern endpoints.
 *
 * Fixture shapes are derived from BusinessPattern in api.types.ts.
 * All field names are camelCase to match the OpenAPI response schemas
 * (XSTAGE-S5-011: mock fixtures must match the contract shape).
 *
 * Import `patternsServer` in integration tests, or use `server.use(...)`
 * from the sessions server to layer overrides.
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { BusinessPattern, PaginatedResult } from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Fixture data — shapes derived from OpenAPI / api.types.ts
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

export const mockPatternActive: BusinessPattern = {
  id: 'pattern-001',
  tenantId: 'tenant-xyz',
  name: 'Citizen Notification Workflow',
  description: 'Pattern for citizen-facing notification workflows using the ADSP Notification Service.',
  status: 'active',
  keywords: ['notification', 'citizen', 'alert'],
  serviceAffinity: ['notification-service', 'form-service'],
  matchThreshold: 70,
  matchCount: 12,
  lastModified: '2026-09-20T10:00:00Z',
  createdAt: '2026-08-01T08:00:00Z',
};

export const mockPatternInactive: BusinessPattern = {
  id: 'pattern-002',
  tenantId: 'tenant-xyz',
  name: 'Legacy Document Workflow',
  description: 'Deprecated document handling pattern retained for audit purposes.',
  status: 'inactive',
  keywords: ['document', 'legacy'],
  serviceAffinity: ['file-service'],
  matchThreshold: 60,
  matchCount: 3,
  lastModified: '2026-07-15T14:00:00Z',
  createdAt: '2026-06-01T09:00:00Z',
};

export const mockPatternCreated: BusinessPattern = {
  id: 'pattern-new-001',
  tenantId: 'tenant-xyz',
  name: 'New Test Pattern',
  description: 'A newly created pattern.',
  status: 'active',
  keywords: ['new'],
  serviceAffinity: [],
  matchThreshold: 70,
  matchCount: 0,
  lastModified: '2026-10-10T00:00:00Z',
  createdAt: '2026-10-10T00:00:00Z',
};

// ──────────────────────────────────────────────────────────────────────────────
// Default MSW handlers for pattern endpoints
// ──────────────────────────────────────────────────────────────────────────────

export const patternHandlers = [
  // GET /api/v1/patterns — default: returns two patterns (one active, one inactive)
  http.get(`${BASE_URL}/patterns`, () => {
    const result: PaginatedResult<BusinessPattern> = {
      items: [mockPatternActive, mockPatternInactive],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  // GET /api/v1/patterns/:patternId — default: returns mockPatternActive for 'pattern-001'
  http.get(`${BASE_URL}/patterns/:patternId`, ({ params }) => {
    const { patternId } = params as { patternId: string };
    if (patternId === 'pattern-001') {
      return HttpResponse.json(mockPatternActive, { status: 200 });
    }
    if (patternId === 'pattern-002') {
      return HttpResponse.json(mockPatternInactive, { status: 200 });
    }
    if (patternId === 'pattern-notfound') {
      return HttpResponse.json({ message: 'Pattern not found' }, { status: 404 });
    }
    return HttpResponse.json(mockPatternActive, { status: 200 });
  }),

  // POST /api/v1/patterns — default: returns created pattern
  http.post(`${BASE_URL}/patterns`, () => {
    return HttpResponse.json(mockPatternCreated, { status: 201 });
  }),

  // PUT /api/v1/patterns/:patternId — default: returns updated pattern
  http.put(`${BASE_URL}/patterns/:patternId`, ({ params }) => {
    const { patternId } = params as { patternId: string };
    if (patternId === 'deactivate-only') {
      return HttpResponse.json({ ...mockPatternActive, id: patternId }, { status: 200 });
    }
    return HttpResponse.json({ ...mockPatternActive, id: patternId }, { status: 200 });
  }),

  // PUT /api/v1/patterns/:patternId/deactivate — default: returns deactivated pattern
  http.put(`${BASE_URL}/patterns/:patternId/deactivate`, ({ params }) => {
    const { patternId } = params as { patternId: string };
    return HttpResponse.json(
      { ...mockPatternActive, id: patternId, status: 'inactive' },
      { status: 200 }
    );
  }),
];

// ──────────────────────────────────────────────────────────────────────────────
// MSW Node server export (patterns only — compose with sessions server if needed)
// ──────────────────────────────────────────────────────────────────────────────

export const patternsServer = setupServer(...patternHandlers);
