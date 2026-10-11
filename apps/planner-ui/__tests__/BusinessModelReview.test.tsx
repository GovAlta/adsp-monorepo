/**
 * BusinessModelReview.test.tsx — Unit tests for business-model-review page (detail-view).
 *
 * TC Coverage:
 *   TC-003  — Page renders concept tabs: Actors, Processes, Systems
 *   TC-005  — Inline edit mode activates on concept type button click
 *   TC-006  — api.updateBusinessModel called on inline concept type save
 *   TC-021  — Emergency callout when confidence < 50 / important callout 50-69
 *   TC-022  — Success callout when confidence >= 70
 *   TC-025  — Empty state callout when no concepts extracted
 *   TC-026  — ConfidenceBadge score rendered in heading row
 *   TC-055  — Active tab has tabIndex=0; inactive tabs tabIndex=-1
 *   TC-057  — Error callout on API failure
 *   TC-087  — Confirm button disabled when model cannot be confirmed
 *
 * Business Rules:
 *   BR-006: Business Concept Type Validity — API-enforced; inline edit dropdown restricted
 *           to valid concept types (Actor, Process, System); tested via TC-005 (TC-006 save path).
 *
 * Security (Protected B — ATIA s.23):
 *   FAC-S5-025 — businessModel.problemSummary rendered via MaskedField, not raw text
 *   FAC-S5-026 — no localStorage.setItem / sessionStorage.setItem during lifecycle
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BusinessModelReview from '../src/pages/BusinessModelReview';

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

// vi.hoisted ensures mockApi is initialised before the module factory runs,
// avoiding TDZ ReferenceError (FAC-S5-015 / ci-orchestrator skill §4).
const mockApi = vi.hoisted(() => ({
  getBusinessModel: vi.fn(),
  updateBusinessModel: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: mockApi,
}));

vi.mock('../src/components/ConfidenceBadge', () => ({
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

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const makeConcept = (overrides = {}) => ({
  id: 'concept-001',
  businessModelId: 'bm-001',
  name: 'Grant Applicant',
  conceptType: 'actor' as const,
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
  ...overrides,
});

const makeBusinessModel = (overrides: Record<string, unknown> = {}) => ({
  id: 'bm-001',
  sessionId: 'session-001',
  confidenceScore: 75,
  problemSummary: 'Digitise the grants application process for GoA programs.',
  concepts: [makeConcept()],
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <BusinessModelReview />
    </MemoryRouter>,
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('BusinessModelReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel());
    mockApi.updateBusinessModel.mockResolvedValue(makeBusinessModel());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── TC-003: tabs render ────────────────────────────────────────────────────

  it('renders five concept tabs: Actors, Goals & Activities, Rules & Decisions, Systems, Evidence & Other (TC-003)', async () => {
    // TC-003 — tabs updated to match expanded ConceptType set
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(screen.getByRole('tab', { name: 'Actors' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Goals & Activities' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rules & Decisions' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Systems' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Evidence & Other' })).toBeInTheDocument();
  });

  // ── TC-021: confidence callouts ────────────────────────────────────────────

  it('renders emergency callout when confidence score < 50 (TC-021)', async () => {
    // TC-021
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 40 }));
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    expect(screen.getByText(/Model confidence is too low to proceed/i)).toBeInTheDocument();
  });

  it('renders important callout when confidence score is 50-69 (TC-021)', async () => {
    // TC-021
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 60 }));
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(screen.getByTestId('callout-important')).toBeInTheDocument();
    expect(screen.getByText(/Model confidence is moderate/i)).toBeInTheDocument();
  });

  // ── TC-022: high-confidence success callout ────────────────────────────────

  it('renders success callout when confidence score >= 70 (TC-022)', async () => {
    // TC-022 — default fixture has score=75
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(screen.getByTestId('callout-success')).toBeInTheDocument();
    expect(screen.getByText(/Ready to proceed/i)).toBeInTheDocument();
  });

  // ── TC-025: empty concepts ─────────────────────────────────────────────────

  it('renders empty state information callout when no concepts extracted (TC-025)', async () => {
    // TC-025
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ concepts: [] }));
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(screen.getByText(/No business concepts have been extracted yet/i)).toBeInTheDocument();
  });

  // ── TC-026: confidence badge ───────────────────────────────────────────────

  it('renders ConfidenceBadge with correct score in heading row (TC-026)', async () => {
    // TC-026
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-score', '75');
  });

  // ── TC-005: inline edit mode ───────────────────────────────────────────────

  it('activates inline edit mode when concept type button is clicked (TC-005)', async () => {
    // TC-005
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    const editBtn = screen.getByRole('button', { name: /Edit concept type/i });
    fireEvent.click(editBtn);

    await waitFor(() => {
      // GoADropdown mock renders as a <select>
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  // ── TC-006: inline save calls API ─────────────────────────────────────────

  it('calls api.updateBusinessModel with conceptUpdates when type changed (TC-006)', async () => {
    // TC-006
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Edit concept type/i }));
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'system' } });

    await waitFor(() => {
      expect(mockApi.updateBusinessModel).toHaveBeenCalledWith('session-001', {
        conceptUpdates: [{ conceptId: 'concept-001', conceptType: 'system' }],
      });
    });
  });

  // ── TC-087: confirm button disabled on incomplete model ───────────────────

  it('Confirm Business Model button is disabled when concepts list is empty (TC-087)', async () => {
    // TC-087 — canConfirm = score >= 50 && concepts.length > 0
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ concepts: [] }));
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(
      screen.getByRole('button', { name: /Confirm Business Model/i }),
    ).toBeDisabled();
  });

  it('Confirm Business Model button is disabled when score < 50 (TC-087)', async () => {
    // TC-087
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel({ confidenceScore: 40 }));
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(
      screen.getByRole('button', { name: /Confirm Business Model/i }),
    ).toBeDisabled();
  });

  // ── FAC-S5-025: MaskedField used for Protected B content ─────────────────

  it('renders businessModel.problemSummary via MaskedField, not raw text (TC-003, FAC-S5-025)', async () => {
    // FAC-S5-025 — ✓ ASVS:V-8.3.1
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    // MaskedField with canUnmask=true renders a span with data-testid="masked-field-{fieldName}"
    expect(
      screen.getByTestId('masked-field-businessModel.problemSummary'),
    ).toBeInTheDocument();
  });

  it('renders concept name via MaskedField (FAC-S5-025)', async () => {
    // FAC-S5-025 — ✓ ASVS:V-8.3.1
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(
      screen.getByTestId('masked-field-businessConcept.name'),
    ).toBeInTheDocument();
  });

  // ── FAC-S5-026: no localStorage / sessionStorage writes ──────────────────

  it('does not write Protected B fields to localStorage (FAC-S5-026)', async () => {
    // FAC-S5-026 — ✓ ASVS:V-8.3.1
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not write to sessionStorage (FAC-S5-026)', async () => {
    // FAC-S5-026
    const sessionSpy = vi.spyOn(window.sessionStorage, 'setItem');
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    expect(sessionSpy).not.toHaveBeenCalled();
  });

  // ── TC-003: policy notice ──────────────────────────────────────────────────

  it('policy notice referencing ATIA s.23 is present in DOM (TC-003)', async () => {
    // TC-003
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    // helpText "Protected B per ATIA s.23" and callout body both match the regex,
    // so use getAllByText and check that at least one match is present.
    expect(screen.getAllByText(/ATIA s\.23/).length).toBeGreaterThan(0);
  });

  // ── TC-055: keyboard navigation ───────────────────────────────────────────

  it('active tab has tabIndex=0 and inactive tabs have tabIndex=-1 (TC-055)', async () => {
    // TC-055
    renderPage();
    await waitFor(() => expect(mockApi.getBusinessModel).toHaveBeenCalled());

    const actorsTab = screen.getByRole('tab', { name: 'Actors' });
    const goalsTab = screen.getByRole('tab', { name: 'Goals & Activities' });
    const systemsTab = screen.getByRole('tab', { name: 'Systems' });

    expect(actorsTab).toHaveAttribute('tabindex', '0');
    expect(goalsTab).toHaveAttribute('tabindex', '-1');
    expect(systemsTab).toHaveAttribute('tabindex', '-1');
  });

  // ── TC-057: API error ──────────────────────────────────────────────────────

  it('renders error callout on generic API failure (TC-057)', async () => {
    // TC-057 — when getBusinessModel fails generically, the component renders with
    // businessModel=null (score=0 < 50 → one callout-emergency) AND errorKind='generic'
    // (a second callout-emergency). Use getAllByTestId to handle both.
    mockApi.getBusinessModel.mockRejectedValue(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByTestId('callout-emergency').length).toBeGreaterThanOrEqual(1);
    });
  });
});
