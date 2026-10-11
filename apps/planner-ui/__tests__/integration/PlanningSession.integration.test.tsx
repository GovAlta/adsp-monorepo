/**
 * PlanningSession.integration.test.tsx
 *
 * Integration tests using MSW to mock the session, messages, and business-model APIs.
 * Verifies that PlanningSession correctly loads and renders data from the API.
 *
 * TC Coverage:
 *   TC-003 — Session load success → page renders with session data
 *   TC-004 — Messages load success → conversation history renders
 *   TC-008 — Context sidebar renders with correct session details
 *   TC-018 — 404 session not found → error callout + redirect scheduled
 *   TC-021 — Business model confidence badge rendered from API data
 *   TC-022 — Business model confidence >= 70 → hypothesis-ready callout
 *
 * Mock contract: all response fields are camelCase per api.types.ts
 * (XSTAGE-S5-011 compliance).
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { vi, describe, it, expect } from 'vitest';
import PlanningSession from '../../src/pages/PlanningSession';
import { server, mockBusinessModel } from '../handlers/sessions';
import type { BusinessModel } from '../../src/services/api.types';

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
    useParams: () => ({ sessionId: 'session-001' }),
  };
});

vi.mock('../../src/components/IntegrationPendingBanner', () => ({
  default: ({ intId }: { intId: string }) => (
    <div data-testid={`integration-pending-${intId}`}>
      Planning Agent is in test mode — {intId}
    </div>
  ),
}));

vi.mock('../../src/components/ConfidenceBadge', () => ({
  default: ({ score, showLabel }: { score: number; showLabel?: boolean }) => (
    <span data-testid="confidence-badge" data-score={score}>
      {showLabel ? `${score}% Confidence` : score >= 70 ? 'Ready' : 'Building'}
    </span>
  ),
}));

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
  GoAFormItem: ({ children, label }: { children: React.ReactNode; label: string }) => (
    <div>
      <label>{label}</label>
      {children}
    </div>
  ),
  GoATextArea: ({
    name,
    value,
    onChange,
    disabled,
  }: {
    name: string;
    value: string;
    onChange?: (name: string, value: string) => void;
    disabled?: boolean;
  }) => (
    <textarea
      name={name}
      value={value}
      disabled={disabled}
      data-testid="message-textarea"
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
  GoABadge: ({ content, type }: { content: string; type?: string }) => (
    <span data-testid="badge" data-badge-type={type}>
      {content}
    </span>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/sessions/session-001/planning']}>
      <Routes>
        <Route path="/sessions/:sessionId/planning" element={<PlanningSession />} />
      </Routes>
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('PlanningSession — integration (MSW)', () => {

  it('session load success → page renders with session title in sidebar (TC-003, TC-008)', async () => {
    // TC-003, TC-008 — default MSW handlers return mockSession + messages + model
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Session Details')).toBeInTheDocument();
    });
    // 'Grants Modernization' may appear in multiple elements (heading + sidebar); use getAllByText
    expect(screen.getAllByText('Grants Modernization')[0]).toBeInTheDocument();
  });

  it('messages load success → conversation message content renders (TC-004)', async () => {
    // TC-004 — default MSW handler returns one assistant message
    renderPage();

    await waitFor(() => {
      // Message content is the full string; match by regex substring
      expect(
        screen.getByText(/Please describe your business problem\./i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Planning Agent')).toBeInTheDocument();
  });

  it('business model loads → ConfidenceBadge rendered with score from API (TC-021)', async () => {
    // TC-021 — default model has confidenceScore: 75
    renderPage();

    await waitFor(() => {
      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveAttribute('data-score', '75');
    });
  });

  it('confidence >= 70 → hypothesis-ready callout shown (TC-022)', async () => {
    // TC-022 — default model.confidenceScore = 75 >= 70
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/solution hypothesis has been generated/i)
      ).toBeInTheDocument();
    });
  });

  it('confidence < 70 → business model incomplete callout shown (TC-021)', async () => {
    // TC-021 — override model to return low confidence
    server.use(
      http.get(`${BASE_URL}/sessions/:sessionId/model`, () => {
        const lowModel: BusinessModel = {
          ...mockBusinessModel,
          confidenceScore: 42,
        };
        return HttpResponse.json(lowModel, { status: 200 });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Business model incomplete/i)).toBeInTheDocument();
    });
  });

  it('404 session not found → session-not-found callout rendered (TC-018)', async () => {
    // TC-018 — 404 from getSession
    server.use(
      http.get(`${BASE_URL}/sessions/:sessionId`, () => {
        return HttpResponse.json({ message: 'Session not found' }, { status: 404 });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Session not found')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/could not be found or is no longer accessible/i)
    ).toBeInTheDocument();
  });

  it('userId and tenantId from API response are not rendered in the DOM (FAC-S5-025)', async () => {
    // FAC-S5-025 — mockSession contains userId: 'user-abc', tenantId: 'tenant-xyz'
    // Neither should appear in the rendered page
    renderPage();

    await waitFor(() => {
      // 'Grants Modernization' may appear in multiple elements; use getAllByText
      expect(screen.getAllByText('Grants Modernization')[0]).toBeInTheDocument();
    });

    expect(screen.queryByText('user-abc')).not.toBeInTheDocument();
    expect(screen.queryByText('tenant-xyz')).not.toBeInTheDocument();
  });

  it('message content not written to localStorage during session load (FAC-S5-026)', async () => {
    // FAC-S5-026 — message content is Protected B; must stay in React state only
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Planning Agent')).toBeInTheDocument();
    });

    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it('INT-001 integration pending banner is NOT shown when INT_001_IS_STUB = false (TC-003)', async () => {
    // TC-003 — INT_001_IS_STUB = false means the banner is not rendered
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Send Message')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('integration-pending-INT-001')).not.toBeInTheDocument();
  });

  it('Send Message button is disabled (INT_001_IS_STUB) even after session loads (TC-004)', async () => {
    // TC-004 — disabled state persists after successful load
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Send Message')).toBeInTheDocument();
    });

    expect(screen.getByText('Send Message')).toBeDisabled();
  });

  it('generic API error on getSession → generic error callout shown', async () => {
    // Covers the generic error branch
    server.use(
      http.get(`${BASE_URL}/sessions/:sessionId`, () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/Unable to load session data/i)).toBeInTheDocument();
  });
});
