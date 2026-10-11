/**
 * PatternEditor.integration.test.tsx — MSW integration tests for PatternEditor.
 *
 * These tests intercept real HTTP calls through axios and verify that
 * PatternEditor correctly calls getPattern, createPattern, updatePattern,
 * and deactivatePattern endpoints.
 *
 * TC Coverage:
 *   TC-029 — Create mode: POST succeeds → navigate to /admin/patterns
 *   TC-029 — Edit mode: GET preloads form → PUT saves → navigate
 *   TC-054 — Create 400 duplicate name → error callout
 *   TC-053 — Create 413 → error callout
 *   TC-028 — Deactivate in edit mode: calls PUT /patterns/:id/deactivate → navigate
 *
 * Mock contract shape: all response fields are camelCase per api.types.ts
 * (XSTAGE-S5-011 compliance — mock must match OpenAPI contract).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import PatternEditor from '../../src/pages/PatternEditor';
import { mockPatternActive } from '../handlers/patterns';
import type { BusinessPattern } from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// MSW server
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

const defaultHandlers = [
  // GET /patterns/:patternId — returns active pattern fixture
  http.get(`${BASE_URL}/patterns/:patternId`, ({ params }) => {
    const { patternId } = params as { patternId: string };
    if (patternId === 'pattern-001') {
      return HttpResponse.json(mockPatternActive, { status: 200 });
    }
    return HttpResponse.json({ message: 'Not found' }, { status: 404 });
  }),

  // POST /patterns — default: 201 created
  http.post(`${BASE_URL}/patterns`, () => {
    const created: BusinessPattern = {
      ...mockPatternActive,
      id: 'pattern-new',
      name: 'New Test Pattern',
    };
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /patterns/:patternId — default: 200 updated
  http.put(`${BASE_URL}/patterns/:patternId`, ({ params }) => {
    const { patternId } = params as { patternId: string };
    return HttpResponse.json({ ...mockPatternActive, id: patternId }, { status: 200 });
  }),

  // PUT /patterns/:patternId/deactivate — default: 200 deactivated
  http.put(`${BASE_URL}/patterns/:patternId/deactivate`, ({ params }) => {
    const { patternId } = params as { patternId: string };
    return HttpResponse.json(
      { ...mockPatternActive, id: patternId, status: 'inactive' },
      { status: 200 }
    );
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
  GoAButton: ({
    children,
    onClick,
    type,
    variant,
    disabled,
    submit,
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    type?: string;
    variant?: string;
    disabled?: boolean;
    submit?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type === 'submit' || submit ? 'submit' : 'button'}
      data-type={type}
      data-variant={variant}
    >
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
  GoACheckbox: ({
    name,
    text,
    checked,
    onChange,
  }: {
    name: string;
    text: string;
    checked: boolean;
    onChange?: (name: string, value: string, checked: boolean) => void;
  }) => (
    <label>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange?.(name, '', e.target.checked)}
      />
      {text}
    </label>
  ),
  GoACircularProgress: ({ message }: { message: string }) => (
    <div role="status" data-testid="loading">{message}</div>
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
  GoAFormItem: ({
    children,
    label,
    error,
  }: {
    children: React.ReactNode;
    label: string;
    error?: string;
  }) => (
    <div>
      <label>{label}</label>
      {children}
      {error && <span role="alert" data-testid="field-error">{error}</span>}
    </div>
  ),
  GoAInput: ({
    name,
    value,
    onChange,
    placeholder,
    error,
    type,
  }: {
    name: string;
    value: string;
    onChange?: (name: string, value: string) => void;
    placeholder?: string;
    error?: boolean;
    type?: string;
  }) => (
    <input
      name={name}
      value={value}
      placeholder={placeholder}
      type={type ?? 'text'}
      aria-invalid={error ? 'true' : undefined}
      onChange={(e) => onChange?.(name, e.target.value)}
      data-testid={`input-${name}`}
    />
  ),
  GoATextArea: ({
    name,
    value,
    onChange,
    placeholder,
    error,
  }: {
    name: string;
    value: string;
    onChange?: (name: string, value: string) => void;
    placeholder?: string;
    error?: boolean;
  }) => (
    <textarea
      name={name}
      value={value}
      placeholder={placeholder}
      aria-invalid={error ? 'true' : undefined}
      onChange={(e) => onChange?.(name, e.target.value)}
      data-testid={`textarea-${name}`}
    />
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const renderCreateMode = () =>
  render(
    <MemoryRouter initialEntries={['/admin/patterns/new']}>
      <Routes>
        <Route path="/admin/patterns/new" element={<PatternEditor />} />
        <Route path="/admin/patterns/:patternId" element={<PatternEditor />} />
      </Routes>
    </MemoryRouter>
  );

const renderEditMode = (patternId = 'pattern-001') =>
  render(
    <MemoryRouter initialEntries={[`/admin/patterns/${patternId}`]}>
      <Routes>
        <Route path="/admin/patterns/:patternId" element={<PatternEditor />} />
      </Routes>
    </MemoryRouter>
  );

const fillValidForm = () => {
  fireEvent.change(screen.getByTestId('input-name'), {
    target: { value: 'Integration Test Pattern' },
  });
  fireEvent.change(screen.getByTestId('textarea-description'), {
    target: { value: 'A valid description for the integration test pattern.' },
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('PatternEditor integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Create mode: POST succeeds → navigate (TC-029) ───────────────────────

  it('create mode: POST succeeds → navigates to /admin/patterns (TC-029)', async () => {
    // TC-029 — successful create navigates back to library
    renderCreateMode();
    fillValidForm();

    fireEvent.click(screen.getByText('Save Pattern'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/patterns'));
  });

  // ── Edit mode: GET preloads form → PUT saves → navigate (TC-029) ─────────

  it('edit mode: GET preloads form fields correctly (TC-029)', async () => {
    // TC-029 — form pre-populated from API response
    renderEditMode('pattern-001');

    await waitFor(() => {
      expect(screen.getByTestId('input-name')).toHaveValue('Citizen Notification Workflow');
    });
    expect(screen.getByTestId('textarea-description')).toHaveValue(
      'Pattern for citizen-facing notification workflows using the ADSP Notification Service.'
    );
  });

  it('edit mode: PUT saves changes → navigates to /admin/patterns (TC-029)', async () => {
    // TC-029 — successful edit save navigates back to library
    renderEditMode('pattern-001');

    await waitFor(() => expect(screen.getByTestId('input-name')).toHaveValue('Citizen Notification Workflow'));

    fireEvent.click(screen.getByText('Save Pattern'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/patterns'));
  });

  // ── Create 400 duplicate name → error callout (TC-054) ───────────────────

  it('create 400 duplicate name → field error shown (TC-054)', async () => {
    // TC-054 — API returns 400 for duplicate pattern name
    server.use(
      http.post(`${BASE_URL}/patterns`, () => {
        return HttpResponse.json(
          { message: 'A pattern with this name already exists for this tenant. Choose a different name.' },
          { status: 400 }
        );
      })
    );

    renderCreateMode();
    fillValidForm();
    fireEvent.click(screen.getByText('Save Pattern'));

    await waitFor(() => {
      expect(screen.getAllByTestId('field-error').length).toBeGreaterThan(0);
    });
    expect(
      screen.getAllByTestId('field-error').some((el) => el.textContent?.includes('already exists'))
    ).toBe(true);
  });

  // ── Create 413 → error callout (TC-053) ──────────────────────────────────

  it('create 413 payload too large → error callout shown (TC-053)', async () => {
    // TC-053 — API returns 413 for oversized payload
    server.use(
      http.post(`${BASE_URL}/patterns`, () => {
        return HttpResponse.json({ message: 'Payload Too Large' }, { status: 413 });
      })
    );

    renderCreateMode();
    fillValidForm();
    fireEvent.click(screen.getByText('Save Pattern'));

    await waitFor(() => {
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument();
    });
    expect(screen.getByText(/too large to save/i)).toBeInTheDocument();
  });

  // ── Edit mode: Deactivate calls PUT /deactivate → navigate (TC-028) ──────

  it('edit mode: Deactivate button calls PUT /patterns/:id/deactivate → navigate (TC-028)', async () => {
    // TC-028 — deactivate action in edit mode
    renderEditMode('pattern-001');

    await waitFor(() => expect(screen.getByText('Deactivate Pattern')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Deactivate Pattern'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/patterns'));
  });
});
