/**
 * HypothesisReview.test.tsx — Unit tests for hypothesis-review page (wizard-step-review).
 *
 * TC Coverage:
 *   TC-003  — Policy notice referencing ATIA s.23 present
 *   TC-021  — Locked state when hypothesis null:
 *             confidence < 70 → "Hypothesis not yet available" callout
 *             confidence >= 70 → "Ready to generate hypothesis" callout + Generate button
 *   TC-022  — Unlocked state: summary + accept button when hypothesis available
 *   TC-055  — Keyboard: action buttons are focusable (not disabled incorrectly)
 *   TC-057  — Error callout on API failure
 *   TC-088  — Superseded hypothesis treated as locked (filtered out → null)
 *
 * Business Rules:
 *   BR-004: Business Model Completeness Confidence for Hypothesis Generation — locked state
 *           shown when confidence < 70 (API-enforced gate tested via null hypothesis fixture).
 *   BR-010: Solution Hypothesis Status Transition Rules — API-enforced; Accept/Revision buttons
 *           only enabled for 'proposed' status; superseded status maps to locked state (TC-088).
 *
 * Security (Protected B — ATIA s.23):
 *   FAC-S5-025 — hypothesis.summary and hypothesis.reasoning via MaskedField
 *   FAC-S5-026 — no localStorage.setItem / sessionStorage.setItem during lifecycle
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import HypothesisReview from '../src/pages/HypothesisReview';

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

// vi.hoisted prevents TDZ ReferenceError (FAC-S5-015 / ci-orchestrator skill §4)
const mockApi = vi.hoisted(() => ({
  listHypotheses: vi.fn(),
  updateHypothesisStatus: vi.fn(),
  getBusinessModel: vi.fn(),
  generateHypothesis: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: mockApi,
}));

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
  ),
  GoAButton: ({
    children,
    onClick,
    disabled,
    type: _type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
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

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const makeHypothesis = (overrides: Record<string, unknown> = {}) => ({
  id: 'hyp-001',
  sessionId: 'session-001',
  status: 'proposed' as const,
  summary:
    'Deploy form-service and notification-service to modernise grants application processing.',
  reasoning:
    'The form-service provides structured data collection aligned with GoA standards.',
  version: 1,
  patternId: 'pattern-grants-digitisation',
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
  ...overrides,
});

const makePaginatedHypotheses = (items: ReturnType<typeof makeHypothesis>[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  totalPages: items.length > 0 ? 1 : 0,
});

const makeBusinessModel = (overrides: Record<string, unknown> = {}) => ({
  id: 'bm-001',
  sessionId: 'session-001',
  confidenceScore: 84,
  problemSummary: 'Digitise grants application processing.',
  concepts: [],
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <HypothesisReview />
    </MemoryRouter>,
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('HypothesisReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: hypothesis present (proposed) + high confidence business model
    mockApi.listHypotheses.mockResolvedValue(
      makePaginatedHypotheses([makeHypothesis()]),
    );
    mockApi.updateHypothesisStatus.mockResolvedValue(
      makeHypothesis({ status: 'accepted' }),
    );
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel());
    mockApi.generateHypothesis.mockResolvedValue({ id: 'hyp-draft-001', status: 'draft' });
    mockApi.sendMessage.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── TC-021: locked state — confidence < 70 ───────────────────────────────

  it('renders "Hypothesis not yet available" callout when confidence < 70 (TC-021)', async () => {
    // TC-021 — low confidence → locked state shows "not yet available"
    mockApi.listHypotheses.mockResolvedValue(makePaginatedHypotheses([]));
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 50 }));
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(screen.getByText(/Hypothesis not yet available/i)).toBeInTheDocument();
  });

  it('does not render Accept Hypothesis button in locked state (TC-021)', async () => {
    // TC-021
    mockApi.listHypotheses.mockResolvedValue(makePaginatedHypotheses([]));
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 50 }));
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: /Accept Hypothesis/i })).not.toBeInTheDocument();
  });

  it('does not render Generate Hypothesis button when confidence < 70 (TC-021)', async () => {
    // TC-021 — generate button only shown when confidence >= 70
    mockApi.listHypotheses.mockResolvedValue(makePaginatedHypotheses([]));
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 50 }));
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: /Generate Hypothesis/i })).not.toBeInTheDocument();
  });

  // ── TC-021: locked state — confidence >= 70 ──────────────────────────────

  it('renders "Ready to generate hypothesis" callout when confidence >= 70 and no hypothesis (TC-021)', async () => {
    // TC-021 — high confidence + no hypothesis → generate callout
    mockApi.listHypotheses.mockResolvedValue(makePaginatedHypotheses([]));
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 84 }));
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(screen.getByText(/Ready to generate hypothesis/i)).toBeInTheDocument();
  });

  it('renders Generate Hypothesis button when confidence >= 70 and no hypothesis (TC-021)', async () => {
    // TC-021 — generate button appears at high confidence
    mockApi.listHypotheses.mockResolvedValue(makePaginatedHypotheses([]));
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 84 }));
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: /Generate Hypothesis/i })).toBeInTheDocument();
  });

  it('calls api.generateHypothesis when Generate Hypothesis button is clicked (TC-021)', async () => {
    // TC-021 — generate flow triggers API call
    mockApi.listHypotheses.mockResolvedValue(makePaginatedHypotheses([]));
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 84 }));
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Generate Hypothesis/i }));

    await waitFor(() => {
      expect(mockApi.generateHypothesis).toHaveBeenCalledWith('session-001');
    });
  });

  // ── TC-022: unlocked state ─────────────────────────────────────────────────

  it('renders hypothesis summary in unlocked state (TC-022)', async () => {
    // TC-022 — default fixture is proposed hypothesis
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(screen.getByText('Hypothesis Summary')).toBeInTheDocument();
  });

  it('renders Accept Hypothesis button enabled in unlocked state (TC-022)', async () => {
    // TC-022
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    const acceptBtn = screen.getByRole('button', { name: /Accept Hypothesis/i });
    expect(acceptBtn).toBeInTheDocument();
    expect(acceptBtn).not.toBeDisabled();
  });

  it('calls api.updateHypothesisStatus with accepted status on Accept click (TC-022)', async () => {
    // TC-022
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Accept Hypothesis/i }));

    await waitFor(() => {
      expect(mockApi.updateHypothesisStatus).toHaveBeenCalledWith(
        'session-001',
        'hyp-001',
        { status: 'accepted' },
      );
    });
  });

  it('navigates to export page after accepting hypothesis (TC-022)', async () => {
    // TC-022
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Accept Hypothesis/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sessions/session-001/export');
    });
  });

  // ── TC-088: superseded hypothesis ─────────────────────────────────────────

  it('renders locked state notice when the only hypothesis is superseded (TC-088)', async () => {
    // TC-088 — superseded hypothesis filtered out → null → locked state shown
    mockApi.listHypotheses.mockResolvedValue(
      makePaginatedHypotheses([makeHypothesis({ status: 'superseded' })]),
    );
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 50 }));
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(screen.getByText(/Hypothesis not yet available/i)).toBeInTheDocument();
  });

  // ── FAC-S5-025: MaskedField for Protected B fields ────────────────────────

  it('renders hypothesis.summary via MaskedField (FAC-S5-025)', async () => {
    // FAC-S5-025 — ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(
      screen.getByTestId('masked-field-solutionHypothesis.summary'),
    ).toBeInTheDocument();
  });

  it('renders hypothesis.reasoning via MaskedField when present (FAC-S5-025)', async () => {
    // FAC-S5-025 — ✓ ASVS:V-8.3.1
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(
      screen.getByTestId('masked-field-solutionHypothesis.reasoning'),
    ).toBeInTheDocument();
  });

  // ── FAC-S5-026: no browser storage writes ─────────────────────────────────

  it('does not write Protected B fields to localStorage (FAC-S5-026)', async () => {
    // FAC-S5-026 — ✓ ASVS:V-8.3.1
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not write to sessionStorage (FAC-S5-026)', async () => {
    // FAC-S5-026
    const sessionSpy = vi.spyOn(window.sessionStorage, 'setItem');
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(sessionSpy).not.toHaveBeenCalled();
  });

  // ── TC-003: policy notice ──────────────────────────────────────────────────

  it('policy notice referencing ATIA s.23 is present in DOM (TC-003)', async () => {
    // TC-003
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    expect(screen.getByText(/ATIA s\.23/)).toBeInTheDocument();
  });

  // ── TC-055: keyboard navigation ───────────────────────────────────────────

  it('action buttons are present and focusable in unlocked state (TC-055)', async () => {
    // TC-055
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    const acceptBtn = screen.getByRole('button', { name: /Accept Hypothesis/i });
    const revisionBtn = screen.getByRole('button', { name: /Submit Revision/i });
    expect(acceptBtn).toBeInTheDocument();
    expect(revisionBtn).toBeInTheDocument();
    // Accept button must not be disabled
    expect(acceptBtn).not.toBeDisabled();
    // Submit Revision is disabled until revision note entered
    expect(revisionBtn).toBeDisabled();
  });

  it('Submit Revision button enabled after entering revision note (TC-055)', async () => {
    // TC-055 — revision button becomes enabled when note.trim() is non-empty
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Please adjust the service recommendations.' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Revision/i })).not.toBeDisabled();
    });
  });

  // ── TC-057: API error ──────────────────────────────────────────────────────

  it('renders error callout on listHypotheses API failure (TC-057)', async () => {
    // TC-057
    mockApi.listHypotheses.mockRejectedValue(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
  });

  // ── GoADetails collapsible reasoning (TC-022) ───────────────────────────

  it('Planning Agent Reasoning section is rendered as collapsible GoADetails (TC-022)', async () => {
    // TC-022
    renderPage();
    await waitFor(() => expect(mockApi.listHypotheses).toHaveBeenCalled());

    // GoADetails mock renders as <details> with <summary>
    const details = screen.getByTestId('details-reasoning');
    expect(details).toBeInTheDocument();
    expect(screen.getByText('Planning Agent Reasoning')).toBeInTheDocument();
  });
});
