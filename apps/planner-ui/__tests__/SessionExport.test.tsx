/**
 * SessionExport.test.tsx — Unit tests for session-export page (detail-view).
 *
 * TC Coverage:
 *   TC-030  — Export locked when hypothesis not accepted
 *   TC-031  — DOCX export documented as future-state (FS-002 pending)
 *   TC-032  — Three tabs: Business Model Summary, Hypothesis Summary, Specialist Consultations
 *   TC-033  — Policy notice referencing POPA s.17 present (role-based rendering)
 *   TC-034  — api.initiateExport called with format in request body (NOT query string)
 *   TC-055  — Export button focusable; enabled when hypothesis accepted
 *   TC-057  — Error callout on API failure
 *
 * Security (Protected B — ATIA s.23, POPA s.17):
 *   FAC-S5-024 — format param passed in POST body, never in URL query string
 *   FAC-S5-025 — session.title and hypothesis.summary rendered via MaskedField
 *   FAC-S5-026 — no localStorage.setItem / sessionStorage.setItem during lifecycle
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SessionExport from '../src/pages/SessionExport';

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
  getSession: vi.fn(),
  getBusinessModel: vi.fn(),
  listHypotheses: vi.fn(),
  initiateExport: vi.fn(),
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
  GoABadge: ({ content, type: _type }: { content: string; type?: string }) => (
    <span data-testid="badge">{content}</span>
  ),
  GoAFormItem: ({
    children,
    label,
  }: {
    children: React.ReactNode;
    label: string;
  }) => (
    <div>
      <label>{label}</label>
      {children}
    </div>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-001',
  userId: 'user-abc',
  tenantId: 'tenant-xyz',
  title: 'Grants Modernization',
  status: 'active' as const,
  businessProblemSummary: 'Digitise the grants application process.',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-15T14:30:00Z',
  ...overrides,
});

const makeBusinessModel = () => ({
  id: 'bm-001',
  sessionId: 'session-001',
  confidenceScore: 75,
  concepts: [],
  version: 1,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:00:00Z',
});

const makeHypothesis = (status: string = 'accepted') => ({
  id: 'hyp-001',
  sessionId: 'session-001',
  status,
  summary: 'Deploy form-service and notification-service.',
  reasoning: 'Structured data collection aligned with GoA standards.',
  version: 1,
  patternId: 'pattern-grants',
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-21T09:00:00Z',
});

const makeExportRecord = () => ({
  id: 'export-001',
  sessionId: 'session-001',
  format: 'json' as const,
  status: 'completed',
  downloadUrl: 'http://localhost:3000/downloads/export-001.json',
  createdAt: '2026-10-01T10:00:00Z',
});

const makeHypothesesResult = (items: ReturnType<typeof makeHypothesis>[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  totalPages: items.length > 0 ? 1 : 0,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <SessionExport />
    </MemoryRouter>,
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('SessionExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getSession.mockResolvedValue(makeSession());
    mockApi.getBusinessModel.mockResolvedValue(makeBusinessModel());
    mockApi.listHypotheses.mockResolvedValue(
      makeHypothesesResult([makeHypothesis('accepted')]),
    );
    mockApi.initiateExport.mockResolvedValue(makeExportRecord());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── TC-032: three tabs render ──────────────────────────────────────────────

  it('renders three tabs: Business Model Summary, Hypothesis Summary, Specialist Consultations (TC-032)', async () => {
    // TC-032
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    expect(screen.getByRole('tab', { name: /Business Model Summary/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Hypothesis Summary/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Specialist Consultations/i })).toBeInTheDocument();
  });

  // ── TC-030: export locked when no accepted hypothesis ────────────────────

  it('export button disabled when no accepted hypothesis (TC-030)', async () => {
    // TC-030 — no accepted hypothesis means canExport=false
    mockApi.listHypotheses.mockResolvedValue(
      makeHypothesesResult([makeHypothesis('proposed')]),
    );
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    expect(
      screen.getByRole('button', { name: /Download JSON Export/i }),
    ).toBeDisabled();
  });

  it('export locked callout shown when hypothesis not accepted (TC-030)', async () => {
    // TC-030
    mockApi.listHypotheses.mockResolvedValue(
      makeHypothesesResult([makeHypothesis('proposed')]),
    );
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    expect(screen.getByText(/Export locked/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This session cannot be exported until the hypothesis has been reviewed/i),
    ).toBeInTheDocument();
  });

  // ── TC-034: export button enabled + api called ────────────────────────────

  it('Download JSON Export button enabled when hypothesis accepted (TC-030, TC-034)', async () => {
    // TC-030, TC-034
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    const btn = screen.getByRole('button', { name: /Download JSON Export/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls api.initiateExport with format in request body, not query string (TC-034, FAC-S5-024)', async () => {
    // TC-034, FAC-S5-024 — format must be in POST body per FAC-S5-024
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    // Mock DOM anchor click to prevent JSDOM errors
    const mockClick = vi.fn();
    const mockAnchor = { href: '', download: '', click: mockClick, remove: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementationOnce(() => mockAnchor as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockImplementationOnce(() => mockAnchor as unknown as Node);

    fireEvent.click(screen.getByRole('button', { name: /Download JSON Export/i }));

    await waitFor(() => {
      expect(mockApi.initiateExport).toHaveBeenCalledWith(
        'session-001',
        { format: 'json' },
      );
    });
  });

  // ── TC-031: DOCX future-state ─────────────────────────────────────────────

  it('DOCX export button is absent — TC-031 maps to FS-002 pending (TC-031)', async () => {
    // TC-031 — DOCX export not implemented in this release; FS-002 pending
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    // Only the JSON export button exists; no DOCX button rendered
    expect(screen.queryByRole('button', { name: /DOCX/i })).not.toBeInTheDocument();
    // JSON export button is the only download action
    expect(screen.getByRole('button', { name: /Download JSON Export/i })).toBeInTheDocument();
  });

  // ── FAC-S5-025: MaskedField for Protected B fields ────────────────────────

  it('renders session.title via MaskedField, not raw text (FAC-S5-025)', async () => {
    // FAC-S5-025 — ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    expect(
      screen.getByTestId('masked-field-planningSession.title'),
    ).toBeInTheDocument();
  });

  it('renders hypothesis.summary via MaskedField in Hypothesis tab (FAC-S5-025)', async () => {
    // FAC-S5-025 — ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    // Switch to the Hypothesis Summary tab
    fireEvent.click(screen.getByRole('tab', { name: /Hypothesis Summary/i }));

    await waitFor(() => {
      expect(
        screen.getByTestId('masked-field-solutionHypothesis.summary'),
      ).toBeInTheDocument();
    });
  });

  // ── FAC-S5-026: no browser storage writes ─────────────────────────────────

  it('does not write Protected B fields to localStorage (FAC-S5-026)', async () => {
    // FAC-S5-026 — ✓ ASVS:V-8.3.1
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not write to sessionStorage (FAC-S5-026)', async () => {
    // FAC-S5-026
    const sessionSpy = vi.spyOn(window.sessionStorage, 'setItem');
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    expect(sessionSpy).not.toHaveBeenCalled();
  });

  // ── TC-033: policy notice ──────────────────────────────────────────────────

  it('policy notice referencing POPA s.17 and ATIA s.23 present in DOM (TC-033)', async () => {
    // TC-033
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    expect(screen.getByText(/POPA s\.17/)).toBeInTheDocument();
    expect(screen.getByText(/ATIA s\.23/)).toBeInTheDocument();
  });

  // ── TC-055: export button focusable when enabled ──────────────────────────

  it('Download JSON Export button is focusable when hypothesis is accepted (TC-055)', async () => {
    // TC-055
    renderPage();
    await waitFor(() => expect(mockApi.getSession).toHaveBeenCalled());

    const btn = screen.getByRole('button', { name: /Download JSON Export/i });
    expect(btn).not.toBeDisabled();
    btn.focus();
    expect(btn).toHaveFocus();
  });

  // ── TC-057: API error ──────────────────────────────────────────────────────

  it('renders error callout on getSession API failure (TC-057)', async () => {
    // TC-057
    mockApi.getSession.mockRejectedValue(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
  });
});
