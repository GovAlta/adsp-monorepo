/**
 * AdminHub.integration.test.tsx — MSW integration tests for the AdminHub page.
 *
 * These tests use MSW to intercept real HTTP calls through axios, verifying
 * the full request → render pipeline for AdminHub stats loading.
 *
 * TC Coverage:
 *   TC-035 — All stats load successfully → 4 tiles with count badges rendered
 *   TC-057 — One endpoint 403 → error callout shown; tiles remain functional
 *
 * Mock contract shape: all response fields are camelCase per api.types.ts
 * (XSTAGE-S5-011 compliance — mock must match OpenAPI contract).
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import AdminHub from '../../src/pages/AdminHub';
import type { BusinessPattern, PaginatedResult, PlanningSession, AuditEvent } from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// MSW server — compose all three stats endpoints
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

const defaultHandlers = [
  http.get(`${BASE_URL}/patterns`, () => {
    const result: PaginatedResult<BusinessPattern> = {
      items: [],
      total: 7,
      page: 1,
      pageSize: 1,
      totalPages: 7,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  http.get(`${BASE_URL}/sessions`, () => {
    const result: PaginatedResult<PlanningSession> = {
      items: [],
      total: 23,
      page: 1,
      pageSize: 1,
      totalPages: 23,
    };
    return HttpResponse.json(result, { status: 200 });
  }),

  http.get(`${BASE_URL}/audit`, () => {
    const result: PaginatedResult<AuditEvent> = {
      items: [],
      total: 47,
      page: 1,
      pageSize: 1,
      totalPages: 47,
    };
    return HttpResponse.json(result, { status: 200 });
  }),
];

const server = setupServer(...defaultHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ──────────────────────────────────────────────────────────────────────────────
// GoA component mocks (lightweight stubs)
// ──────────────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
  ),
  GoAGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="grid">{children}</div>
  ),
  GoAIcon: ({ name }: { name: string }) => <span aria-hidden="true" data-icon={name} />,
  GoABadge: ({ content, type }: { content: string; type: string }) => (
    <span data-testid="badge" data-type={type}>{content}</span>
  ),
  GoAButton: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
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
// Helper
// ──────────────────────────────────────────────────────────────────────────────

const renderAdminHub = () =>
  render(
    <MemoryRouter>
      <AdminHub />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('AdminHub integration', () => {
  it('all 4 tiles render with stats badges when all endpoints succeed (TC-035)', async () => {
    // TC-035 — happy path: all three stats calls succeed; badges show counts
    renderAdminHub();

    await waitFor(() => {
      expect(screen.getByText('Pattern Library')).toBeInTheDocument();
      expect(screen.getByText('Session History')).toBeInTheDocument();
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    // Stats badges display numeric totals from API
    const badges = screen.getAllByTestId('badge');
    const badgeTexts = badges.map((b) => b.textContent ?? '');
    expect(badgeTexts.some((t) => t.includes('7'))).toBe(true);
    expect(badgeTexts.some((t) => t.includes('23'))).toBe(true);
    expect(badgeTexts.some((t) => t.includes('47'))).toBe(true);

    // No loading indicator after load
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('error callout shown when listPatterns returns 403 (TC-057)', async () => {
    // TC-057 — any stats endpoint failure shows the stats-unavailable notice
    server.use(
      http.get(`${BASE_URL}/patterns`, () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      })
    );

    renderAdminHub();

    await waitFor(() => {
      expect(screen.getByText('Statistics temporarily unavailable')).toBeInTheDocument();
    });

    // Tiles still render — navigation remains functional
    expect(screen.getByText('Pattern Library')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('error callout shown when listSessions returns 403 (TC-057)', async () => {
    // TC-057 — sessions endpoint 403 triggers stats failure
    server.use(
      http.get(`${BASE_URL}/sessions`, () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      })
    );

    renderAdminHub();

    await waitFor(() => {
      expect(screen.getByText('Statistics temporarily unavailable')).toBeInTheDocument();
    });
  });

  it('error callout shown when listAuditEvents returns 403 (TC-057)', async () => {
    // TC-057 — audit endpoint 403 triggers stats failure
    server.use(
      http.get(`${BASE_URL}/audit`, () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      })
    );

    renderAdminHub();

    await waitFor(() => {
      expect(screen.getByText('Statistics temporarily unavailable')).toBeInTheDocument();
    });
  });
});
