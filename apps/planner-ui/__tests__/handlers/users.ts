/**
 * handlers/users.ts — MSW request handlers for user management endpoints.
 *
 * Fixtures derived from api.types.ts OpenAPI contract shapes (camelCase).
 * XSTAGE-S5-011: mock shapes MUST match the OpenAPI response schema.
 *
 * user.email is Protected A — included in fixtures so integration tests can
 * assert that masked/unmasked rendering is correct per canUnmask gate (FAC-S5-025).
 */

import { http, HttpResponse } from 'msw';
import type { User, PaginatedResult } from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

// ──────────────────────────────────────────────────────────────────────────────
// User fixtures
// email is Protected A — raw value included so tests can assert it is either:
//   (a) rendered masked (***@gov.ab.ca) when canUnmask=false (planner-admin)
//   (b) rendered full when canUnmask=true (tenant-admin)
//   (c) never written to localStorage/sessionStorage (FAC-S5-026)
// ──────────────────────────────────────────────────────────────────────────────

export const mockUserAdmin: User = {
  id: 'user-admin-001',
  email: 'alice.smith@gov.ab.ca',   // Protected A — masked to planner-admin
  displayName: 'Alice Smith',
  roles: ['planner-admin'],
  status: 'active',
  lastActivityAt: '2026-10-09T10:00:00Z',
};

export const mockUserPlanner: User = {
  id: 'user-abc',
  email: 'bob.jones@gov.ab.ca',     // Protected A — masked to planner-admin
  displayName: 'Bob Jones',
  roles: ['planner-user'],
  status: 'active',
  lastActivityAt: '2026-10-08T09:00:00Z',
};

export const mockUserInactive: User = {
  id: 'user-inactive-001',
  email: 'carol.doe@gov.ab.ca',     // Protected A
  displayName: 'Carol Doe',
  roles: ['planner-user'],
  status: 'inactive',
};

// ──────────────────────────────────────────────────────────────────────────────
// Default MSW handlers for user management endpoints
// ──────────────────────────────────────────────────────────────────────────────

export const userHandlers = [
  // GET /api/v1/users — default: two active users
  http.get(`${BASE_URL}/users`, () => {
    const result: PaginatedResult<User> = {
      items: [mockUserAdmin, mockUserPlanner],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  // POST /api/v1/users — default: user created successfully (TC-036)
  http.post(`${BASE_URL}/users`, () => {
    const newUser: User = {
      id: 'user-new-001',
      email: 'new.user@gov.ab.ca',
      displayName: 'New User',
      roles: ['planner-user'],
      status: 'active',
    };
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // PATCH /api/v1/users/:userId — default: role updated (TC-082)
  http.patch(`${BASE_URL}/users/:userId`, ({ params }) => {
    const { userId } = params as { userId: string };
    const updated: User = {
      ...mockUserAdmin,
      id: userId,
      roles: ['planner-user'],
    };
    return HttpResponse.json(updated, { status: 200 });
  }),

  // DELETE /api/v1/users/:userId — default: user deactivated (TC-036)
  http.delete(`${BASE_URL}/users/:userId`, () =>
    new HttpResponse(null, { status: 204 })
  ),
];
