/**
 * MSW request handlers — hypotheses and exports endpoints.
 *
 * Fixture shapes are derived from OpenAPI / api.types.ts (XSTAGE-S5-011:
 * mock fixtures must match the OpenAPI contract shape).
 *
 * These handlers are used as `server.use(...)` overrides in integration tests;
 * they do NOT create their own server instance (the global server is in sessions.ts).
 */

import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3000/api/v1';

// ──────────────────────────────────────────────────────────────────────────────
// SolutionHypothesis fixtures — camelCase per OpenAPI contract (XSTAGE-S5-011)
// ──────────────────────────────────────────────────────────────────────────────

/** Hypothesis in proposed state — triggers unlocked view + accept button (TC-022) */
export const mockHypothesisProposed = {
  id: 'hyp-001',
  sessionId: 'session-001',
  status: 'proposed' as const,
  summary:
    'Deploy form-service and notification-service to modernise the grants application process.',
  reasoning:
    'The form-service provides structured data collection aligned with GoA standards. The notification-service handles citizen alerts and acknowledgements.',
  version: 1,
  patternId: 'pattern-grants-digitisation',
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
};

/** Hypothesis in accepted state — enables export button on SessionExport (TC-030) */
export const mockHypothesisAccepted = {
  ...mockHypothesisProposed,
  id: 'hyp-001-accepted',
  status: 'accepted' as const,
  updatedAt: '2026-09-21T09:00:00Z',
};

// ──────────────────────────────────────────────────────────────────────────────
// SessionExport fixture — camelCase per OpenAPI contract (XSTAGE-S5-011)
// ──────────────────────────────────────────────────────────────────────────────

/** Export record returned by POST /exports (TC-034) */
export const mockSessionExportRecord = {
  id: 'export-001',
  sessionId: 'session-001',
  format: 'json' as const,
  status: 'completed',
  downloadUrl: 'http://localhost:3000/downloads/export-001.json',
  createdAt: '2026-10-01T10:00:00Z',
};

// ──────────────────────────────────────────────────────────────────────────────
// MSW handler overrides — hypotheses
// ──────────────────────────────────────────────────────────────────────────────

/** GET /sessions/:id/hypotheses — one proposed hypothesis (unlocked state) */
export const hypothesisProposedHandler = http.get(
  `${BASE_URL}/sessions/:sessionId/hypotheses`,
  () =>
    HttpResponse.json(
      { items: [mockHypothesisProposed], total: 1, page: 1, pageSize: 20, totalPages: 1 },
      { status: 200 },
    ),
);

/** GET /sessions/:id/hypotheses — one accepted hypothesis */
export const hypothesisAcceptedHandler = http.get(
  `${BASE_URL}/sessions/:sessionId/hypotheses`,
  () =>
    HttpResponse.json(
      { items: [mockHypothesisAccepted], total: 1, page: 1, pageSize: 20, totalPages: 1 },
      { status: 200 },
    ),
);

/** GET /sessions/:id/hypotheses — empty list (no hypothesis, locked state) */
export const hypothesisLockedHandler = http.get(
  `${BASE_URL}/sessions/:sessionId/hypotheses`,
  () =>
    HttpResponse.json(
      { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
      { status: 200 },
    ),
);

/** GET /sessions/:id/hypotheses — 503 service unavailable */
export const hypothesis503Handler = http.get(
  `${BASE_URL}/sessions/:sessionId/hypotheses`,
  () => HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 }),
);

/** POST /sessions/:id/hypotheses/generate — triggers hypothesis generation (TC-021) */
export const hypothesisGenerateHandler = http.post(
  `${BASE_URL}/sessions/:sessionId/hypotheses/generate`,
  () =>
    HttpResponse.json(
      { ...mockHypothesisProposed, id: 'hyp-draft-001', status: 'draft' },
      { status: 202 },
    ),
);

/** PATCH /sessions/:id/hypotheses/:id — accepts and returns accepted hypothesis (TC-022) */
export const hypothesisPatchAcceptHandler = http.patch(
  `${BASE_URL}/sessions/:sessionId/hypotheses/:hypothesisId`,
  () => HttpResponse.json(mockHypothesisAccepted, { status: 200 }),
);

// ──────────────────────────────────────────────────────────────────────────────
// MSW handler overrides — exports
// ──────────────────────────────────────────────────────────────────────────────

/** POST /sessions/:id/exports — returns export record with downloadUrl (TC-034) */
export const initiateExportHandler = http.post(
  `${BASE_URL}/sessions/:sessionId/exports`,
  () => HttpResponse.json(mockSessionExportRecord, { status: 201 }),
);

/** POST /sessions/:id/exports — 503 error */
export const initiateExport503Handler = http.post(
  `${BASE_URL}/sessions/:sessionId/exports`,
  () => HttpResponse.json({ message: 'Export service unavailable' }, { status: 503 }),
);
