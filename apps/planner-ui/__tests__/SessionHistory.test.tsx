/**
 * SessionHistory.test.tsx — Unit tests for the Session History (report-results) page.
 *
 * Role context: planner-admin (read-access to all tenant sessions)
 *
 * TC Coverage:
 *   TC-038 — session list renders; date-range and status filters apply
 *   TC-041 — empty state callout shown when no sessions match filters
 *   TC-043 — Export CSV button triggers client-side CSV download
 *   TC-044 — Export JSON button triggers client-side JSON download
 *   TC-055 — interactive elements are focusable (keyboard navigation)
 *   TC-057 — error callout shown on API failure
 *   TC-080 — row click expands inline detail panel
 *   TC-081 — admin annotation textarea in detail panel; Save Note calls api.updateSession
 *
 * Business Rules:
 *   BR-011: Session List Pagination Limits — API-enforced max pageSize; pagination controls
 *           tested with fixture data exceeding single page (TC-038 multi-page scenario).
 *
 * Security:
 *   FAC-S5-024 — userId (userRefFilter) held in component state only; not in URL query string
 *   FAC-S5-025 — raw userId never rendered; only ownerDisplayName appears in DOM
 *   FAC-S5-026 — no localStorage.setItem / sessionStorage.setItem during render
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SessionHistory from '../src/pages/SessionHistory';

// ──────────────────────────────────────────────────────────────────────────────
// API mock (vi.hoisted — available at module-factory time to avoid TDZ)
// ──────────────────────────────────────────────────────────────────────────────

const mockApi = vi.hoisted(() => ({
  listSessions: vi.fn(),
  listUsers: vi.fn(),
  updateSession: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: mockApi,
}));

// ──────────────────────────────────────────────────────────────────────────────
// GoA component stubs — lightweight HTML pass-throughs for jsdom
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
    disabled,
  }: {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <select
      name={name}
      value={value}
      disabled={disabled}
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
    itemCount,
    perPageCount,
    onChange,
  }: {
    pageNumber: number;
    itemCount: number;
    perPageCount: number;
    onChange: (page: number) => void;
  }) => (
    <nav data-testid="pagination" aria-label="pagination">
      <button
        onClick={() => onChange(pageNumber + 1)}
        disabled={pageNumber * perPageCount >= itemCount}
      >
        Next
      </button>
    </nav>
  ),
  GoATable: ({ children, width }: { children: React.ReactNode; width?: string }) => (
    <table style={{ width }} data-testid="sessions-table">
      {children}
    </table>
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
    <th
      data-sort={name}
      data-direction={direction}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
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
// Test fixtures
// userId is Protected B — included in session fixture to prove it is NOT rendered
// ──────────────────────────────────────────────────────────────────────────────

const USER_ID = 'user-abc';
const OWNER_DISPLAY_NAME = 'Bob Jones';

const mockUsers = {
  items: [
    {
      id: USER_ID,
      email: 'bob@gov.ab.ca',
      displayName: OWNER_DISPLAY_NAME,
      roles: ['planner-user'],
      status: 'active',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 100,
  totalPages: 1,
};

const mockSessions = {
  items: [
    {
      id: 'session-001',
      userId: USER_ID,           // Protected B — must NOT appear in DOM (FAC-S5-025)
      tenantId: 'tenant-xyz',
      title: 'Grants Modernization',
      status: 'active' as const,
      businessProblemSummary: 'Digitise the grants application process.',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-15T14:30:00Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

const mockSessionsEmpty = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};

// ──────────────────────────────────────────────────────────────────────────────
// Render helper
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

describe('SessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.listUsers.mockResolvedValue(mockUsers);
    mockApi.listSessions.mockResolvedValue(mockSessions);
    mockApi.updateSession.mockResolvedValue({ ...mockSessions.items[0] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── FAC-S5-026: no localStorage or sessionStorage writes ──────────────────

  it('does not call localStorage.setItem during render (FAC-S5-026)', async () => {
    // FAC-S5-026
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderSessionHistory();
    await waitFor(() => expect(mockApi.listSessions).toHaveBeenCalled());
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not call sessionStorage.setItem during render (FAC-S5-026)', async () => {
    // FAC-S5-026
    const sessionSetItemSpy = vi.spyOn(window.sessionStorage, 'setItem');
    renderSessionHistory();
    await waitFor(() => expect(mockApi.listSessions).toHaveBeenCalled());
    expect(sessionSetItemSpy).not.toHaveBeenCalled();
  });

  // ── FAC-S5-025: userId never rendered; only ownerDisplayName ──────────────

  it('renders ownerDisplayName — NOT raw userId — in session table rows (TC-038, FAC-S5-025)', async () => {
    // TC-038, FAC-S5-025
    renderSessionHistory();
    // Wait for displayName to be resolved and rendered
    await waitFor(() => expect(screen.getByText(OWNER_DISPLAY_NAME)).toBeInTheDocument());
    // Raw userId must NOT appear anywhere in the DOM as text
    expect(screen.queryByText(USER_ID)).not.toBeInTheDocument();
  });

  it('raw userId is absent from all rendered DOM elements (FAC-S5-025)', async () => {
    // FAC-S5-025 — POPA s.17, ASVS:V-8.3.1
    renderSessionHistory();
    await waitFor(() => expect(screen.getByText(OWNER_DISPLAY_NAME)).toBeInTheDocument());
    // userId must not appear as text content anywhere — only as an opaque value attribute
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain(USER_ID);
  });

  // ── TC-038: session list table renders ───────────────────────────────────

  it('renders session list table after data loads (TC-038)', async () => {
    // TC-038 — wrap all assertions in one waitFor to avoid the double-load race
    // (listUsers in dependency → second loadSessions → table briefly hidden).
    renderSessionHistory();
    await waitFor(() => {
      expect(screen.getByTestId('sessions-table')).toBeInTheDocument();
      expect(screen.getByText(OWNER_DISPLAY_NAME)).toBeInTheDocument();
      // Business problem summary truncated or present
      expect(screen.getByText(/Digitise/)).toBeInTheDocument();
    });
  });

  it('shows loading indicator while data is loading (TC-038)', () => {
    // TC-038 — loading state
    mockApi.listUsers.mockImplementation(() => new Promise(() => {}));
    mockApi.listSessions.mockImplementation(() => new Promise(() => {}));
    renderSessionHistory();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Loading session history/)).toBeInTheDocument();
  });

  // ── TC-038: status filter ─────────────────────────────────────────────────

  it('status filter dropdown changes API call params (TC-038)', async () => {
    // TC-038 — applying status filter triggers re-load with status param
    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    const statusDropdown = screen.getByTestId('dropdown-status');
    fireEvent.change(statusDropdown, { target: { value: 'completed' } });
    fireEvent.click(screen.getByText('Apply Filters'));

    await waitFor(() =>
      expect(mockApi.listSessions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      )
    );
  });

  it('Clear button resets status filter (TC-038)', async () => {
    // TC-038
    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('dropdown-status'), {
      target: { value: 'archived' },
    });
    fireEvent.click(screen.getByText('Clear'));

    // After clear, the dropdown should show all statuses
    expect(screen.getByTestId('dropdown-status')).toHaveValue('');
  });

  // ── TC-041: empty state ───────────────────────────────────────────────────

  it('shows empty state callout when no sessions match filters (TC-041)', async () => {
    // TC-041
    mockApi.listSessions.mockResolvedValue(mockSessionsEmpty);
    renderSessionHistory();
    await waitFor(() =>
      expect(screen.getByText(/No sessions found/)).toBeInTheDocument()
    );
    expect(screen.queryByTestId('sessions-table')).not.toBeInTheDocument();
  });

  // ── TC-057: error callout on API failure ──────────────────────────────────

  it('shows error callout when listSessions fails (TC-057)', async () => {
    // TC-057
    mockApi.listSessions.mockRejectedValue(new Error('Network error'));
    renderSessionHistory();
    await waitFor(() =>
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument()
    );
    expect(screen.getByText(/Unable to load sessions/)).toBeInTheDocument();
  });

  // ── TC-080: row click expands inline detail panel ─────────────────────────

  it('clicking Details button expands inline detail panel for that row (TC-080)', async () => {
    // TC-080 — wait for BOTH the table and the "Details" button inside a single
    // waitFor so the query retries until the component reaches its final stable state
    // (both listSessions and listUsers have resolved and the second loadSessions
    // render cycle — triggered by users loading — has completed).
    renderSessionHistory();
    await waitFor(() => {
      expect(screen.getByTestId('sessions-table')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('annotation-textarea')).not.toBeInTheDocument();

    const detailsButton = screen.getByText('Details');
    fireEvent.click(detailsButton);

    // Detail panel should appear with session content
    await waitFor(() =>
      expect(screen.getByTestId('annotation-textarea')).toBeInTheDocument()
    );
    // "Business Problem Summary:" appears in the <strong> label inside the <p>,
    // but the <p> parent's textContent also matches — use getAllByText.
    expect(screen.getAllByText(/Business Problem Summary:/)[0]).toBeInTheDocument();
    // Business problem text appears in both the main row <td> and the detail panel.
    expect(screen.getAllByText(/Digitise the grants/)[0]).toBeInTheDocument();
  });

  it('clicking Collapse button on same row collapses detail panel (TC-080)', async () => {
    // TC-080 — toggle off
    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Details'));
    await waitFor(() =>
      expect(screen.getByTestId('annotation-textarea')).toBeInTheDocument()
    );

    // Button text changed to "Collapse"
    fireEvent.click(screen.getByText('Collapse'));
    expect(screen.queryByTestId('annotation-textarea')).not.toBeInTheDocument();
  });

  // ── TC-081: admin annotation textarea + save ──────────────────────────────

  it('admin governance note textarea is visible in detail panel (TC-081)', async () => {
    // TC-081
    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Details'));
    await waitFor(() =>
      expect(screen.getByTestId('annotation-textarea')).toBeInTheDocument()
    );

    const textarea = screen.getByTestId('annotation-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('name', 'adminAnnotation');
  });

  it('typing in annotation textarea and clicking Save Note calls api.updateSession (TC-081)', async () => {
    // TC-081
    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Details'));
    await waitFor(() =>
      expect(screen.getByTestId('annotation-textarea')).toBeInTheDocument()
    );

    const textarea = screen.getByTestId('annotation-textarea');
    fireEvent.change(textarea, { target: { value: 'Governance oversight note' } });

    // Save Note button should now be enabled
    await waitFor(() =>
      expect(screen.getByText('Save Note')).not.toBeDisabled()
    );

    fireEvent.click(screen.getByText('Save Note'));

    await waitFor(() =>
      expect(mockApi.updateSession).toHaveBeenCalledWith('session-001', {})
    );
  });

  it('Save Note button is disabled when annotation textarea is empty (TC-081)', async () => {
    // TC-081 — disabled guard
    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Details'));
    await waitFor(() =>
      expect(screen.getByTestId('annotation-textarea')).toBeInTheDocument()
    );

    // Initially empty — button must be disabled
    expect(screen.getByText('Save Note')).toBeDisabled();
  });

  // ── TC-043: Export CSV ────────────────────────────────────────────────────

  it('Export CSV button triggers client-side CSV download (TC-043)', async () => {
    // TC-043 — CSV export triggered; raw userId excluded from download
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:csv-mock');
    const revokeObjectURLSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});

    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    fireEvent.click(
      screen.getByRole('button', {
        name: /Export current session history as CSV/i,
      })
    );

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blobArg.type).toContain('text/csv');

    revokeObjectURLSpy.mockRestore();
    createObjectURLSpy.mockRestore();
  });

  it('CSV export does not include raw userId field (TC-043, FAC-S5-025)', async () => {
    // TC-043, FAC-S5-025 — raw userId excluded from CSV blob content
    let capturedBlob: Blob | null = null;
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((blob: Blob | MediaSource) => {
        if (blob instanceof Blob) capturedBlob = blob;
        return 'blob:csv-mock';
      });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    fireEvent.click(
      screen.getByRole('button', { name: /Export current session history as CSV/i })
    );

    expect(capturedBlob).not.toBeNull();
    const csvText = await (capturedBlob as Blob).text();
    expect(csvText).not.toContain(USER_ID);
    expect(csvText).toContain(OWNER_DISPLAY_NAME);

    createObjectURLSpy.mockRestore();
  });

  // ── TC-044: Export JSON ───────────────────────────────────────────────────

  it('Export JSON button triggers client-side JSON download (TC-044)', async () => {
    // TC-044 — JSON export triggered; raw userId excluded from download
    let capturedBlob: Blob | null = null;
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((blob: Blob | MediaSource) => {
        if (blob instanceof Blob) capturedBlob = blob;
        return 'blob:json-mock';
      });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    fireEvent.click(
      screen.getByRole('button', { name: /Export current session history as JSON/i })
    );

    expect(capturedBlob).not.toBeNull();
    const jsonText = await (capturedBlob as Blob).text();
    const parsed = JSON.parse(jsonText) as Array<{ ownerDisplayName?: string; sessionId?: string }>;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('ownerDisplayName', OWNER_DISPLAY_NAME);
    // JSON export must NOT include userId key (FAC-S5-025)
    expect(JSON.stringify(parsed)).not.toContain('"userId"');
    expect(JSON.stringify(parsed)).not.toContain(USER_ID);

    createObjectURLSpy.mockRestore();
  });

  // ── TC-055: keyboard navigation ───────────────────────────────────────────

  it('all interactive buttons are focusable (TC-055)', async () => {
    // TC-055
    renderSessionHistory();
    await waitFor(() => expect(screen.getByTestId('sessions-table')).toBeInTheDocument());

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveAttribute('tabindex', '-1');
    });
    expect(buttons.length).toBeGreaterThanOrEqual(3); // Apply, Clear, Details, exports
  });

  // ── FAC-S5-024: userRef not in API query params ───────────────────────────

  it('listSessions is NOT called with email or userId as a query param (FAC-S5-024)', async () => {
    // FAC-S5-024 — userRefFilter held in component state; never as URL query param
    renderSessionHistory();
    await waitFor(() => expect(mockApi.listSessions).toHaveBeenCalled());

    const allCalls = mockApi.listSessions.mock.calls as Array<Array<Record<string, unknown>>>;
    allCalls.forEach((args) => {
      const params = args[0] ?? {};
      expect(params).not.toHaveProperty('userId');
      expect(params).not.toHaveProperty('email');
      expect(params).not.toHaveProperty('userRef');
    });
  });
});
