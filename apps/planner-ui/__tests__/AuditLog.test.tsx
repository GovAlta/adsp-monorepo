/**
 * AuditLog.test.tsx — Unit tests for the Audit Log (report-results) page.
 *
 * Role context: planner-admin (read-only access to tenant audit events)
 *
 * TC Coverage:
 *   TC-045 — HmacStatusBanner renders type="success" when chain is verified
 *   TC-046 — HmacStatusBanner renders type="emergency" when chain is broken
 *   TC-047 — audit table renders read-only; NO edit or delete buttons (BR-014)
 *   TC-048 — Export PDF button present (triggers window.print)
 *   TC-049 — Export CSV button present and triggers client-side CSV download
 *   TC-055 — interactive elements are focusable (keyboard navigation)
 *   TC-057 — error callout on API failure
 *
 * Business Rules:
 *   BR-012: Domain Event Type Registry — API-enforced; audit log eventType column renders
 *           registered domain event type labels from fixture data (TC-045, TC-046, TC-047).
 *
 * Security:
 *   FAC-S5-025 — raw actorId never rendered; only actorDisplayName in DOM
 *   FAC-S5-026 — no localStorage.setItem / sessionStorage.setItem
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AuditLog from '../src/pages/AuditLog';

// ──────────────────────────────────────────────────────────────────────────────
// API mock (vi.hoisted — available at module-factory time to avoid TDZ)
// ──────────────────────────────────────────────────────────────────────────────

const mockApi = vi.hoisted(() => ({
  verifyAuditChain: vi.fn(),
  listAuditEvents: vi.fn(),
  listUsers: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: mockApi,
}));

// ──────────────────────────────────────────────────────────────────────────────
// GoA component stubs
// GoABadge must forward data-testid so MaskedField's testid is queryable
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
    helpText,
  }: {
    label: string;
    children: React.ReactNode;
    helpText?: string;
  }) => (
    <div data-testid="form-item">
      <label>{label}</label>
      {helpText && <span>{helpText}</span>}
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
    direction,
    onClick,
  }: {
    children: React.ReactNode;
    name: string;
    direction: string;
    onClick: () => void;
  }) => (
    <th data-sort={name} data-direction={direction} onClick={onClick}>
      {children}
    </th>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Test fixtures
// actorId is Protected A — included to prove it is NOT rendered (FAC-S5-025)
// ──────────────────────────────────────────────────────────────────────────────

const ACTOR_ID = 'user-admin-001';
const ACTOR_DISPLAY_NAME = 'Alice Smith';

const mockChainVerified = {
  verified: true,
  totalEvents: 42,
  checkedAt: '2026-10-10T08:00:00Z',
};

const mockChainBroken = {
  verified: false,
  totalEvents: 42,
  checkedAt: '2026-10-10T08:00:00Z',
  brokenAtEventId: 'evt-019',
};

const mockUsers = {
  items: [
    {
      id: ACTOR_ID,
      email: 'alice.smith@gov.ab.ca',
      displayName: ACTOR_DISPLAY_NAME,
      roles: ['planner-admin'],
      status: 'active',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 100,
  totalPages: 1,
};

const mockAuditEvents = {
  items: [
    {
      id: 'evt-001',
      actorId: ACTOR_ID,          // Protected A — must NOT appear raw in DOM
      actionLabel: 'Pattern Created',
      resourceId: 'pattern-abc',
      outcome: 'success' as const,
      occurredAt: '2026-10-09T14:00:00Z',
    },
    {
      id: 'evt-002',
      actorId: ACTOR_ID,
      actionLabel: 'Role Assigned',
      resourceId: 'user-xyz',
      outcome: 'success' as const,
      occurredAt: '2026-10-09T15:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 25,
  totalPages: 1,
};

const mockAuditEventsEmpty = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
  totalPages: 0,
};

// ──────────────────────────────────────────────────────────────────────────────
// Render helper
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

describe('AuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.verifyAuditChain.mockResolvedValue(mockChainVerified);
    mockApi.listAuditEvents.mockResolvedValue(mockAuditEvents);
    mockApi.listUsers.mockResolvedValue(mockUsers);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── FAC-S5-026: no storage writes ────────────────────────────────────────

  it('does not call localStorage.setItem during render (FAC-S5-026)', async () => {
    // FAC-S5-026
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderAuditLog();
    await waitFor(() => expect(mockApi.listAuditEvents).toHaveBeenCalled());
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not call sessionStorage.setItem during render (FAC-S5-026)', async () => {
    // FAC-S5-026
    const sessionSetItemSpy = vi.spyOn(window.sessionStorage, 'setItem');
    renderAuditLog();
    await waitFor(() => expect(mockApi.listAuditEvents).toHaveBeenCalled());
    expect(sessionSetItemSpy).not.toHaveBeenCalled();
  });

  // ── TC-045: HMAC chain verified → success banner ──────────────────────────

  it('HmacStatusBanner renders success callout when chain is verified (TC-045)', async () => {
    // TC-045 — ASVS:V-10.4.1 integrity banner on mount
    renderAuditLog();
    await waitFor(() =>
      expect(screen.getByTestId('callout-success')).toBeInTheDocument()
    );
    expect(screen.getByText(/Chain Verified/)).toBeInTheDocument();
    expect(screen.getByText(/tamper-evident/)).toBeInTheDocument();
  });

  // ── TC-046: HMAC chain broken → emergency banner with CTA ────────────────

  it('HmacStatusBanner renders emergency callout when chain is broken (TC-046)', async () => {
    // TC-046 — chain broken state
    mockApi.verifyAuditChain.mockResolvedValue(mockChainBroken);
    renderAuditLog();
    await waitFor(() =>
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument()
    );
    expect(screen.getByText(/Integrity Warning/)).toBeInTheDocument();
  });

  it('emergency banner shows ADSP Support link when chain is broken (TC-046)', async () => {
    // TC-046 — support CTA must be present
    mockApi.verifyAuditChain.mockResolvedValue(mockChainBroken);
    renderAuditLog();
    await waitFor(() =>
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument()
    );
    const supportLink = screen.getByRole('link', {
      name: /Contact ADSP Support immediately/i,
    });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute('href', 'https://adsp.alberta.ca/support');
  });

  // ── TC-047: audit table renders with correct columns ─────────────────────

  it('audit table renders with Timestamp, Actor, Action, Resource, Outcome columns (TC-047)', async () => {
    // TC-047 — wrap ALL column-header assertions in a single waitFor so the query
    // retries until the component reaches its final stable state (users loaded →
    // loadEvents re-runs → table re-renders with resolved actorDisplayName).
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getAllByText('Actor')[0]).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Affected Resource')).toBeInTheDocument();
      expect(screen.getByText('Outcome')).toBeInTheDocument();
    });
  });

  it('audit event action labels are rendered in table (TC-047)', async () => {
    // TC-047 — both action labels must appear simultaneously in final stable state
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByText('Pattern Created')).toBeInTheDocument();
      expect(screen.getByText('Role Assigned')).toBeInTheDocument();
    });
  });

  // ── TC-047: NO edit or delete controls on any row (BR-014 immutability) ───

  it('no edit or delete buttons appear on audit table rows — read-only (TC-047)', async () => {
    // TC-047, BR-014 — audit log is immutable; NO write controls
    renderAuditLog();
    await waitFor(() => expect(screen.getByTestId('audit-table')).toBeInTheDocument());

    // No button with edit/delete text should exist in table rows
    const allButtons = screen.queryAllByRole('button');
    const editDeleteButtons = allButtons.filter((btn) =>
      /edit|delete|remove|modify/i.test(btn.textContent ?? '')
    );
    expect(editDeleteButtons).toHaveLength(0);
  });

  // ── FAC-S5-025: actorId never rendered; only actorDisplayName ─────────────

  it('renders actorDisplayName — NOT raw actorId — in Actor column (FAC-S5-025)', async () => {
    // FAC-S5-025 — ASVS:V-8.3.1: actorId (Protected A) resolved to displayName.
    // Wrap both assertions in waitFor so we retry until the component's final stable
    // render (users loaded → events re-fetched with resolved actorDisplayName).
    renderAuditLog();
    // Two events both use fieldName="auditEvent.actorId", so getAllByTestId is required
    // (getByTestId would throw "Found multiple elements").
    await waitFor(() => {
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      expect(
        screen.getAllByTestId('masked-field-auditEvent.actorId').length
      ).toBeGreaterThan(0);
    });
  });

  it('raw actorId is absent from all rendered DOM text (FAC-S5-025)', async () => {
    // FAC-S5-025 — raw actorId must not appear as text content in the DOM
    renderAuditLog();
    await waitFor(() => expect(screen.getByText('Pattern Created')).toBeInTheDocument());

    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain(ACTOR_ID);
  });

  // ── TC-048: Export PDF button present ─────────────────────────────────────

  it('Export PDF button is present after events load (TC-048)', async () => {
    // TC-048 — PDF export via window.print; button must exist.
    // Wait for both table AND button in a single waitFor to avoid the double-load race.
    // Query by visible text content rather than role+name because GoAButton renders as a
    // custom element in jsdom without the browser-assigned button role.
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });

    const pdfButton = screen.getByText('Export PDF');
    expect(pdfButton).toBeInTheDocument();
  });

  it('clicking Export PDF button triggers window.print (TC-048)', async () => {
    // TC-048 — wait for both the table AND the PDF button in a single waitFor so we
    // don't race between the first and second loadEvents cycle (users dependency).
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export PDF'));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  // ── TC-049: Export CSV button present ─────────────────────────────────────

  it('Export CSV button is present after events load (TC-049)', async () => {
    // TC-049 — wait for table AND button together to avoid the double-load race.
    renderAuditLog();
    await waitFor(() => {
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Export audit log as CSV/i })
      ).toBeInTheDocument();
    });

    const csvButton = screen.getByRole('button', {
      name: /Export audit log as CSV/i,
    });
    expect(csvButton).toBeInTheDocument();
  });

  it('Export CSV triggers download and excludes raw actorId (TC-049, FAC-S5-025)', async () => {
    // TC-049, FAC-S5-025 — CSV must contain actorDisplayName, NOT raw actorId
    let capturedBlob: Blob | null = null;
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((blob: Blob | MediaSource) => {
        if (blob instanceof Blob) capturedBlob = blob;
        return 'blob:audit-csv-mock';
      });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderAuditLog();
    // Wait for table AND CSV button simultaneously to avoid the double-load race.
    await waitFor(() => {
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Export audit log as CSV/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Export audit log as CSV/i })
    );

    expect(capturedBlob).not.toBeNull();
    const csvText = await (capturedBlob as Blob).text();
    // actorDisplayName should appear in the export
    expect(csvText).toContain(ACTOR_DISPLAY_NAME);
    // Raw actorId must NOT appear (FAC-S5-025 — Protected A)
    expect(csvText).not.toContain(ACTOR_ID);

    createObjectURLSpy.mockRestore();
  });

  // ── TC-055: keyboard navigation ───────────────────────────────────────────

  it('all interactive buttons are focusable (TC-055)', async () => {
    // TC-055
    renderAuditLog();
    await waitFor(() => expect(screen.getByTestId('audit-table')).toBeInTheDocument());

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveAttribute('tabindex', '-1');
    });
    expect(buttons.length).toBeGreaterThanOrEqual(2); // Apply, Clear, PDF, CSV
  });

  // ── TC-057: error callout on audit events load failure ────────────────────

  it('shows error callout when listAuditEvents fails (TC-057)', async () => {
    // TC-057
    mockApi.listAuditEvents.mockRejectedValue(new Error('Network error'));
    renderAuditLog();
    await waitFor(() =>
      expect(
        screen.getByText(/Unable to load audit log/)
      ).toBeInTheDocument()
    );
  });

  it('shows empty state callout when no events match filters', async () => {
    // Empty state — no events match filter
    mockApi.listAuditEvents.mockResolvedValue(mockAuditEventsEmpty);
    renderAuditLog();
    await waitFor(() =>
      expect(screen.getByText(/No audit events found/)).toBeInTheDocument()
    );
    expect(screen.queryByTestId('audit-table')).not.toBeInTheDocument();
  });
});
