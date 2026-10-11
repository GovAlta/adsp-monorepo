/**
 * NewSessionStart.integration.test.tsx
 *
 * Integration tests using MSW to mock POST /api/v1/sessions.
 * Verifies the full submit flow: form input → API call → navigation.
 *
 * TC Coverage:
 *   TC-001 — POST /sessions success → navigation to /sessions/:id/planning
 *   TC-057 — POST /sessions 503 → error callout rendered
 *   TC-099 — POST /sessions generic error → error callout rendered
 *
 * Mock contract: response shape matches PlanningSession from api.types.ts
 * (XSTAGE-S5-011 compliance).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NewSessionStart from '../../src/pages/NewSessionStart';
import { server } from '../handlers/sessions';
import type { PlanningSession } from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// MSW lifecycle
// ──────────────────────────────────────────────────────────────────────────────

// MSW lifecycle is managed globally by __tests__/setup.ts (server from handlers/sessions.ts).
// Individual test-specific handler overrides via server.use(...) are reset by the global afterEach.

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

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  GoAFormItem: ({
    children,
    label,
    error,
  }: {
    children: React.ReactNode;
    label: string;
    error?: string;
    requirement?: string;
  }) => (
    <div>
      <label>{label}</label>
      {error && <span role="alert">{error}</span>}
      {children}
    </div>
  ),
  GoAInput: ({
    name,
    value,
    onChange,
    placeholder,
    maxLength,
  }: {
    name: string;
    value: string;
    onChange?: (name: string, value: string) => void;
    placeholder?: string;
    maxLength?: number;
  }) => (
    <input
      name={name}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      data-testid="title-input"
      onChange={(e) => onChange?.(name, e.target.value)}
    />
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
    <div role="status">{message}</div>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

const renderPage = () =>
  render(
    <MemoryRouter>
      <NewSessionStart />
    </MemoryRouter>
  );

const fillAndSubmit = async (title: string) => {
  const input = screen.getByTestId('title-input');
  fireEvent.change(input, { target: { value: title } });
  fireEvent.click(screen.getByText('Start Planning Session'));
};

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('NewSessionStart — integration (MSW)', () => {

  beforeEach(() => {
    // Clear mockNavigate call history so TC-057's `not.toHaveBeenCalled()` is not
    // contaminated by calls from previous success-case tests.
    vi.clearAllMocks();
  });

  it('success case: POST /sessions returns session → navigation to /sessions/:id/planning (TC-001)', async () => {
    // TC-001 — default MSW handler returns session with id: 'session-new'
    renderPage();
    await fillAndSubmit('Integration Test Session');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sessions/session-new/planning');
    });
  });

  it('success case: POST body contains trimmed title (TC-001)', async () => {
    // TC-001 — title should be trimmed before submission
    let capturedBody: unknown = null;
    server.use(
      http.post(`${BASE_URL}/sessions`, async ({ request }) => {
        capturedBody = await request.json();
        const newSession: PlanningSession = {
          id: 'session-captured',
          userId: 'user-abc',
          tenantId: 'tenant-xyz',
          title: 'Integration Test Session',
          status: 'active',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
        };
        return HttpResponse.json(newSession, { status: 201 });
      })
    );

    renderPage();
    await fillAndSubmit('  Integration Test Session  ');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sessions/session-captured/planning');
    });
    expect((capturedBody as { title: string }).title).toBe('Integration Test Session');
  });

  it('503 case: POST /sessions returns 503 → error callout appears (TC-057)', async () => {
    // TC-057
    server.use(
      http.post(`${BASE_URL}/sessions`, () => {
        return HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 });
      })
    );

    renderPage();
    await fillAndSubmit('Test Session');

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/system error/i)).toBeInTheDocument();
    // Navigation must NOT have been called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('400 case: POST /sessions returns 400 → invalid input callout (TC-099)', async () => {
    // TC-099
    server.use(
      http.post(`${BASE_URL}/sessions`, () => {
        return HttpResponse.json({ message: 'Bad Request' }, { status: 400 });
      })
    );

    renderPage();
    await fillAndSubmit('Bad Title');

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid/i)).toBeInTheDocument();
  });

  it('401 case: POST /sessions returns 401 → session expired callout (TC-099)', async () => {
    // TC-099
    server.use(
      http.post(`${BASE_URL}/sessions`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    renderPage();
    await fillAndSubmit('A Valid Title');

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/sign in again/i)).toBeInTheDocument();
  });

  it('does not render userId or tenantId from API response in the DOM (FAC-S5-025)', async () => {
    // FAC-S5-025 — the POST /sessions response contains userId/tenantId,
    // but neither should appear in the DOM (the page only uses session.id for navigation).
    renderPage();
    await fillAndSubmit('My Session');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });

    expect(screen.queryByText('user-abc')).not.toBeInTheDocument();
    expect(screen.queryByText('tenant-xyz')).not.toBeInTheDocument();
  });
});
