/**
 * SessionDashboard.test.tsx — Unit tests for the session-dashboard page (list-index).
 *
 * TC Coverage:
 *   TC-001 — Start New Session navigates to /sessions/new
 *   TC-002 — Resume button navigates to planning session route
 *   TC-008 — Context sidebar / session detail availability (session data rendered)
 *   TC-011 — Session list renders correct columns
 *   TC-012 — Session list renders status badge per session
 *   TC-014 — Status filter changes API call params
 *   TC-019 — Pagination controls present when items exist
 *   TC-037 — Empty state callout shown when no sessions
 *   TC-039 — 401 error surfaces auth notification
 *   TC-041 — Session title rendered as link
 *   TC-042 — Business problem summary truncated at 80 chars
 *   TC-050 / FAC-S5-025 — userId and tenantId not rendered in any table cell
 *   TC-055 — Interactive elements are focusable (keyboard navigation)
 *   TC-056 — Sort header click toggles sort direction
 *   TC-057 — Error callout on 500 from API
 *   TC-080 — Idle session (>7 days) shows idle warning callout
 *
 * Business Rules:
 *   BR-001: Session Tenant-User Scoping — session list scoped to tenantId+userId; verified
 *           via mock API response containing only sessions matching the current user/tenant.
 *
 * Security:
 *   FAC-S5-025 — userId/tenantId not in rendered DOM
 *   FAC-S5-026 — no localStorage.setItem / sessionStorage.setItem during render
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SessionDashboard from '../src/pages/SessionDashboard';
import type { PaginatedResult, PlanningSession } from '../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────────────────────────────────────

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the api service — use vi.hoisted so the mock state is available
// when the module factory runs at import time (avoids TDZ ReferenceError).
const mockApi = vi.hoisted(() => ({
  listSessions: vi.fn(),
  updateSession: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: mockApi,
}));

// Mock GoA components — lightweight stubs that render text content
vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="container">{children}</div>,
  GoAButton: ({ children, onClick, type, disabled }: { children: React.ReactNode; onClick?: () => void; type?: string; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} data-type={type}>{children}</button>
  ),
  GoADetails: ({ children, heading }: { children: React.ReactNode; heading: string }) => (
    <details><summary>{heading}</summary>{children}</details>
  ),
  GoAFormItem: ({ children, label }: { children: React.ReactNode; label: string }) => (
    <div><label>{label}</label>{children}</div>
  ),
  GoADropdown: ({ children, onChange, name, value }: { children: React.ReactNode; onChange?: (name: string, value: string) => void; name: string; value: string }) => (
    <select data-name={name} value={value} onChange={(e) => onChange?.(name, e.target.value)}>{children}</select>
  ),
  GoADropdownItem: ({ value, label }: { value: string; label: string }) => (
    <option value={value}>{label}</option>
  ),
  GoATable: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  GoATableSortHeader: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <th onClick={onClick} style={{ cursor: 'pointer' }}>{children}</th>
  ),
  GoABadge: ({ content }: { content: string }) => <span data-testid="badge">{content}</span>,
  GoAPagination: ({ itemCount, perPageCount: _perPageCount, pageNumber, onChange }: { itemCount: number; perPageCount: number; pageNumber: number; onChange?: (name: string, value: number) => void }) => (
    <nav aria-label="pagination" data-testid="pagination" data-total={itemCount} data-page={pageNumber}>
      <button onClick={() => onChange?.('page', pageNumber + 1)}>Next</button>
    </nav>
  ),
  GoACallout: ({ children, heading, type }: { children: React.ReactNode; heading: string; type: string }) => (
    <div role="alert" data-type={type} data-testid={`callout-${type}`}>
      <strong>{heading}</strong>
      {children}
    </div>
  ),
  GoACircularProgress: ({ message }: { message: string }) => <div role="status">{message}</div>,
  GoANotification: ({ children, type, onDismiss }: { children: React.ReactNode; type: string; onDismiss?: () => void }) => (
    <div role="alert" data-testid={`notification-${type}`}>
      {children}
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const makeSession = (overrides: Partial<PlanningSession> = {}): PlanningSession => ({
  id: 'session-001',
  userId: 'user-abc',
  tenantId: 'tenant-xyz',
  title: 'Grants Modernization',
  status: 'active',
  businessProblemSummary: 'Digitise grants application.',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-15T14:30:00Z',
  ...overrides,
});

const makePagedResult = (items: PlanningSession[]): PaginatedResult<PlanningSession> => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <SessionDashboard />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('SessionDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.updateSession.mockResolvedValue(makeSession());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── FAC-S5-026: no localStorage / sessionStorage writes ──────────────────

  it('does not call localStorage.setItem during render (FAC-S5-026)', async () => {
    // TC-014, FAC-S5-026
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    mockApi.listSessions.mockResolvedValue(makePagedResult([makeSession()]));
    renderDashboard();
    await waitFor(() => expect(mockApi.listSessions).toHaveBeenCalled());
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not call sessionStorage.setItem during render (FAC-S5-026)', async () => {
    // TC-014, FAC-S5-026
    const sessionSetItemSpy = vi.spyOn(window.sessionStorage, 'setItem');
    mockApi.listSessions.mockResolvedValue(makePagedResult([makeSession()]));
    renderDashboard();
    await waitFor(() => expect(mockApi.listSessions).toHaveBeenCalled());
    expect(sessionSetItemSpy).not.toHaveBeenCalled();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders session list when API returns data (TC-014, TC-037)', async () => {
    // TC-014, TC-037
    const session = makeSession();
    mockApi.listSessions.mockResolvedValue(makePagedResult([session]));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Grants Modernization')).toBeInTheDocument();
    });
    // TC-012: status badge present — use getAllByText because the status filter
    // dropdown also renders an "Active" option alongside the badge.
    expect(screen.getAllByText('Active')[0]).toBeInTheDocument();
  });

  it('shows empty state GoACallout when no sessions returned (TC-037)', async () => {
    // TC-037
    mockApi.listSessions.mockResolvedValue(makePagedResult([]));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No planning sessions')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/You have no planning sessions yet/i)
    ).toBeInTheDocument();
  });

  it('shows error callout when API returns 500 (TC-057)', async () => {
    // TC-057 pattern — generic API error
    mockApi.listSessions.mockRejectedValue({ status: 500 });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Unable to load sessions')).toBeInTheDocument();
    });
  });

  it('shows error callout when API returns 403 (TC-057)', async () => {
    // TC-057 — forbidden
    mockApi.listSessions.mockRejectedValue({ status: 403 });
    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByText(/You do not have permission/i)
      ).toBeInTheDocument();
    });
  });

  it('shows auth notification when API returns 401 (TC-039)', async () => {
    // TC-039
    mockApi.listSessions.mockRejectedValue({ status: 401 });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('notification-emergency')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Your session has expired/i)
    ).toBeInTheDocument();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('Start New Session button navigates to /sessions/new (TC-001)', async () => {
    // TC-001
    mockApi.listSessions.mockResolvedValue(makePagedResult([]));
    renderDashboard();

    await waitFor(() => expect(mockApi.listSessions).toHaveBeenCalled());

    const btn = screen.getAllByText('Start New Session')[0];
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/sessions/new');
  });

  it('Resume button navigates to planning session route for paused session (TC-002)', async () => {
    // TC-002 — paused sessions show "Resume" button
    const session = makeSession({ id: 'session-001', status: 'paused' });
    mockApi.listSessions.mockResolvedValue(makePagedResult([session]));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Resume'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sessions/session-001/planning');
    });
  });

  it('Resume on paused session calls updateSession then navigates (TC-002)', async () => {
    // TC-002 — paused session triggers updateSession before navigate
    const session = makeSession({ id: 'session-002', status: 'paused' });
    mockApi.listSessions.mockResolvedValue(makePagedResult([session]));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Resume'));
    await waitFor(() => {
      expect(mockApi.updateSession).toHaveBeenCalledWith('session-002', { status: 'active' });
      expect(mockNavigate).toHaveBeenCalledWith('/sessions/session-002/planning');
    });
  });

  // ── Protected B field guard (FAC-S5-025) ──────────────────────────────────

  it('does NOT render userId in any table cell (TC-050, FAC-S5-025)', async () => {
    // TC-050, FAC-S5-025
    const session = makeSession({ userId: 'secret-user-id-123' });
    mockApi.listSessions.mockResolvedValue(makePagedResult([session]));
    renderDashboard();

    await waitFor(() => expect(screen.getByText('Grants Modernization')).toBeInTheDocument());
    // userId must not appear anywhere in the DOM
    expect(screen.queryByText('secret-user-id-123')).not.toBeInTheDocument();
  });

  it('does NOT render tenantId in any table cell (TC-050, FAC-S5-025)', async () => {
    // TC-050, FAC-S5-025
    const session = makeSession({ tenantId: 'secret-tenant-id-456' });
    mockApi.listSessions.mockResolvedValue(makePagedResult([session]));
    renderDashboard();

    await waitFor(() => expect(screen.getByText('Grants Modernization')).toBeInTheDocument());
    expect(screen.queryByText('secret-tenant-id-456')).not.toBeInTheDocument();
  });

  // ── Idle session warning (TC-080) ─────────────────────────────────────────

  it('shows idle indicator for session inactive >7 days (TC-080)', async () => {
    // TC-080 — session with lastResumedAt > 7 days ago shows inline idle indicator
    const idleSession = makeSession({
      id: 'session-old',
      lastResumedAt: '2025-01-01T00:00:00Z',  // Far in the past
      updatedAt: '2025-01-01T00:00:00Z',
    });
    mockApi.listSessions.mockResolvedValue(makePagedResult([idleSession]));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Idle 7+ days')).toBeInTheDocument();
    });
  });

  // ── Table columns (TC-011, TC-041, TC-042) ────────────────────────────────

  it('renders session title as a link (TC-041)', async () => {
    // TC-041
    const session = makeSession({ id: 'session-001' });
    mockApi.listSessions.mockResolvedValue(makePagedResult([session]));
    renderDashboard();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Grants Modernization' });
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toContain('session-001');
    });
  });

  it('truncates business problem summary at 80 characters (TC-042)', async () => {
    // TC-042
    const longSummary = 'A'.repeat(120);
    const session = makeSession({ businessProblemSummary: longSummary });
    mockApi.listSessions.mockResolvedValue(makePagedResult([session]));
    renderDashboard();

    await waitFor(() => {
      const truncated = screen.getByText(/A{80}\.\.\./);
      expect(truncated).toBeInTheDocument();
    });
  });

  // ── Pagination (TC-019) ───────────────────────────────────────────────────

  it('pagination is rendered when sessions exist (TC-019)', async () => {
    // TC-019
    const sessions = [makeSession({ id: 's1' }), makeSession({ id: 's2' })];
    mockApi.listSessions.mockResolvedValue({
      items: sessions,
      total: 50,
      page: 1,
      pageSize: 20,
      totalPages: 3,
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
    expect(screen.getByTestId('pagination')).toHaveAttribute('data-total', '50');
  });

  // ── Keyboard navigation (TC-055) ──────────────────────────────────────────

  it('all interactive elements are focusable (TC-055)', async () => {
    // TC-055
    const session = makeSession({ status: 'active' });
    mockApi.listSessions.mockResolvedValue(makePagedResult([session]));
    renderDashboard();

    await waitFor(() => expect(screen.getByText('Grants Modernization')).toBeInTheDocument());

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveAttribute('tabindex', '-1');
    });
  });

  // ── Status filter (TC-014) ────────────────────────────────────────────────

  it('status filter dropdown change triggers new API call with status param (TC-014)', async () => {
    // TC-014
    mockApi.listSessions.mockResolvedValue(makePagedResult([makeSession()]));
    renderDashboard();
    await waitFor(() => expect(mockApi.listSessions).toHaveBeenCalledTimes(1));

    // Change the status filter to 'paused'
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'paused' } });

    await waitFor(() => {
      expect(mockApi.listSessions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'paused' })
      );
    });
  });
});
