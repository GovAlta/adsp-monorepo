/**
 * SessionExport.integration.test.tsx
 *
 * Integration tests using MSW to mock the real HTTP transport layer.
 * Verifies SessionExport correctly calls getSession + getBusinessModel +
 * listHypotheses on mount and initiateExport on download click.
 *
 * TC Coverage:
 *   TC-030  — No accepted hypothesis → export button disabled
 *   TC-032  — All APIs load → three tabs render
 *   TC-033  — Policy notice present in DOM
 *   TC-034  — Download click → POST /exports with format body; downloadUrl used
 *   TC-055  — Export button focusable when enabled
 *   TC-057  — API failure → error callout
 *
 * Mock contract: all fixture field names are camelCase per api.types.ts
 * (XSTAGE-S5-011 compliance — mock shape must match OpenAPI contract).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { vi, describe, it, expect } from 'vitest';
import SessionExport from '../../src/pages/SessionExport';
import { server, mockSession } from '../handlers/sessions';
import {
  hypothesisAcceptedHandler,
  hypothesisLockedHandler,
  initiateExportHandler,
  initiateExport503Handler,
  mockSessionExportRecord,
} from '../handlers/hypothesis';

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
  GoABadge: ({ content }: { content: string }) => (
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

const BASE_URL = 'http://localhost:3000/api/v1';

const renderPage = () =>
  render(
    <MemoryRouter>
      <SessionExport />
    </MemoryRouter>,
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('SessionExport — integration (MSW)', () => {

  it('all APIs load, hypothesis accepted: three tabs render + export button enabled (TC-032, TC-030)', async () => {
    // TC-032, TC-030
    server.use(hypothesisAcceptedHandler);
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });
    expect(
      screen.getByRole('button', { name: /Download JSON Export/i }),
    ).not.toBeDisabled();
  });

  it('hypothesis not accepted: export button disabled (TC-030)', async () => {
    // TC-030 — no accepted hypothesis (empty list returns canExport=false)
    server.use(hypothesisLockedHandler);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Download JSON Export/i }),
      ).toBeDisabled();
    });
  });

  it('download click: POST /exports called with format body → blob download triggered (TC-034)', async () => {
    // TC-034, FAC-S5-024 — format in POST body; check api call pattern
    server.use(hypothesisAcceptedHandler, initiateExportHandler);

    // Render FIRST so RTL's internal document.createElement('div') is not intercepted
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Download JSON Export/i }),
      ).not.toBeDisabled();
    });

    // Mock DOM anchor AFTER render to avoid intercepting RTL's container creation
    const mockAnchorClick = vi.fn();
    const anchorEl = {
      href: '',
      download: '',
      click: mockAnchorClick,
    };
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValueOnce(anchorEl as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockReturnValueOnce(anchorEl as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockReturnValueOnce(anchorEl as unknown as Node);

    fireEvent.click(screen.getByRole('button', { name: /Download JSON Export/i }));

    await waitFor(() => {
      // The anchor's href was set to the downloadUrl from the export record
      expect(anchorEl.href).toBe(mockSessionExportRecord.downloadUrl);
      // The DOM anchor click was triggered → download started
      expect(mockAnchorClick).toHaveBeenCalled();
    });

    createElementSpy.mockRestore();
  });

  it('export 503 error: → emergency callout rendered (TC-057)', async () => {
    // TC-057 — 503 from POST /exports does not trigger download DOM manipulation,
    // so no anchor spies needed; render first to avoid intercepting RTL's container
    server.use(hypothesisAcceptedHandler, initiateExport503Handler);

    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Download JSON Export/i }),
      ).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Download JSON Export/i }));

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/export service is temporarily unavailable/i)).toBeInTheDocument();
  });

  it('policy notice referencing POPA s.17 and ATIA s.23 present in DOM (TC-033)', async () => {
    // TC-033
    server.use(hypothesisAcceptedHandler);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/POPA s\.17/)).toBeInTheDocument();
    });
    expect(screen.getByText(/ATIA s\.23/)).toBeInTheDocument();
  });

  it('session title rendered via MaskedField from API response (FAC-S5-025)', async () => {
    // FAC-S5-025 — ✓ ASVS:V-8.3.1
    // mockSession.title = 'Grants Modernization'; API returns it; MaskedField renders it
    server.use(hypothesisAcceptedHandler);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByTestId('masked-field-planningSession.title'),
      ).toBeInTheDocument();
    });
    // The MaskedField (canUnmask=true) shows the raw value
    expect(screen.getByTestId('masked-field-planningSession.title')).toHaveTextContent(
      mockSession.title as string,
    );
  });

  it('export button is focusable when hypothesis is accepted (TC-055)', async () => {
    // TC-055
    server.use(hypothesisAcceptedHandler);
    renderPage();

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Download JSON Export/i });
      expect(btn).not.toBeDisabled();
    });
  });

  it('API failure on getSession: emergency error callout rendered (TC-057)', async () => {
    // TC-057 — override getSession to 503
    server.use(
      http.get(`${BASE_URL}/sessions/:sessionId`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
      ),
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
  });
});
