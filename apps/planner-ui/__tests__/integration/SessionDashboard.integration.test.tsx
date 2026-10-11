/**
 * SessionDashboard.integration.test.tsx
 *
 * Integration tests using MSW to mock the real HTTP transport layer.
 * Verifies that SessionDashboard correctly calls GET /api/v1/sessions and
 * renders the response.
 *
 * TC Coverage:
 *   TC-014 — Session list renders from live-ish API response (MSW intercept)
 *   TC-037 — Empty state renders when API returns empty array
 *   TC-039 — Auth error (401) causes auth notification to appear
 *   TC-011 — Table columns and session data render correctly
 *   TC-019 — Pagination renders with correct total
 *
 * Mock contract shape: all response fields are camelCase per api.types.ts
 * (XSTAGE-S5-011 compliance — mock must match OpenAPI contract).
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';
import SessionDashboard from '../../src/pages/SessionDashboard';
import { server } from '../handlers/sessions';
import type { PaginatedResult, PlanningSession } from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// MSW lifecycle (per-file server for integration tests)
// ──────────────────────────────────────────────────────────────────────────────

// MSW lifecycle is managed globally by __tests__/setup.ts (server from handlers/sessions.ts).
// Individual test-specific handler overrides via server.use(...) are reset by the global afterEach.

// ──────────────────────────────────────────────────────────────────────────────
// GoA component mocks (same lightweight stubs as unit tests)
// ──────────────────────────────────────────────────────────────────────────────

import { vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="container">{children}</div>,
  GoAButton: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  GoADetails: ({ children, heading }: { children: React.ReactNode; heading: string }) => (
    <details><summary>{heading}</summary>{children}</details>
  ),
  GoAFormItem: ({ children, label }: { children: React.ReactNode; label: string }) => (
    <div><label>{label}</label>{children}</div>
  ),
  GoADropdown: ({ children, onChange, name, value }: { children: React.ReactNode; onChange?: (n: string, v: string) => void; name: string; value: string }) => (
    <select value={value} onChange={(e) => onChange?.(name, e.target.value)}>{children}</select>
  ),
  GoADropdownItem: ({ value, label }: { value: string; label: string }) => <option value={value}>{label}</option>,
  GoATable: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  GoATableSortHeader: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <th onClick={onClick}>{children}</th>
  ),
  GoABadge: ({ content }: { content: string }) => <span data-testid="badge">{content}</span>,
  GoAPagination: ({ itemCount, pageNumber }: { itemCount: number; pageNumber: number }) => (
    <nav data-testid="pagination" data-total={itemCount} data-page={pageNumber} aria-label="pagination">
      <button>Next</button>
    </nav>
  ),
  GoACallout: ({ children, heading, type }: { children: React.ReactNode; heading: string; type: string }) => (
    <div role="alert" data-type={type} data-testid={`callout-${type}`}>
      <strong>{heading}</strong>{children}
    </div>
  ),
  GoACircularProgress: ({ message }: { message: string }) => <div role="status">{message}</div>,
  GoANotification: ({ children, type }: { children: React.ReactNode; type: string }) => (
    <div role="alert" data-testid={`notification-${type}`}>{children}</div>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <SessionDashboard />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('SessionDashboard — integration (MSW)', () => {

  it('success case: GET /sessions returns sessions array → list renders (TC-014)', async () => {
    // TC-014 — default MSW handler returns [mockSession, mockSessionPaused]
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Grants Modernization')).toBeInTheDocument();
    });
    expect(screen.getByText('Notification Service Pilot')).toBeInTheDocument();
    // Active and Paused badges should both appear; use getAllByText in case status text
    // appears in multiple places (e.g. badge + filter dropdown option)
    expect(screen.getAllByText('Active')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Paused')[0]).toBeInTheDocument();
  });

  it('success case: pagination renders with correct total (TC-019)', async () => {
    // TC-019 — handler returns total:2
    renderDashboard();

    await waitFor(() => {
      const pagination = screen.getByTestId('pagination');
      expect(pagination).toBeInTheDocument();
      expect(pagination).toHaveAttribute('data-total', '2');
    });
  });

  it('empty case: GET /sessions returns [] → empty state renders (TC-037)', async () => {
    // TC-037 — override handler to return empty list
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

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No planning sessions')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('auth error: GET /sessions returns 401 → auth notification appears (TC-039)', async () => {
    // TC-039
    server.use(
      http.get(`${BASE_URL}/sessions`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('notification-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
  });

  it('server error: GET /sessions returns 500 → error callout (TC-014)', async () => {
    // TC-014 — 500 triggers generic error state
    server.use(
      http.get(`${BASE_URL}/sessions`, () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/Unable to load planning sessions/i)).toBeInTheDocument();
  });

  it('userId and tenantId from API response are not rendered in DOM (FAC-S5-025)', async () => {
    // FAC-S5-025 — even via real MSW response, Protected B fields must not appear
    // mockSession has userId: 'user-abc' and tenantId: 'tenant-xyz'
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Grants Modernization')).toBeInTheDocument();
    });

    expect(screen.queryByText('user-abc')).not.toBeInTheDocument();
    expect(screen.queryByText('tenant-xyz')).not.toBeInTheDocument();
  });
});
