/**
 * MSW request handlers — business model endpoints.
 *
 * Fixture shapes are derived from OpenAPI / api.types.ts (XSTAGE-S5-011:
 * mock fixtures must match the OpenAPI contract shape).
 *
 * Usage in integration tests:
 *   server.use(businessModelGetLowConfHandler);  // override for a single test
 *   afterEach(() => server.resetHandlers());      // restore defaults
 */

import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3000/api/v1';

// ──────────────────────────────────────────────────────────────────────────────
// Concept fixtures
// ──────────────────────────────────────────────────────────────────────────────

export const mockConceptActor = {
  id: 'concept-001',
  businessModelId: 'bm-001',
  name: 'Grant Applicant',
  conceptType: 'actor' as const,
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
};

export const mockConceptProcess = {
  id: 'concept-002',
  businessModelId: 'bm-001',
  name: 'Application Processing',
  description: 'The process of reviewing grant applications.',
  conceptType: 'process' as const,
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
};

export const mockConceptSystem = {
  id: 'concept-003',
  businessModelId: 'bm-001',
  name: 'Grants Management System',
  conceptType: 'system' as const,
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
};

// ──────────────────────────────────────────────────────────────────────────────
// Business model fixtures — camelCase per OpenAPI contract (XSTAGE-S5-011)
// ──────────────────────────────────────────────────────────────────────────────

/** High-confidence model with one concept per tab category */
export const mockBusinessModelFull = {
  id: 'bm-001',
  sessionId: 'session-001',
  confidenceScore: 75,
  problemSummary: 'Digitise the grants application process for GoA programs.',
  concepts: [mockConceptActor, mockConceptProcess, mockConceptSystem],
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
};

/** Low-confidence model — triggers emergency callout (TC-021) */
export const mockBusinessModelLowConf = {
  ...mockBusinessModelFull,
  id: 'bm-low',
  confidenceScore: 40,
};

/** Moderate-confidence model — triggers warning callout (TC-021) */
export const mockBusinessModelModerate = {
  ...mockBusinessModelFull,
  id: 'bm-mod',
  confidenceScore: 60,
};

/** Empty concepts model — triggers empty state callout (TC-025) */
export const mockBusinessModelEmpty = {
  ...mockBusinessModelFull,
  id: 'bm-empty',
  confidenceScore: 80,
  concepts: [],
};

// ──────────────────────────────────────────────────────────────────────────────
// MSW handler overrides
// ──────────────────────────────────────────────────────────────────────────────

/** GET /sessions/:id/model — returns full high-confidence model */
export const businessModelGetSuccessHandler = http.get(
  `${BASE_URL}/sessions/:sessionId/model`,
  () => HttpResponse.json(mockBusinessModelFull, { status: 200 }),
);

/** GET /sessions/:id/model — returns low-confidence model (confidence=40) */
export const businessModelGetLowConfHandler = http.get(
  `${BASE_URL}/sessions/:sessionId/model`,
  () => HttpResponse.json(mockBusinessModelLowConf, { status: 200 }),
);

/** GET /sessions/:id/model — returns model with empty concepts array */
export const businessModelGetEmptyHandler = http.get(
  `${BASE_URL}/sessions/:sessionId/model`,
  () => HttpResponse.json(mockBusinessModelEmpty, { status: 200 }),
);

/** PATCH /sessions/:id/model — returns updated full model */
export const businessModelPatchHandler = http.patch(
  `${BASE_URL}/sessions/:sessionId/model`,
  () => HttpResponse.json(mockBusinessModelFull, { status: 200 }),
);
