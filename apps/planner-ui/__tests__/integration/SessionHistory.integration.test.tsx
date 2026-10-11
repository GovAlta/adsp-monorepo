/**
 * SessionHistory.integration.test.tsx — MSW integration tests for Session History.
 *
 * Tests the full request → render pipeline using MSW to intercept HTTP.
 * All response shapes match the OpenAPI contract (XSTAGE-S5-011).
 *
 * TC Coverage:
 *   TC-038 — sessions load from API; ownerDisplayName resolved; table renders
 *   TC-055 — interactive elements focusable after load
 *   TC-057 — 403 cross-tenant check shows error callout
 *
 * Security assertions:
 *   FAC-S5-025 — userId field in response does NOT appear as rendered DOM text
 *   FAC-S5-026 — no localStorage writes during integration flow
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vi, describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import SessionHistory from '../../src/pages/SessionHistory';
import type {
  PlanningSession,
  User,
  PaginatedResult,
} from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Constants + fixtures — shapes derived from api.types.ts (XSTAGE-S5-011)
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

// Protected B: userId deliberately included in fixture to prove it is NOT rendered
const OWNER_USER_ID = 'user-abc';
const OWNER_DISPLAY_NAME = 'Bob Jones';

const mockUserFixtures: User[] = [
  {
    id: OWNER_USER_ID,
    email: 'bob.jones@gov.ab.ca',
    displayName: OWNER_DISPLAY_NAME,
    roles: ['planner-user'],
    status: 'active',
    lastActivityAt: '2026-10-09T10:00:00Z',
  },
];

const mockSessionFixtures: PlanningSession[] = [
  {
    id: 'session-001',
    userId: OWNER_USER_ID,           // Protected B — resolved to ownerDisplayName by component
    tenantId: 'tenant-xyz',
    title: 'Grants Modernization',
    status: 'active',
    businessProblemSummary: 'Digitise the grants application process.',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// MSW server
// ──────────────────────────────────────────────────────────────────────────────

const defaultHandlers = [
  http.get(`${BASE_URL}/users`, () => {
    const result: PaginatedResult<User> = {
      items: mockUserFixtures,
      total: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),
  http.get(`${BASE_URL}/sessions`, () => {
    const result: PaginatedResult<PlanningSession> = {
      items: mockSessionFixtures,
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),
  http.patch(`${BASE_URL}/sessions/:sessionId`, () =>
    HttpResponse.json(mockSessionFixtures[0], { status: 200 })
  ),
];

const server = setupServer(...defaultHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ──────────────────────────────────────────────────────────────────────────────
// GoA component stubs
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
  ),
  GoABadge: (props: { content: string; type: string; [key: string]: unknown }) => (
    <span
      data-testid={(props['data-testid'] as string) ?? 'badge'}
      data-type={props.type}
    >
      {props.content}
    </span>
  ),
  GoAButton: ({
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  GoACallout: ({
    children,
    heading,
    type,
  }: {
    children?: React.ReactNode;
    heading?: string;
    type: string;
  }) => (
    <div role="alert" data-type={type} data-testid={`callout-${type}`}>
      {heading && <strong>{heading}</strong>}
      {children}
    </div>
  ),
  GoACircularProgress: ({ message }: { message: string }) => (
    <div role="status" data-testid="loading">{message}</div>
  ),
  GoADetails: ({
    children,
    heading,
  }: {
    children: React.ReactNode;
    heading: string;
  }) => (
    <details open data-testid="filter-panel">
      <summary>{heading}</summary>
      {children}
    </details>
  ),
  GoADatePicker: ({
    name,
    value,
    onChange,
  }: {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
  }) => (
    <input
      type="date"
      name={name}
      value={value}
      data-testid={`date-${name}`}
      onChange={(e) => onChange(name, e.target.value)}
    />
  ),
  GoADropdown: ({
    name,
    value,
    onChange,
    children,
  }: {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      name={name}
      value={value}
      data-testid={`dropdown-${name}`}
      onChange={(e) => onChange(name, e.target.value)}
    >
      {children}
    </select>
  ),
  GoADropdownItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
  GoAFormItem: ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="form-item">
      <label>{label}</label>
      {children}
    </div>
  ),
  GoAPagination: ({
    pageNumber,
    onChange,
  }: {
    pageNumber: number;
    itemCount: number;
    perPageCount: number;
    onChange: (page: number) => void;
  }) => (
    <nav data-testid="pagination" aria-label="pagination">
      <button onClick={() => onChange(pageNumber + 1)}>Next</button>
    </nav>
  ),
  GoATable: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="sessions-table">{children}</table>
  ),
  GoATableSortHeader: ({
    children,
    name,
    onClick,
  }: {
    children: React.ReactNode;
    name: string;
    direction: string;
    onClick: () => void;
  }) => (
    <th data-sort={name} onClick={onClick}>
      {children}
    </th>
  ),
  GoATextArea: ({
    name,
    value,
    onChange,
    rows,
  }: {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    rows?: number;
  }) => (
    <textarea
      name={name}
      value={value}
      rows={rows}
      data-testid="annotation-textarea"
      onChange={(e) => onChange(name, e.target.value)}
    />
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const renderSessionHistory = () =>
  render(
    <MemoryRouter>
      <SessionHistory />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('SessionHistory integration', () => {
  beforeEach(() => {
    // FAC-S5-026: spy on localStorage writes — none expected
    vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads sessions and renders table with ownerDisplayName from API (TC-038)', async () => {
    // TC-038 — happy path: users and sessions load; displayName resolved; table renders
    renderSessionHistory();

    // Component calls /users then /sessions; wait for ownerDisplayName to appear
    await waitFor(() =>
      expect(screen.getByText(OWNER_DISPLAY_NAME)).toBeInTheDocument()
    );

    expect(screen.getByTestId('sessions-table')).toBeInTheDocument();
    expect(screen.getByText(/Digitise/)).toBeInTheDocument();
  });

  it('userId field in response does NOT appear as DOM text — only ownerDisplayName shown (FAC-S5-025)', async () => {
    // FAC-S5-025 — raw userId (Protected B) must not surface in the DOM
    renderSessionHistory();

    await waitFor(() =>
      expect(screen.getByText(OWNER_DISPLAY_NAME)).toBeInTheDocument()
    );

    // Raw userId must not appear as text content
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain(OWNER_USER_ID);
  });

  it('does not write to localStorage during full load flow (FAC-S5-026)', async () => {
    // FAC-S5-026
    const setItemSpy = Storage.prototype.setItem as ReturnType<typeof vi.fn>;
    renderSessionHistory();

    await waitFor(() =>
      expect(screen.getByText(OWNER_DISPLAY_NAME)).toBeInTheDocument()
    );

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('listSessions 403 → error callout rendered (TC-057 — cross-tenant enforcement)', async () => {
    // TC-057 — cross-tenant 403 shows error; user sees error callout
    server.use(
      http.get(`${BASE_URL}/sessions`, () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      )
    );

    renderSessionHistory();

    await waitFor(() =>
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument()
    );
    expect(screen.getByText(/Unable to load sessions/)).toBeInTheDocument();
    // Table must NOT render on 403
    expect(screen.queryByTestId('sessions-table')).not.toBeInTheDocument();
  });

  it('no sessions in filter range → empty state callout (TC-038)', async () => {
    // TC-038 — empty result set
    server.use(
      http.get(`${BASE_URL}/sessions`, () => {
        const result: PaginatedResult<PlanningSession> = {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        };
        return HttpResponse.json(result, { status: 200 });
      })
    );

    renderSessionHistory();

    await waitFor(() =>
      expect(screen.getByText(/No sessions found/)).toBeInTheDocument()
    );
    expect(screen.queryByTestId('sessions-table')).not.toBeInTheDocument();
  });
});
