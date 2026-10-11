/**
 * NewSessionStart.test.tsx — Unit tests for the new-session-start page (start-page).
 *
 * TC Coverage:
 *   TC-001 — Renders informational INT-001 stub notice; session title form; Start/Cancel actions
 *   TC-037 — Validation error shown when title is empty and form submitted
 *   TC-051 — Session title rendered as text value, never innerHTML — XSS guard
 *   TC-055 — Interactive elements are focusable
 *   TC-057 — Error callout shown on 503 from createSession
 *   TC-099 — Error callout shown on non-2xx from createSession (general error)
 *
 * Security:
 *   FAC-S5-026 — no localStorage.setItem / sessionStorage.setItem during render or submit
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import NewSessionStart from '../src/pages/NewSessionStart';
import type { PlanningSession } from '../src/services/api.types';

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

const mockApi = vi.hoisted(() => ({
  createSession: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: mockApi,
}));

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoAButton: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-type={type}>
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
      <label htmlFor="title-input">{label}</label>
      {error && <span role="alert" data-testid="form-error">{error}</span>}
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
      id="title-input"
      name={name}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange?.(name, e.target.value)}
      data-testid="title-input"
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

const makeSession = (overrides: Partial<PlanningSession> = {}): PlanningSession => ({
  id: 'session-new',
  userId: 'user-abc',
  tenantId: 'tenant-xyz',
  title: 'Test Session',
  status: 'active',
  createdAt: '2026-10-10T00:00:00Z',
  updatedAt: '2026-10-10T00:00:00Z',
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <NewSessionStart />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('NewSessionStart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── FAC-S5-026: no storage writes ────────────────────────────────────────

  it('does not call localStorage.setItem during render (FAC-S5-026)', () => {
    // FAC-S5-026
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    mockApi.createSession.mockResolvedValue(makeSession());
    renderPage();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not call sessionStorage.setItem during render (FAC-S5-026)', () => {
    // FAC-S5-026
    const sessionSetItemSpy = vi.spyOn(window.sessionStorage, 'setItem');
    mockApi.createSession.mockResolvedValue(makeSession());
    renderPage();
    expect(sessionSetItemSpy).not.toHaveBeenCalled();
  });

  // ── INT-001 stub notice (TC-001) ──────────────────────────────────────────

  it('renders the page heading and session title form on page load (TC-001)', () => {
    // TC-001 — INT-001 stub callout removed (MaaS integration active)
    mockApi.createSession.mockResolvedValue(makeSession());
    renderPage();
    expect(screen.getByRole('heading', { name: /Start a New Planning Session/i })).toBeInTheDocument();
    expect(screen.queryByText(/Planning Agent is in test mode/i)).not.toBeInTheDocument();
  });

  it('renders the page heading (TC-001)', () => {
    // TC-001
    renderPage();
    expect(screen.getByRole('heading', { name: /Start a New Planning Session/i })).toBeInTheDocument();
  });

  // ── Validation (TC-037) ───────────────────────────────────────────────────

  it('shows validation error when session title is empty and form submitted (TC-037)', async () => {
    // TC-037
    mockApi.createSession.mockResolvedValue(makeSession());
    renderPage();

    // Submit without entering a title
    fireEvent.click(screen.getByText('Start Planning Session'));

    await waitFor(() => {
      expect(
        screen.getByText(/Enter a session title between 1 and 200 characters/i)
      ).toBeInTheDocument();
    });
    // createSession must NOT have been called
    expect(mockApi.createSession).not.toHaveBeenCalled();
  });

  it('shows validation error when title exceeds 200 characters (TC-037)', async () => {
    // TC-037
    renderPage();
    const input = screen.getByTestId('title-input');
    fireEvent.change(input, { target: { value: 'A'.repeat(201) } });
    fireEvent.click(screen.getByText('Start Planning Session'));

    await waitFor(() => {
      expect(
        screen.getByText(/must not exceed 200 characters/i)
      ).toBeInTheDocument();
    });
  });

  // ── Successful submit (TC-001) ────────────────────────────────────────────

  it('calls api.createSession with trimmed title on submit (TC-001)', async () => {
    // TC-001
    mockApi.createSession.mockResolvedValue(makeSession({ id: 'session-new-123' }));
    renderPage();

    const input = screen.getByTestId('title-input');
    fireEvent.change(input, { target: { value: '  My New Session  ' } });
    fireEvent.click(screen.getByText('Start Planning Session'));

    await waitFor(() => {
      expect(mockApi.createSession).toHaveBeenCalledWith({ title: 'My New Session' });
    });
  });

  it('navigates to /sessions/:id/planning after successful createSession (TC-001)', async () => {
    // TC-001
    mockApi.createSession.mockResolvedValue(makeSession({ id: 'session-new-123' }));
    renderPage();

    const input = screen.getByTestId('title-input');
    fireEvent.change(input, { target: { value: 'My New Session' } });
    fireEvent.click(screen.getByText('Start Planning Session'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sessions/session-new-123/planning');
    });
  });

  // ── XSS / injection guard (TC-051) ───────────────────────────────────────

  it('session title input renders as text value, not innerHTML — no script injection risk (TC-051)', () => {
    // TC-051 — the input element uses value, not dangerouslySetInnerHTML
    renderPage();
    const input = screen.getByTestId('title-input') as HTMLInputElement;
    // Input is an <input> element whose value attribute carries the data safely
    fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });
    // The value property holds the raw string; the DOM does NOT execute it
    expect(input.value).toBe('<script>alert("xss")</script>');
    // There is no <script> tag injected into the document
    expect(document.querySelectorAll('script').length).toBe(0);
  });

  // ── Cancel navigation (TC-001) ────────────────────────────────────────────

  it('Cancel button navigates back to /sessions (TC-001)', () => {
    // TC-001
    renderPage();
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  // ── Error states (TC-057, TC-099) ─────────────────────────────────────────

  it('shows error callout on 503 from createSession (TC-057)', async () => {
    // TC-057
    mockApi.createSession.mockRejectedValue({ status: 503 });
    renderPage();

    const input = screen.getByTestId('title-input');
    fireEvent.change(input, { target: { value: 'A valid title' } });
    fireEvent.click(screen.getByText('Start Planning Session'));

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/system error/i)).toBeInTheDocument();
  });

  it('shows error callout on 400 from createSession (TC-099)', async () => {
    // TC-099
    mockApi.createSession.mockRejectedValue({ status: 400 });
    renderPage();

    const input = screen.getByTestId('title-input');
    fireEvent.change(input, { target: { value: 'Valid Title' } });
    fireEvent.click(screen.getByText('Start Planning Session'));

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid/i)).toBeInTheDocument();
  });

  it('shows error callout on 401 from createSession (TC-099)', async () => {
    // TC-099
    mockApi.createSession.mockRejectedValue({ status: 401 });
    renderPage();

    const input = screen.getByTestId('title-input');
    fireEvent.change(input, { target: { value: 'Valid Title' } });
    fireEvent.click(screen.getByText('Start Planning Session'));

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/sign in again/i)).toBeInTheDocument();
  });

  // ── Keyboard navigation (TC-055) ──────────────────────────────────────────

  it('all interactive elements are focusable (TC-055)', () => {
    // TC-055
    renderPage();
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveAttribute('tabindex', '-1');
    });
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((inp) => {
      expect(inp).not.toHaveAttribute('tabindex', '-1');
    });
  });
});
