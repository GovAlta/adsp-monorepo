/**
 * PatternLibrary.integration.test.tsx — MSW integration tests for PatternLibrary.
 *
 * These tests intercept real HTTP calls through axios and verify that
 * PatternLibrary correctly calls GET /api/v1/patterns and renders the response.
 *
 * TC Coverage:
 *   TC-027 — Returns patterns array → table renders with pattern names
 *   TC-028 — Status filter=active → MSW returns only active patterns; table shows active patterns
 *   TC-075 — Returns [] → empty state renders; correct count badge
 *
 * Mock contract shape: all response fields are camelCase per api.types.ts
 * (XSTAGE-S5-011 compliance — mock must match OpenAPI contract).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import PatternLibrary from '../../src/pages/PatternLibrary';
import { mockPatternActive, mockPatternInactive } from '../handlers/patterns';
import type { BusinessPattern, PaginatedResult } from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// MSW server
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

const defaultHandlers = [
  http.get(`${BASE_URL}/patterns`, () => {
    const result: PaginatedResult<BusinessPattern> = {
      items: [mockPatternActive, mockPatternInactive],
      total: 2,
      page: 1,
      pageSize: 20,
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
// GoA component mocks
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
  GoADatePicker: ({
    name,
    value,
    onChange,
  }: {
    name: string;
    value: string;
    onChange?: (name: string, value: string) => void;
  }) => (
    <input
      type="date"
      name={name}
      value={value}
      onChange={(e) => onChange?.(name, e.target.value)}
    />
  ),
  GoADetails: ({ children, heading }: { children: React.ReactNode; heading: string }) => (
    <details>
      <summary>{heading}</summary>
      {children}
    </details>
  ),
  GoADropdown: ({
    children,
    onChange,
    name,
    value,
  }: {
    children: React.ReactNode;
    onChange?: (name: string, value: string) => void;
    name: string;
    value: string;
  }) => (
    <select
      data-name={name}
      value={value}
      data-testid={`dropdown-${name}`}
      onChange={(e) => onChange?.(name, e.target.value)}
    >
      {children}
    </select>
  ),
  GoADropdownItem: ({ value, children }: { value: string; children?: React.ReactNode }) => (
    <option value={value}>{children ?? value}</option>
  ),
  GoAFormItem: ({ children, label }: { children: React.ReactNode; label: string }) => (
    <div>
      <label>{label}</label>
      {children}
    </div>
  ),
  GoAIconButton: ({
    icon,
    title,
    onClick,
  }: {
    icon: string;
    title: string;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} aria-label={title} data-icon={icon}>
      {title}
    </button>
  ),
  GoAPagination: ({
    itemCount,
    pageNumber,
    onChange,
  }: {
    itemCount: number;
    perPageCount: number;
    pageNumber: number;
    onChange?: (newPage: number) => void;
  }) => (
    <nav aria-label="pagination" data-testid="pagination" data-total={itemCount} data-page={pageNumber}>
      <button onClick={() => onChange?.(pageNumber + 1)}>Next</button>
    </nav>
  ),
  GoATable: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  GoATableSortHeader: ({
    children,
    onClick,
    name,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    name: string;
  }) => (
    <th onClick={onClick} data-col={name}>
      {children}
    </th>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────────────────────────────────────

const renderPatternLibrary = () =>
  render(
    <MemoryRouter>
      <PatternLibrary />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('PatternLibrary integration', () => {
  it('renders pattern table when API returns patterns (TC-027)', async () => {
    // TC-027 — table renders with pattern names from API response
    renderPatternLibrary();

    await waitFor(() => {
      expect(screen.getByText('Citizen Notification Workflow')).toBeInTheDocument();
      expect(screen.getByText('Legacy Document Workflow')).toBeInTheDocument();
    });

    // Status badges present
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    // Count badge shows total
    expect(screen.getByText('2 patterns')).toBeInTheDocument();
  });

  it('renders empty state when API returns empty array (TC-075)', async () => {
    // TC-075 — empty state when no patterns
    server.use(
      http.get(`${BASE_URL}/patterns`, () => {
        const result: PaginatedResult<BusinessPattern> = {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        };
        return HttpResponse.json(result, { status: 200 });
      })
    );

    renderPatternLibrary();

    await waitFor(() => {
      expect(screen.getByText('No patterns available')).toBeInTheDocument();
    });

    expect(screen.getByText('0 patterns')).toBeInTheDocument();
  });

  it('status filter=active shows only active patterns from API (TC-028)', async () => {
    // TC-028 — filter sends status=active param and only active patterns render
    server.use(
      http.get(`${BASE_URL}/patterns`, ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const filtered =
          status === 'active' ? [mockPatternActive] : [mockPatternActive, mockPatternInactive];
        const result: PaginatedResult<BusinessPattern> = {
          items: filtered,
          total: filtered.length,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        };
        return HttpResponse.json(result, { status: 200 });
      })
    );

    renderPatternLibrary();
    await waitFor(() =>
      expect(screen.getByText('Citizen Notification Workflow')).toBeInTheDocument()
    );

    // Apply status filter — change dropdown to 'active'
    const dropdown = screen.getByTestId('dropdown-status');
    fireEvent.change(dropdown, { target: { value: 'active' } });

    // After filter: only active pattern rendered; inactive pattern absent
    await waitFor(() => {
      expect(screen.getByText('Citizen Notification Workflow')).toBeInTheDocument();
      expect(screen.queryByText('Legacy Document Workflow')).not.toBeInTheDocument();
    });
  });

  it('stub unavailable callout shown when API returns 503 (TC-027)', async () => {
    // TC-027 — INT-002 stub returns 503
    server.use(
      http.get(`${BASE_URL}/patterns`, () => {
        return HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 });
      })
    );

    renderPatternLibrary();

    await waitFor(() => {
      expect(screen.getByText('Pattern data is temporarily unavailable')).toBeInTheDocument();
    });
  });
});
