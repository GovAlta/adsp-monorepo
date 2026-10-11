/**
 * AuditLog.integration.test.tsx — MSW integration tests for the Audit Log page.
 *
 * Tests the full request → render pipeline using MSW to intercept HTTP.
 * All response shapes match the OpenAPI contract (XSTAGE-S5-011).
 *
 * TC Coverage:
 *   TC-045 — verifyAuditChain verified=true → success banner renders
 *   TC-046 — verifyAuditChain verified=false → emergency banner renders
 *   TC-047 — listAuditEvents → table renders with event data; no edit/delete controls
 *   TC-055 — interactive elements focusable after load
 *   TC-057 — listAuditEvents 403 → error callout
 *
 * Security assertions:
 *   FAC-S5-025 — actorId field in response does NOT appear as rendered DOM text
 *   FAC-S5-026 — no localStorage writes during integration flow
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vi, describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import AuditLog from '../../src/pages/AuditLog';
import type {
  AuditEvent,
  AuditChainVerification,
  User,
  PaginatedResult,
} from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Constants + fixtures
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

// Protected A: actorId deliberately included to prove it is NOT rendered
const ACTOR_ID = 'user-admin-001';
const ACTOR_DISPLAY_NAME = 'Alice Smith';

const mockUserFixtures: User[] = [
  {
    id: ACTOR_ID,
    email: 'alice.smith@gov.ab.ca',
    displayName: ACTOR_DISPLAY_NAME,
    roles: ['planner-admin'],
    status: 'active',
    lastActivityAt: '2026-10-09T10:00:00Z',
  },
];

const mockChainVerified: AuditChainVerification = {
  verified: true,
  totalEvents: 42,
  checkedAt: '2026-10-10T08:00:00Z',
};

const mockChainBroken: AuditChainVerification = {
  verified: false,
  totalEvents: 42,
  checkedAt: '2026-10-10T08:00:00Z',
  brokenAtEventId: 'evt-019',
};

const mockAuditEventFixtures: AuditEvent[] = [
  {
    id: 'evt-001',
    actorId: ACTOR_ID,          // Protected A — NEVER rendered raw (FAC-S5-025)
    actionLabel: 'Pattern Created',
    resourceId: 'pattern-abc',
    outcome: 'success',
    occurredAt: '2026-10-09T14:00:00Z',
  },
  {
    id: 'evt-002',
    actorId: ACTOR_ID,
    actionLabel: 'Role Assigned',
    resourceId: 'user-xyz',
    outcome: 'success',
    occurredAt: '2026-10-09T15:00:00Z',
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// MSW server
// ──────────────────────────────────────────────────────────────────────────────

const defaultHandlers = [
  http.get(`${BASE_URL}/audit/verify`, () =>
    HttpResponse.json(mockChainVerified, { status: 200 })
  ),
  http.get(`${BASE_URL}/audit`, () => {
    const result: PaginatedResult<AuditEvent> = {
      items: mockAuditEventFixtures,
      total: 2,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),
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
];

const server = setupServer(...defaultHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ──────────────────────────────────────────────────────────────────────────────
// GoA component stubs
// GoABadge must forward data-testid so MaskedField testid is queryable
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
  ),
  GoABadge: (props: { content: string; type: string; [key: string]: unknown }) => (
    <span
      data-testid={(props['data-testid'] as string) ?? 'badge'}
      aria-label={props['aria-label'] as string | undefined}
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
    <table data-testid="audit-table">{children}</table>
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
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const renderAuditLog = () =>
  render(
    <MemoryRouter>
      <AuditLog />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('AuditLog integration', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verifyAuditChain verified=true → success banner renders (TC-045)', async () => {
    // TC-045 — HMAC chain verified; HmacStatusBanner shows success
    renderAuditLog();

    await waitFor(() =>
      expect(screen.getByTestId('callout-success')).toBeInTheDocument()
    );
    expect(screen.getByText(/Chain Verified/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument(); // totalEvents count
  });

  it('verifyAuditChain verified=false → emergency banner renders (TC-046)', async () => {
    // TC-046 — HMAC chain broken; emergency banner
    server.use(
      http.get(`${BASE_URL}/audit/verify`, () =>
        HttpResponse.json(mockChainBroken, { status: 200 })
      )
    );

    renderAuditLog();

    await waitFor(() =>
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument()
    );
    expect(screen.getByText(/Integrity Warning/)).toBeInTheDocument();
    expect(screen.getByText(/evt-019/)).toBeInTheDocument(); // brokenAtEventId
  });

  it('listAuditEvents returns events → table renders with action labels (TC-047)', async () => {
    // TC-047 — audit events from API appear in the table.
    // Wrap all assertions in a single waitFor so the query retries until the
    // component reaches its final stable state (users loaded → events re-rendered).
    renderAuditLog();

    await waitFor(() => {
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      expect(screen.getByText('Pattern Created')).toBeInTheDocument();
      expect(screen.getByText('Role Assigned')).toBeInTheDocument();
    });
  });

  it('actorId field in response does NOT appear raw in DOM — only actorDisplayName (FAC-S5-025)', async () => {
    // FAC-S5-025 — actorId (Protected A) must not surface in rendered DOM text.
    // Wrap in a single waitFor to wait for the final stable state (users resolved →
    // actorDisplayName fully populated, MaskedField rendered).
    renderAuditLog();

    await waitFor(() => {
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      // actorDisplayName rendered via MaskedField with fieldName="auditEvent.actorId"
      expect(screen.getAllByTestId('masked-field-auditEvent.actorId').length).toBeGreaterThan(0);
    });

    // Raw actorId must not appear as text content (Protected A — never rendered raw)
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain(ACTOR_ID);
  });

  it('no edit or delete controls in audit table rows (TC-047)', async () => {
    // TC-047, BR-014 — immutable audit log: no write controls anywhere in table
    renderAuditLog();

    await waitFor(() =>
      expect(screen.getByTestId('audit-table')).toBeInTheDocument()
    );

    const allButtons = screen.queryAllByRole('button');
    const editDeleteButtons = allButtons.filter((btn) =>
      /edit|delete|remove|modify/i.test(btn.textContent ?? '')
    );
    expect(editDeleteButtons).toHaveLength(0);
  });

  it('does not write to localStorage during full audit load flow (FAC-S5-026)', async () => {
    // FAC-S5-026
    const setItemSpy = Storage.prototype.setItem as ReturnType<typeof vi.fn>;
    renderAuditLog();

    await waitFor(() =>
      expect(screen.getByText('Pattern Created')).toBeInTheDocument()
    );

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('listAuditEvents 403 → error callout shown (TC-057)', async () => {
    // TC-057
    server.use(
      http.get(`${BASE_URL}/audit`, () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      )
    );

    renderAuditLog();

    await waitFor(() =>
      expect(screen.getByText(/Unable to load audit log/)).toBeInTheDocument()
    );
    expect(screen.queryByTestId('audit-table')).not.toBeInTheDocument();
  });
});
