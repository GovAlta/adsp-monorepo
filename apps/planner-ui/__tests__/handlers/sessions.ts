/**
 * MSW request handlers for the ADSP Planner API — session endpoints.
 *
 * These handlers mock the API contract shapes defined in api.types.ts.
 * All field names are camelCase to match the OpenAPI response schemas
 * (XSTAGE-S5-011: mock fixtures must match the contract shape).
 *
 * Import `server` in integration tests and use `server.use(...)` to override
 * specific handlers for error/edge-case scenarios.
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type {
  PlanningSession,
  ConversationMessage,
  BusinessModel,
  PaginatedResult,
} from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Fixture data — shapes derived from OpenAPI / api.types.ts
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

export const mockSession: PlanningSession = {
  id: 'session-001',
  userId: 'user-abc',      // Protected B — server-side only; never rendered
  tenantId: 'tenant-xyz',  // Protected B — server-side only; never rendered
  title: 'Grants Modernization',
  status: 'active',
  businessProblemSummary: 'Digitise the grants application process for GoA programs.',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-15T14:30:00Z',
  lastResumedAt: '2026-09-15T14:00:00Z',
};

export const mockSessionPaused: PlanningSession = {
  id: 'session-002',
  userId: 'user-abc',
  tenantId: 'tenant-xyz',
  title: 'Notification Service Pilot',
  status: 'paused',
  businessProblemSummary: 'Pilot ADSP notification-service for citizen alerts.',
  createdAt: '2026-08-01T08:00:00Z',
  updatedAt: '2026-08-10T11:00:00Z',
};

export const mockSessionOld: PlanningSession = {
  id: 'session-003',
  userId: 'user-abc',
  tenantId: 'tenant-xyz',
  title: 'Old Idle Session',
  status: 'active',
  businessProblemSummary: 'An idle session from more than 7 days ago.',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

export const mockMessage: ConversationMessage = {
  id: 'msg-001',
  sessionId: 'session-001',
  role: 'assistant',
  content: 'Welcome to your planning session. Please describe your business problem.',
  createdAt: '2026-09-15T14:01:00Z',
  integrationStubbed: true,
};

export const mockBusinessModel: BusinessModel = {
  id: 'bm-001',
  sessionId: 'session-001',
  confidenceScore: 75,
  concepts: [
    {
      id: 'concept-001',
      businessModelId: 'bm-001',
      name: 'Grant Applicant',
      conceptType: 'actor',
      version: 1,
      createdAt: '2026-09-10T10:00:00Z',
      updatedAt: '2026-09-10T10:00:00Z',
    },
  ],
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
};

export const mockBusinessModelLow: BusinessModel = {
  ...mockBusinessModel,
  confidenceScore: 42,
  id: 'bm-low',
};

// ──────────────────────────────────────────────────────────────────────────────
// Default MSW handlers
// ──────────────────────────────────────────────────────────────────────────────

export const handlers = [
  // GET /api/v1/sessions — default success: returns two sessions
  http.get(`${BASE_URL}/sessions`, () => {
    const result: PaginatedResult<PlanningSession> = {
      items: [mockSession, mockSessionPaused],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  // POST /api/v1/sessions — default success: returns new session
  http.post(`${BASE_URL}/sessions`, () => {
    const newSession: PlanningSession = {
      id: 'session-new',
      userId: 'user-abc',
      tenantId: 'tenant-xyz',
      title: 'New Test Session',
      status: 'active',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    };
    return HttpResponse.json(newSession, { status: 201 });
  }),

  // GET /api/v1/sessions/:sessionId — default: returns mockSession
  http.get(`${BASE_URL}/sessions/:sessionId`, ({ params }) => {
    const { sessionId } = params as { sessionId: string };
    if (sessionId === 'session-001') {
      return HttpResponse.json(mockSession, { status: 200 });
    }
    if (sessionId === 'session-notfound') {
      return HttpResponse.json({ message: 'Session not found' }, { status: 404 });
    }
    return HttpResponse.json(mockSession, { status: 200 });
  }),

  // PATCH /api/v1/sessions/:sessionId — default: returns updated session
  http.patch(`${BASE_URL}/sessions/:sessionId`, () => {
    return HttpResponse.json({ ...mockSession, status: 'active' }, { status: 200 });
  }),

  // GET /api/v1/sessions/:sessionId/messages — default: returns one message
  http.get(`${BASE_URL}/sessions/:sessionId/messages`, () => {
    const result: PaginatedResult<ConversationMessage> = {
      items: [mockMessage],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  // POST /api/v1/sessions/:sessionId/messages — default: 200 with new message
  http.post(`${BASE_URL}/sessions/:sessionId/messages`, () => {
    const msg: ConversationMessage = {
      id: 'msg-response-001',
      sessionId: 'session-001',
      role: 'assistant',
      content: 'Stub response from Planning Agent.',
      createdAt: '2026-10-10T00:01:00Z',
      integrationStubbed: true,
    };
    return HttpResponse.json(msg, { status: 200 });
  }),

  // GET /api/v1/sessions/:sessionId/model — default: returns business model
  http.get(`${BASE_URL}/sessions/:sessionId/model`, () => {
    return HttpResponse.json(mockBusinessModel, { status: 200 });
  }),
];

// ──────────────────────────────────────────────────────────────────────────────
// MSW Node server export
// ──────────────────────────────────────────────────────────────────────────────

export const server = setupServer(...handlers);
