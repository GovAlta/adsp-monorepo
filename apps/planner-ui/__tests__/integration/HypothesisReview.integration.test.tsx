/**
 * HypothesisReview.integration.test.tsx
 *
 * Integration tests using MSW to mock the real HTTP transport layer.
 * Verifies HypothesisReview correctly calls GET /sessions/:id/hypotheses
 * and renders the response.
 *
 * TC Coverage:
 *   TC-021  — Empty hypothesis list → locked state callout (confidence < 70)
 *   TC-022  — Proposed hypothesis returned → unlocked state + Accept button
 *   TC-055  — Accept and Submit Revision buttons present in unlocked state
 *   TC-057  — 503 error → error callout
 *   TC-088  — Superseded hypothesis → locked state (filtered out)
 *
 * Mock contract: all fixture field names are camelCase per api.types.ts
 * (XSTAGE-S5-011 compliance — mock shape must match OpenAPI contract).
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import HypothesisReview from '../../src/pages/HypothesisReview';
import { server, mockBusinessModelLow } from '../handlers/sessions';
import {
  hypothesisProposedHandler,
  hypothesisLockedHandler,
  hypothesis503Handler,
  mockHypothesisProposed,
} from '../handlers/hypothesis';

const BASE_URL = 'http://localhost:3000/api/v1';

const lowConfModelHandler = http.get(
  `${BASE_URL}/sessions/:sessionId/model`,
  () => HttpResponse.json(mockBusinessModelLow, { status: 200 }),
);

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
  GoADetails: ({
    children,
    heading,
  }: {
    children: React.ReactNode;
    heading: string;
  }) => (
    <details data-testid="details-reasoning">
      <summary>{heading}</summary>
      {children}
    </details>
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
  GoATextArea: ({
    name,
    value,
    onChange,
    disabled,
    rows,
    placeholder,
  }: {
    name: string;
    value: string;
    onChange?: (n: string, v: string) => void;
    disabled?: boolean;
    rows?: number;
    placeholder?: string;
  }) => (
    <textarea
      name={name}
      value={value}
      disabled={disabled}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange?.(name, e.target.value)}
    />
  ),
  GoABadge: ({ content }: { content: string }) => (
    <span data-testid="badge">{content}</span>
  ),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <HypothesisReview />
    </MemoryRouter>,
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('HypothesisReview — integration (MSW)', () => {

  it('no hypothesis (empty list): → locked state information callout (TC-021)', async () => {
    // TC-021 — empty hypothesis + low confidence → "not yet available" callout
    server.use(hypothesisLockedHandler, lowConfModelHandler);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Hypothesis not yet available/i)).toBeInTheDocument();
    });
    // Accept button must NOT render in locked state
    expect(screen.queryByRole('button', { name: /Accept Hypothesis/i })).not.toBeInTheDocument();
  });

  it('proposed hypothesis: → unlocked state with summary + Accept button (TC-022)', async () => {
    // TC-022 — override with proposed hypothesis
    server.use(hypothesisProposedHandler);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hypothesis Summary')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /Accept Hypothesis/i }),
    ).not.toBeDisabled();
    // MaskedField renders the summary from the fixture
    expect(
      screen.getByTestId('masked-field-solutionHypothesis.summary'),
    ).toBeInTheDocument();
  });

  it('proposed hypothesis: Submit Revision button disabled until note entered (TC-022)', async () => {
    // TC-022 — Submit Revision is disabled when revisionNote is empty
    server.use(hypothesisProposedHandler);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Submit Revision/i }),
      ).toBeDisabled();
    });
  });

  it('503 on listHypotheses: → error callout rendered (TC-057)', async () => {
    // TC-057
    server.use(hypothesis503Handler);
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
  });

  it('superseded hypothesis: → locked state callout rendered (TC-088)', async () => {
    // TC-088 — superseded hypothesis filtered out → null → locked state
    // Low-confidence model override ensures "not yet available" text is shown
    server.use(
      http.get(`${BASE_URL}/sessions/:sessionId/hypotheses`, () =>
        HttpResponse.json(
          {
            items: [{ ...mockHypothesisProposed, status: 'superseded' }],
            total: 1,
            page: 1,
            pageSize: 20,
            totalPages: 1,
          },
          { status: 200 },
        ),
      ),
      lowConfModelHandler,
    );
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/Hypothesis not yet available/i),
      ).toBeInTheDocument();
    });
  });

  it('proposed hypothesis: action buttons present in unlocked state (TC-055)', async () => {
    // TC-055 — Accept Hypothesis and Submit Revision both present in unlocked state
    server.use(hypothesisProposedHandler);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Accept Hypothesis/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /Submit Revision/i }),
    ).toBeInTheDocument();
  });
});
