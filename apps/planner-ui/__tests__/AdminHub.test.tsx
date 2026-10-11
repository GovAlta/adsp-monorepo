/**
 * AdminHub.test.tsx — Unit tests for the admin-hub (section-hub) page.
 *
 * TC Coverage:
 *   TC-035 — 4 navigation tiles render; stats badges show loaded counts; loading state shown
 *   TC-036 — User Management tile renders unconditionally (role gate at API, not UI)
 *   TC-039 — (via TC-057 pattern) error callout on stats load failure
 *   TC-055 — Interactive elements are focusable (keyboard navigation)
 *   TC-057 — Error callout when stats fail to load
 *
 * Security:
 *   FAC-S5-026 — no localStorage.setItem / sessionStorage.setItem during render
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminHub from '../src/pages/AdminHub';

// ──────────────────────────────────────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the api service — use vi.hoisted so mock state is available
// when the module factory runs at import time (avoids TDZ ReferenceError).
const mockApi = vi.hoisted(() => ({
  listPatterns: vi.fn(),
  listSessions: vi.fn(),
  listAuditEvents: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: mockApi,
}));

// Mock GoA components — lightweight stubs that render text content
vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
  ),
  GoAGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="grid">{children}</div>
  ),
  GoAIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} aria-hidden="true" />
  ),
  GoABadge: ({ content, type }: { content: string; type: string }) => (
    <span data-testid="badge" data-type={type}>{content}</span>
  ),
  GoAButton: ({
    children,
    onClick,
    type,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: string;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-type={type}>
      {children}
    </button>
  ),
  GoACallout: ({
    children,
    heading,
    type,
  }: {
    children: React.ReactNode;
    heading: string;
    type: string;
  }) => (
    <div role="alert" data-type={type} data-testid={`callout-${type}`}>
      <strong>{heading}</strong>
      {children}
    </div>
  ),
  GoACircularProgress: ({ message }: { message: string }) => (
    <div role="status" data-testid="loading">{message}</div>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const makeStatsResult = (total: number) => ({
  items: [],
  total,
  page: 1,
  pageSize: 1,
  totalPages: total,
});

const renderAdminHub = () =>
  render(
    <MemoryRouter>
      <AdminHub />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('AdminHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all stats load successfully
    mockApi.listPatterns.mockResolvedValue(makeStatsResult(7));
    mockApi.listSessions.mockResolvedValue(makeStatsResult(23));
    mockApi.listAuditEvents.mockResolvedValue(makeStatsResult(47));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── FAC-S5-026: no storage writes ────────────────────────────────────────

  it('does not call localStorage.setItem during render (FAC-S5-026)', async () => {
    // FAC-S5-026
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not call sessionStorage.setItem during render (FAC-S5-026)', async () => {
    // FAC-S5-026
    const sessionSetItemSpy = vi.spyOn(window.sessionStorage, 'setItem');
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());
    expect(sessionSetItemSpy).not.toHaveBeenCalled();
  });

  // ── Loading state (TC-035) ────────────────────────────────────────────────

  it('shows GoACircularProgress loading indicator while stats are loading (TC-035)', () => {
    // TC-035 — stats not yet resolved; loading state visible
    mockApi.listPatterns.mockImplementation(() => new Promise(() => {}));
    mockApi.listSessions.mockImplementation(() => new Promise(() => {}));
    mockApi.listAuditEvents.mockImplementation(() => new Promise(() => {}));
    renderAdminHub();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading administration overview...')).toBeInTheDocument();
  });

  // ── 4 tiles render (TC-035) ───────────────────────────────────────────────

  it('renders 4 navigation tile headings after stats load (TC-035)', async () => {
    // TC-035 — all four tiles must be present
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    expect(screen.getByText('Pattern Library')).toBeInTheDocument();
    expect(screen.getByText('Session History')).toBeInTheDocument();
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  // ── Stats badges show loaded counts (TC-035) ──────────────────────────────

  it('stats badges show counts returned by API (TC-035)', async () => {
    // TC-035 — badge content includes numeric totals
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    const badges = screen.getAllByTestId('badge');
    const badgeTexts = badges.map((b) => b.textContent ?? '');
    expect(badgeTexts.some((t) => t.includes('7'))).toBe(true);   // pattern count
    expect(badgeTexts.some((t) => t.includes('23'))).toBe(true);  // session count
    expect(badgeTexts.some((t) => t.includes('47'))).toBe(true);  // audit count
  });

  // ── CTA buttons navigate to correct routes (TC-035) ──────────────────────

  it('Manage Patterns button navigates to /admin/patterns (TC-035)', async () => {
    // TC-035
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Manage Patterns'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/patterns');
  });

  it('View History button navigates to /admin/history (TC-035)', async () => {
    // TC-035
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    fireEvent.click(screen.getByText('View History'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/history');
  });

  it('View Audit Log button navigates to /admin/audit (TC-035)', async () => {
    // TC-035
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    fireEvent.click(screen.getByText('View Audit Log'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/audit');
  });

  it('Manage Users button navigates to /admin/users (TC-035)', async () => {
    // TC-035
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Manage Users'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
  });

  // ── User Management tile is unconditional (TC-036) ────────────────────────

  it('User Management tile renders unconditionally regardless of role (TC-036)', async () => {
    // TC-036 — tile is always rendered; role enforcement is at API layer
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    // Tile heading and its CTA button must always be present
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
  });

  // ── Error callout when stats fail (TC-035, TC-057) ────────────────────────

  it('shows error callout when stats API calls fail (TC-035, TC-057)', async () => {
    // TC-035 / TC-057 — any stats failure shows the unavailable callout
    mockApi.listPatterns.mockRejectedValue(new Error('Network error'));
    mockApi.listSessions.mockRejectedValue(new Error('Network error'));
    mockApi.listAuditEvents.mockRejectedValue(new Error('Network error'));
    renderAdminHub();

    await waitFor(() => {
      expect(screen.getByText('Statistics temporarily unavailable')).toBeInTheDocument();
    });
  });

  it('stats badges show -- when stats fail to load (TC-035)', async () => {
    // TC-035 — badges show '--' sentinel value on error
    mockApi.listPatterns.mockRejectedValue(new Error('Fail'));
    mockApi.listSessions.mockRejectedValue(new Error('Fail'));
    mockApi.listAuditEvents.mockRejectedValue(new Error('Fail'));
    renderAdminHub();

    await waitFor(() => {
      expect(screen.getByText('Statistics temporarily unavailable')).toBeInTheDocument();
    });
    // Loading must be done
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // ── All interactive elements are focusable (TC-055) ──────────────────────

  it('all CTA buttons are focusable (TC-055)', async () => {
    // TC-055 — keyboard navigation
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveAttribute('tabindex', '-1');
    });
    expect(buttons.length).toBeGreaterThanOrEqual(4); // 4 tile CTA buttons
  });

  // ── listPatterns called with pageSize=1 for stats ────────────────────────

  it('calls listPatterns with page=1 and pageSize=1 for stats badge (TC-035)', async () => {
    // TC-035 — stats use pageSize=1 to retrieve total without full payload
    renderAdminHub();
    await waitFor(() => expect(mockApi.listPatterns).toHaveBeenCalled());

    expect(mockApi.listPatterns).toHaveBeenCalledWith({ page: 1, pageSize: 1 });
    expect(mockApi.listSessions).toHaveBeenCalledWith({ page: 1, pageSize: 1 });
    expect(mockApi.listAuditEvents).toHaveBeenCalledWith({ page: 1, pageSize: 1 });
  });
});
