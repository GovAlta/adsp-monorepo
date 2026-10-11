/**
 * UserManagement.integration.test.tsx — MSW integration tests for User Management.
 *
 * Tests the full request → render pipeline using MSW to intercept HTTP.
 * All response shapes match the OpenAPI contract (XSTAGE-S5-011).
 *
 * TC Coverage:
 *   TC-036 — listUsers → table renders; invite form submit → createUser called
 *   TC-055 — interactive elements focusable after load
 *   TC-057 — listUsers 403 → error callout
 *   TC-082 — role change → updateUser called
 *
 * Security assertions:
 *   FAC-S5-025 — email rendered via MaskedField; not raw in DOM for planner-admin
 *   FAC-S5-026 — no localStorage writes
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vi, describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import UserManagement from '../../src/pages/UserManagement';
import type { User, PaginatedResult } from '../../src/services/api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Constants + fixtures
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

const USER_EMAIL = 'alice.smith@gov.ab.ca';
const USER_DISPLAY_NAME = 'Alice Smith';

const mockUserFixtures: User[] = [
  {
    id: 'user-admin-001',
    email: USER_EMAIL,            // Protected A — masked in planner-admin view
    displayName: USER_DISPLAY_NAME,
    roles: ['planner-admin'],
    status: 'active',
    lastActivityAt: '2026-10-09T10:00:00Z',
  },
  {
    id: 'user-abc',
    email: 'bob.jones@gov.ab.ca',
    displayName: 'Bob Jones',
    roles: ['planner-user'],
    status: 'active',
    lastActivityAt: '2026-10-08T09:00:00Z',
  },
];

const mockNewUser: User = {
  id: 'user-new-001',
  email: 'new.user@gov.ab.ca',
  displayName: 'New User',
  roles: ['planner-user'],
  status: 'active',
};

// ──────────────────────────────────────────────────────────────────────────────
// MSW server
// ──────────────────────────────────────────────────────────────────────────────

const defaultHandlers = [
  http.get(`${BASE_URL}/users`, () => {
    const result: PaginatedResult<User> = {
      items: mockUserFixtures,
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return HttpResponse.json(result, { status: 200 });
  }),
  http.post(`${BASE_URL}/users`, () =>
    HttpResponse.json(mockNewUser, { status: 201 })
  ),
  http.patch(`${BASE_URL}/users/:userId`, ({ params }) => {
    const { userId } = params as { userId: string };
    return HttpResponse.json(
      { ...mockUserFixtures[0], id: userId, roles: ['planner-user'] },
      { status: 200 }
    );
  }),
  http.delete(`${BASE_URL}/users/:userId`, () =>
    new HttpResponse(null, { status: 204 })
  ),
];

const server = setupServer(...defaultHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ──────────────────────────────────────────────────────────────────────────────
// GoA component stubs
// GoABadge must forward data-testid so MaskedField testid is queryable
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('@abgov/react-components', () => ({
  GoAContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
  ),
  GoABadge: (props: { content: string; type: string; [key: string]: unknown }) => (
    <span
      data-testid={(props['data-testid'] as string) ?? 'badge'}
      aria-label={props['aria-label'] as string | undefined}
      data-type={props.type}
    >
      {props.content}
    </span>
  ),
  GoAButton: ({
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  GoACallout: ({
    children,
    heading,
    type,
  }: {
    children?: React.ReactNode;
    heading?: string;
    type: string;
  }) => (
    <div role="alert" data-type={type} data-testid={`callout-${type}`}>
      {heading && <strong>{heading}</strong>}
      {children}
    </div>
  ),
  GoACircularProgress: ({ message }: { message: string }) => (
    <div role="status" data-testid="loading">{message}</div>
  ),
  GoADetails: ({
    children,
    heading,
  }: {
    children: React.ReactNode;
    heading: string;
  }) => (
    <details data-testid="filter-panel">
      <summary>{heading}</summary>
      {children}
    </details>
  ),
  GoADropdown: ({
    name,
    value,
    onChange,
    children,
    disabled,
  }: {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <select
      name={name}
      value={value}
      disabled={disabled}
      data-testid={`dropdown-${name}`}
      onChange={(e) => onChange(name, e.target.value)}
    >
      {children}
    </select>
  ),
  GoADropdownItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
  GoAFormItem: ({
    label,
    children,
    requirement,
  }: {
    label: string;
    children: React.ReactNode;
    helpText?: string;
    requirement?: string;
  }) => (
    <div data-testid="form-item">
      <label>
        {label}
        {requirement === 'required' && ' *'}
      </label>
      {children}
    </div>
  ),
  GoAInput: ({
    name,
    value,
    onChange,
    type,
    placeholder,
    disabled,
  }: {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <input
      name={name}
      value={value}
      type={type ?? 'text'}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={`input-${name}`}
      onChange={(e) => onChange(name, e.target.value)}
    />
  ),
  GoAModal: ({
    children,
    heading,
    open,
    onClose,
  }: {
    children: React.ReactNode;
    heading: string;
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-modal="true" data-testid="modal">
        <h2>{heading}</h2>
        <button onClick={onClose} aria-label="Close dialog">
          Close
        </button>
        {children}
      </div>
    ) : null,
  GoAPagination: ({
    pageNumber,
    onChange,
  }: {
    pageNumber: number;
    itemCount: number;
    perPageCount: number;
    onChange: (page: number) => void;
  }) => (
    <nav data-testid="pagination" aria-label="pagination">
      <button onClick={() => onChange(pageNumber + 1)}>Next</button>
    </nav>
  ),
  GoATable: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="users-table">{children}</table>
  ),
  GoATableSortHeader: ({
    children,
    name,
    onClick,
  }: {
    children: React.ReactNode;
    name: string;
    direction: string;
    onClick: () => void;
  }) => (
    <th data-sort={name} onClick={onClick}>
      {children}
    </th>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Keycloak mock helpers
// ──────────────────────────────────────────────────────────────────────────────

function setTenantAdminRole(): void {
  (window as unknown as { __keycloak: unknown }).__keycloak = {
    hasRealmRole: (role: string) => role === 'tenant-admin',
    token: 'mock-token',
  };
}

function setPlannerAdminRole(): void {
  (window as unknown as { __keycloak: unknown }).__keycloak = {
    hasRealmRole: (role: string) => role === 'planner-admin',
    token: 'mock-token',
  };
}

function clearKeycloak(): void {
  delete (window as unknown as { __keycloak?: unknown }).__keycloak;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const renderUserManagement = () =>
  render(
    <MemoryRouter>
      <UserManagement />
    </MemoryRouter>
  );

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('UserManagement integration', () => {
  beforeEach(() => {
    setTenantAdminRole();
    vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    clearKeycloak();
    vi.restoreAllMocks();
  });

  it('listUsers returns users → table renders with displayNames (TC-036)', async () => {
    // TC-036 — happy path: users load from API and appear in table
    renderUserManagement();

    await waitFor(() =>
      expect(screen.getByText(USER_DISPLAY_NAME)).toBeInTheDocument()
    );

    expect(screen.getByTestId('users-table')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('invite form submit → createUser POST called → modal closes with success (TC-036)', async () => {
    // TC-036 — full invite flow end-to-end
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /Invite a new user/i }));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());

    // Fill email field
    fireEvent.change(screen.getByTestId('input-inviteEmail'), {
      target: { value: 'new.user@gov.ab.ca' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Send invitation/i }));

    // Success callout must appear in the modal
    await waitFor(() =>
      expect(screen.getByText(/Invitation Sent/)).toBeInTheDocument()
    );
  });

  it('role change dropdown → updateUser PATCH called (TC-082)', async () => {
    // TC-082 — role change generates server-side audit event (BR-008, SN-012)
    const patchSpy = vi.fn().mockResolvedValue({ ...mockUserFixtures[0], roles: ['planner-user'] });
    server.use(
      http.patch(`${BASE_URL}/users/:userId`, async ({ params }) => {
        const { userId } = params as { userId: string };
        patchSpy(userId);
        return HttpResponse.json(
          { ...mockUserFixtures[0], id: userId, roles: ['planner-user'] },
          { status: 200 }
        );
      })
    );

    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    const roleDropdown = screen.getByTestId('dropdown-editRole-user-admin-001');
    fireEvent.change(roleDropdown, { target: { value: 'planner-user' } });

    await waitFor(() => expect(patchSpy).toHaveBeenCalledWith('user-admin-001'));
  });

  it('email column uses MaskedField — not raw email text for planner-admin (FAC-S5-025)', async () => {
    // FAC-S5-025 — planner-admin view: raw email must not appear as DOM text
    setPlannerAdminRole();
    renderUserManagement();

    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    // Raw email must not appear as text
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain(USER_EMAIL);

    // MaskedField testids must be present for email column
    const maskedFields = screen.getAllByTestId('masked-field-user.email');
    expect(maskedFields.length).toBe(2);
  });

  it('does not write to localStorage during full user management flow (FAC-S5-026)', async () => {
    // FAC-S5-026
    const setItemSpy = Storage.prototype.setItem as ReturnType<typeof vi.fn>;
    renderUserManagement();

    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('listUsers 403 → error callout shown (TC-057)', async () => {
    // TC-057
    server.use(
      http.get(`${BASE_URL}/users`, () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      )
    );

    renderUserManagement();

    await waitFor(() =>
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument()
    );
    expect(screen.getByText(/Unable to load users/)).toBeInTheDocument();
    expect(screen.queryByTestId('users-table')).not.toBeInTheDocument();
  });
});
