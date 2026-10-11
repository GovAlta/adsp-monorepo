/**
 * BusinessModelReview.integration.test.tsx
 *
 * Integration tests using MSW to mock the real HTTP transport layer.
 * Verifies BusinessModelReview correctly calls GET /sessions/:id/model
 * and renders the response.
 *
 * TC Coverage:
 *   TC-003  — Full model renders concept tabs on success
 *   TC-021  — Low-confidence model (score=40) renders emergency callout
 *   TC-025  — Empty concepts array renders empty state callout
 *   TC-055  — Keyboard: tablist present in rendered output
 *   TC-057  — 503 error renders error callout
 *
 * Mock contract: all fixture field names are camelCase per api.types.ts
 * (XSTAGE-S5-011 compliance — mock shape must match OpenAPI contract).
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { vi, describe, it, expect } from 'vitest';
import BusinessModelReview from '../../src/pages/BusinessModelReview';
import { server } from '../handlers/sessions';
import {
  businessModelGetLowConfHandler,
  businessModelGetEmptyHandler,
  mockBusinessModelFull,
  mockBusinessModelLowConf,
} from '../handlers/businessModel';

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

vi.mock('../../src/components/ConfidenceBadge', () => ({
  default: ({ score }: { score: number }) => (
    <span data-testid="confidence-badge" data-score={score}>{score}</span>
  ),
}));

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
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
    heading?: string;
    type: string;
  }) => (
    <div role="alert" data-type={type} data-testid={`callout-${type}`}>
      {heading && <strong>{heading}</strong>}
      {children}
    </div>
  ),
  GoACircularProgress: ({ message }: { message: string }) => (
    <div role="status">{message}</div>
  ),
  GoADropdown: ({
    children,
    onChange,
    name,
    value,
    disabled,
  }: {
    children: React.ReactNode;
    onChange?: (n: string, v: string | string[]) => void;
    name: string;
    value: string;
    disabled?: boolean;
  }) => (
    <select
      data-name={name}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(name, e.target.value)}
    >
      {children}
    </select>
  ),
  GoADropdownItem: ({ value, label }: { value: string; label: string }) => (
    <option value={value}>{label}</option>
  ),
  GoAFormItem: ({
    children,
    label,
    helpText,
  }: {
    children: React.ReactNode;
    label: string;
    helpText?: string;
  }) => (
    <div>
      <label>{label}</label>
      {helpText && <small>{helpText}</small>}
      {children}
    </div>
  ),
  GoATable: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
  GoABadge: ({ content }: { content: string }) => (
    <span data-testid="badge">{content}</span>
  ),
}));

const BASE_URL = 'http://localhost:3000/api/v1';

const renderPage = () =>
  render(
    <MemoryRouter>
      <BusinessModelReview />
    </MemoryRouter>,
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('BusinessModelReview — integration (MSW)', () => {

  it('success: GET /model returns business model with concepts → concept tabs render (TC-003)', async () => {
    // TC-003 — default sessions.ts handler returns mockBusinessModel (confidenceScore=75, 1 actor concept)
    // Component now renders 5 tabs matching the expanded ConceptType set
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByRole('tab')).toHaveLength(5);
    });

    expect(screen.getByRole('tab', { name: 'Actors' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Goals & Activities' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rules & Decisions' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Systems' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Evidence & Other' })).toBeInTheDocument();
  });

  it('success: high confidence → success callout rendered (TC-022)', async () => {
    // TC-022 — default fixture has confidenceScore=75
    server.use(
      http.get(`${BASE_URL}/sessions/:sessionId/model`, () =>
        HttpResponse.json(mockBusinessModelFull, { status: 200 }),
      ),
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('callout-success')).toBeInTheDocument();
    });
  });

  it('low confidence: GET /model returns confidence=40 → emergency callout (TC-021)', async () => {
    // TC-021 — override with low-confidence model fixture
    server.use(businessModelGetLowConfHandler);
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/Model confidence is too low to proceed/i)).toBeInTheDocument();
    // Verify confidence score value matches the fixture
    expect(screen.getByTestId('confidence-score')).toHaveTextContent(
      String(mockBusinessModelLowConf.confidenceScore),
    );
  });

  it('empty concepts: GET /model returns concepts=[] → empty state callout (TC-025)', async () => {
    // TC-025 — override with empty concepts model
    server.use(businessModelGetEmptyHandler);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/No business concepts have been extracted yet/i),
      ).toBeInTheDocument();
    });
    // Empty concepts → canConfirm=false → Confirm button disabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Confirm Business Model/i }),
      ).toBeDisabled();
    });
  });

  it('error: GET /model returns 503 → error callout (TC-057)', async () => {
    // TC-057
    server.use(
      http.get(`${BASE_URL}/sessions/:sessionId/model`, () =>
        HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 }),
      ),
    );
    renderPage();

    await waitFor(() => {
      // getByTestId throws on multiple; use getAllByTestId[0] in case the component renders
      // more than one emergency callout (e.g. from a concurrent data-fetch failure)
      expect(screen.getAllByTestId('callout-emergency')[0]).toBeInTheDocument();
    });
  });

  it('success: tablist present in rendered output — keyboard accessibility (TC-055)', async () => {
    // TC-055 — 5 concept tabs rendered in tablist
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });
});
