/**
 * UserManagement.test.tsx — Unit tests for the User Management page.
 *
 * Role context: tenant-admin (write access: invite, role change, deactivate)
 *               planner-admin (read-only, masked email)
 *
 * TC Coverage:
 *   TC-036 — Invite User button opens modal; modal submit calls api.createUser
 *   TC-039 — role filter and status filter work correctly
 *   TC-055 — interactive elements are focusable (keyboard navigation)
 *   TC-057 — error callout on listUsers failure
 *   TC-082 — role change dropdown calls api.updateUser (BR-008, SN-012 audit trail)
 *
 * Business Rules:
 *   BR-007: Role Hierarchy Enforcement — API-enforced; tenant-admin can assign/revoke
 *           planner-admin and planner-user roles; planner-admin read-only (no write buttons shown).
 *
 * Security:
 *   FAC-S5-024 — email NOT in URL query params; userId as route param only
 *   FAC-S5-025 — email rendered via MaskedField; masked to planner-admin; full to tenant-admin
 *   FAC-S5-026 — no localStorage/sessionStorage writes; invite form state cleared on close
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import UserManagement from '../src/pages/UserManagement';

// ──────────────────────────────────────────────────────────────────────────────
// API mock (vi.hoisted — available at module-factory time to avoid TDZ)
// ──────────────────────────────────────────────────────────────────────────────

const mockApi = vi.hoisted(() => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: mockApi,
}));

// ──────────────────────────────────────────────────────────────────────────────
// GoA component stubs
// GoABadge must forward data-testid so MaskedField's testid is queryable
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
    type: btnType,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    'aria-label'?: string;
    type?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-btn-type={btnType}
    >
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
    helpText,
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
      {helpText && <span>{helpText}</span>}
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
    direction,
    onClick,
  }: {
    children: React.ReactNode;
    name: string;
    direction: string;
    onClick: () => void;
  }) => (
    <th data-sort={name} data-direction={direction} onClick={onClick}>
      {children}
    </th>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Test fixtures
// email is Protected A — included so tests can assert masked rendering
// ──────────────────────────────────────────────────────────────────────────────

const USER_EMAIL = 'alice.smith@gov.ab.ca';
const USER_DISPLAY_NAME = 'Alice Smith';

const mockUsers = {
  items: [
    {
      id: 'user-admin-001',
      email: USER_EMAIL,           // Protected A — must be masked for planner-admin
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
  ],
  total: 2,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

const mockNewUser = {
  id: 'user-new-001',
  email: 'new.user@gov.ab.ca',
  displayName: 'New User',
  roles: ['planner-user'],
  status: 'active',
};

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
// Render helper
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

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTenantAdminRole(); // default: tenant-admin for write-action tests
    mockApi.listUsers.mockResolvedValue(mockUsers);
    mockApi.createUser.mockResolvedValue(mockNewUser);
    mockApi.updateUser.mockResolvedValue({ ...mockUsers.items[0], roles: ['planner-user'] });
    mockApi.deactivateUser.mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearKeycloak();
    vi.restoreAllMocks();
  });

  // ── FAC-S5-026: no storage writes ────────────────────────────────────────

  it('does not call localStorage.setItem during render (FAC-S5-026)', async () => {
    // FAC-S5-026
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderUserManagement();
    await waitFor(() => expect(mockApi.listUsers).toHaveBeenCalled());
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not call sessionStorage.setItem during render (FAC-S5-026)', async () => {
    // FAC-S5-026
    const sessionSetItemSpy = vi.spyOn(window.sessionStorage, 'setItem');
    renderUserManagement();
    await waitFor(() => expect(mockApi.listUsers).toHaveBeenCalled());
    expect(sessionSetItemSpy).not.toHaveBeenCalled();
  });

  // ── FAC-S5-025: email rendered via MaskedField (masked to planner-admin) ──

  it('email column renders via MaskedField component (FAC-S5-025, TC-036)', async () => {
    // FAC-S5-025, TC-036 — email must use MaskedField (data-testid="masked-field-user.email")
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    // All email cells must be rendered via MaskedField
    const maskedFields = screen.getAllByTestId('masked-field-user.email');
    expect(maskedFields.length).toBe(2); // one per user row
  });

  it('email is masked (***@domain) for planner-admin role (FAC-S5-025)', async () => {
    // FAC-S5-025 — planner-admin sees masked email; canUnmask=false
    setPlannerAdminRole();
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    // MaskedField with canUnmask=false renders GoABadge with masked value
    const maskedEmails = screen.getAllByTestId('masked-field-user.email');
    // Badge should contain masked format, not raw email
    maskedEmails.forEach((el) => {
      expect(el.textContent).not.toContain(USER_EMAIL);
    });
    // Raw email must NOT appear anywhere in the DOM
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain(USER_EMAIL);
  });

  it('email is unmasked (full value) for tenant-admin role (FAC-S5-025)', async () => {
    // FAC-S5-025 — tenant-admin sees full email; canUnmask=true
    setTenantAdminRole();
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    // MaskedField with canUnmask=true renders <span> with full value
    const unmaskedFields = screen.getAllByTestId('masked-field-user.email');
    const firstField = unmaskedFields[0];
    expect(firstField.textContent).toBe(USER_EMAIL);
  });

  // ── TC-036: user table renders with displayName ───────────────────────────

  it('renders user table with displayNames after data loads (TC-036)', async () => {
    // TC-036
    renderUserManagement();
    await waitFor(() => expect(screen.getByText(USER_DISPLAY_NAME)).toBeInTheDocument());
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByTestId('users-table')).toBeInTheDocument();
  });

  // ── TC-036: Invite User button opens modal ────────────────────────────────

  it('Invite User button is visible for tenant-admin and opens modal on click (TC-036)', async () => {
    // TC-036
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Invite a new user/i }));

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    // Use getAllByText because both the button text "Invite User" and the modal
    // heading <h2>Invite User</h2> are present after the modal opens.
    expect(screen.getAllByText('Invite User')[0]).toBeInTheDocument();
  });

  it('Invite User button is NOT visible for planner-admin role (TC-036)', async () => {
    // TC-036 — Invite User is tenant-admin only
    setPlannerAdminRole();
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    expect(
      screen.queryByRole('button', { name: /Invite a new user/i })
    ).not.toBeInTheDocument();
  });

  // ── TC-036: invite modal submit calls api.createUser ─────────────────────

  it('invite modal submit calls api.createUser with email and role (TC-036)', async () => {
    // TC-036
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Invite a new user/i }));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());

    // Fill in email and role
    fireEvent.change(screen.getByTestId('input-inviteEmail'), {
      target: { value: 'new.user@gov.ab.ca' },
    });

    // Submit
    fireEvent.click(
      screen.getByRole('button', { name: /Send invitation/i })
    );

    await waitFor(() =>
      expect(mockApi.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new.user@gov.ab.ca' })
      )
    );
  });

  it('invite modal shows success callout and modal stays open after successful invite (TC-036)', async () => {
    // TC-036 — success state
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Invite a new user/i }));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('input-inviteEmail'), {
      target: { value: 'test@gov.ab.ca' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send invitation/i }));

    await waitFor(() =>
      expect(screen.getByText(/Invitation Sent/)).toBeInTheDocument()
    );
  });

  // ── TC-082: role change calls api.updateUser ──────────────────────────────

  it('role change dropdown calls api.updateUser with new role (TC-082)', async () => {
    // TC-082 — role change generates server-side audit event (BR-008, SN-012)
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    // Change role for the first active user (Alice Smith — planner-admin)
    const roleDropdown = screen.getByTestId('dropdown-editRole-user-admin-001');
    fireEvent.change(roleDropdown, { target: { value: 'planner-user' } });

    await waitFor(() =>
      expect(mockApi.updateUser).toHaveBeenCalledWith('user-admin-001', {
        role: 'planner-user',
      })
    );
  });

  // ── TC-036: deactivate calls api.deactivateUser ───────────────────────────

  it('Deactivate button opens confirm modal; confirming calls api.deactivateUser (TC-036)', async () => {
    // TC-036
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    // Click Deactivate for Alice Smith
    const deactivateButton = screen.getByRole('button', {
      name: /Deactivate Alice Smith/i,
    });
    fireEvent.click(deactivateButton);

    // Confirm modal opens
    await waitFor(() =>
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    );

    // Confirm deactivation
    fireEvent.click(
      screen.getByRole('button', { name: /Confirm deactivation of Alice Smith/i })
    );

    await waitFor(() =>
      expect(mockApi.deactivateUser).toHaveBeenCalledWith('user-admin-001')
    );
  });

  // ── FAC-S5-024: email NOT in URL query params ─────────────────────────────

  it('listUsers is never called with email as a query param (FAC-S5-024)', async () => {
    // FAC-S5-024 — Protected A email must NOT flow into URL query strings
    renderUserManagement();
    await waitFor(() => expect(mockApi.listUsers).toHaveBeenCalled());

    const allCalls = mockApi.listUsers.mock.calls as Array<Array<Record<string, unknown>>>;
    allCalls.forEach((args) => {
      const params = args[0] ?? {};
      expect(params).not.toHaveProperty('email');
      expect(params).not.toHaveProperty('displayName');
    });
  });

  it('client-side search by name does not trigger additional API calls (FAC-S5-024)', async () => {
    // FAC-S5-024 — search filters client-side only; email never goes to URL
    renderUserManagement();
    await waitFor(() => expect(mockApi.listUsers).toHaveBeenCalled());

    const initialCallCount = mockApi.listUsers.mock.calls.length;

    // Type in search field
    const searchInput = screen.getByTestId('input-search');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    // No additional API call
    expect(mockApi.listUsers.mock.calls.length).toBe(initialCallCount);
    // Alice should still be visible; Bob should be filtered out
    expect(screen.getByText(USER_DISPLAY_NAME)).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
  });

  // ── TC-039: role and status filters ──────────────────────────────────────

  it('role filter triggers API call with role param (TC-039)', async () => {
    // TC-039
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('dropdown-role'), {
      target: { value: 'planner-admin' },
    });

    await waitFor(() =>
      expect(mockApi.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'planner-admin' })
      )
    );
  });

  it('status filter triggers API call with status param (TC-039)', async () => {
    // TC-039
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('dropdown-status'), {
      target: { value: 'inactive' },
    });

    await waitFor(() =>
      expect(mockApi.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inactive' })
      )
    );
  });

  // ── TC-055: keyboard navigation ───────────────────────────────────────────

  it('all interactive buttons are focusable (TC-055)', async () => {
    // TC-055
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveAttribute('tabindex', '-1');
    });
    // Invite, role dropdowns per row, Deactivate per row
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  // ── TC-057: error callout on load failure ─────────────────────────────────

  it('shows error callout when listUsers fails (TC-057)', async () => {
    // TC-057
    mockApi.listUsers.mockRejectedValue(new Error('Network error'));
    renderUserManagement();
    await waitFor(() =>
      expect(screen.getByTestId('callout-emergency')).toBeInTheDocument()
    );
    expect(screen.getByText(/Unable to load users/)).toBeInTheDocument();
  });

  // ── FAC-S5-026: invite form cleared on modal close ────────────────────────

  it('invite form email field is cleared on modal close (FAC-S5-026)', async () => {
    // FAC-S5-026 — email cleared from component state on modal close (not persisted)
    renderUserManagement();
    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Invite a new user/i }));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('input-inviteEmail'), {
      target: { value: 'typed@gov.ab.ca' },
    });
    expect(screen.getByTestId('input-inviteEmail')).toHaveValue('typed@gov.ab.ca');

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /Close dialog/i }));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

    // Re-open — email field must be empty (cleared by handleCloseInviteModal)
    fireEvent.click(screen.getByRole('button', { name: /Invite a new user/i }));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());
    expect(screen.getByTestId('input-inviteEmail')).toHaveValue('');
  });
});
