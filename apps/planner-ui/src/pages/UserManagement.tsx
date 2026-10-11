/**
 * UserManagement.tsx — User Management page (user-management page type)
 *
 * Manages planner-service role assignments within the current tenant.
 * Access: tenant-admin only for write operations; planner-admin can view (read-only, masked email).
 *
 * Security context: Protected A (user.email)
 * - user.email is Protected A (admin operational data).
 *   Rendered FULL to tenant-admin; MASKED (***@domain) to planner-admin via MaskedField.
 *   canUnmask={isTenantAdmin} gates the unmasked view.
 * - Email NOT placed in URL query strings — search filters displayName client-side (FAC-S5-024).
 * - Email and role submitted in POST/PATCH request bodies only, never URL query strings (FAC-S5-024).
 * - Email form state cleared on modal close or successful submit (FAC-S5-026).
 * - userId appears only as route param (/users/{userId}) — NOT in URL query string (FAC-S5-024).
 * - No user PII written to localStorage or sessionStorage (FAC-S5-026).
 *
 * ✓ ASVS:V-8.3.1 — email masked via MaskedField; raw email not in URL query string
 * ✓ CAS:RULE-017 — Protected A email rendering gated by tenant-admin role check
 * ✓ ASVS:V-9.1.1 — auth from Keycloak context in api.ts; role check via window.__keycloak
 *
 * Audit trail: role changes (updateUser) and deactivations generate server-side audit events
 * per BR-008 / SN-012 — TC-082.
 *
 * TC coverage: TC-036, TC-039, TC-055, TC-057, TC-082
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GoABadge,
  GoAButton,
  GoACallout,
  GoACircularProgress,
  GoAContainer,
  GoADetails,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoAPagination,
  GoATable,
  GoATableSortHeader,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { User } from '../services/api.types';
import MaskedField from '../components/MaskedField';

// ─────────────────────────────────────────────
// Auth helper — Keycloak role detection
// ─────────────────────────────────────────────

/**
 * Returns true if the current Keycloak session has the 'tenant-admin' realm role.
 * Token sourced from window.__keycloak — same pattern as api.ts authHeader().
 * ✓ ASVS:V-9.1.1 — role checked from Keycloak context; no localStorage/sessionStorage read.
 * ✓ CAS:RULE-017 — email unmasking gated by this role check.
 */
function getIsTenantAdmin(): boolean {
  const keycloak = (
    window as unknown as {
      __keycloak?: { hasRealmRole?: (role: string) => boolean };
    }
  ).__keycloak;
  return keycloak?.hasRealmRole?.('tenant-admin') ?? false;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type SortColumn = 'displayName' | 'roles' | 'lastActivityAt';
type SortDir = 'ASC' | 'DESC';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function roleBadgeType(roles: string[]): 'information' | 'midtone' {
  return roles.includes('planner-admin') ? 'information' : 'midtone';
}

function statusBadgeType(status: string): 'success' | 'midtone' {
  return status === 'active' ? 'success' : 'midtone';
}

/** Returns the primary planner-service role label for display. */
function primaryRole(roles: string[]): string {
  if (roles.includes('planner-admin')) return 'Planner Admin';
  if (roles.includes('planner-user')) return 'Planner User';
  return roles[0] ?? '—';
}

/** Returns the primary planner-service role value for the dropdown. */
function primaryRoleValue(roles: string[]): string {
  if (roles.includes('planner-admin')) return 'planner-admin';
  if (roles.includes('planner-user')) return 'planner-user';
  return '';
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const UserManagement: React.FC = () => {
  // Role detection — controls email masking and write-action visibility.
  // ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — email unmasking requires tenant-admin.
  const isTenantAdmin = getIsTenantAdmin();

  // ── Users ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(20);

  // ── Server-side filters ───────────────────────────────────────────────────
  // FAC-S5-024: role and status are non-PII params; no Protected A/B value in query string.
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // ── Client-side search ────────────────────────────────────────────────────
  // Search is by displayName only. Email is NOT used in search query to prevent
  // Protected A value from appearing in URL query strings (FAC-S5-024).
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── Sort ──────────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortColumn>('displayName');
  const [sortDir, setSortDir] = useState<SortDir>('ASC');

  // ── Invite modal ──────────────────────────────────────────────────────────
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false);
  // FAC-S5-026: invite form fields held as component state only; cleared on close or success.
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('planner-user');
  const [inviteDisplayName, setInviteDisplayName] = useState<string>('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSubmitting, setInviteSubmitting] = useState<boolean>(false);
  const [inviteSuccess, setInviteSuccess] = useState<boolean>(false);

  // ── Deactivate confirm modal ──────────────────────────────────────────────
  const [deactivateModalOpen, setDeactivateModalOpen] = useState<boolean>(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState<boolean>(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // ── Inline role edit ──────────────────────────────────────────────────────
  const [roleEditingUserId, setRoleEditingUserId] = useState<string | null>(null);
  const [roleEditError, setRoleEditError] = useState<string | null>(null);

  // ── Load users ─────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listUsers({
        page,
        pageSize: perPage,
        // FAC-S5-024: role and status are non-PII filter params — safe as query params.
        role: roleFilter || undefined,
        status: statusFilter ? (statusFilter as 'active' | 'inactive') : undefined,
      });
      setUsers(result.items);
      setTotal(result.total);
    } catch {
      setError(
        'User list is temporarily unavailable. Please try again in a few moments.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, perPage, roleFilter, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // ── Computed: client-side search + sort ───────────────────────────────────
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Client-side search by displayName only.
    // FAC-S5-024: email excluded from search — Protected A value must not flow into URL query string.
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) =>
        (u.displayName ?? '').toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dir = sortDir === 'ASC' ? 1 : -1;
      switch (sortBy) {
        case 'roles':
          return dir * primaryRole(a.roles).localeCompare(primaryRole(b.roles));
        case 'lastActivityAt':
          return (
            dir *
            (new Date(a.lastActivityAt ?? 0).getTime() -
              new Date(b.lastActivityAt ?? 0).getTime())
          );
        case 'displayName':
        default:
          return dir * (a.displayName ?? '').localeCompare(b.displayName ?? '');
      }
    });

    return result;
  }, [users, searchQuery, sortBy, sortDir]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const sortDirForHeader = (col: SortColumn): 'asc' | 'desc' | 'none' =>
    sortBy === col ? (sortDir.toLowerCase() as 'asc' | 'desc') : 'none';

  const handlePageChange = (newPage: number) => setPage(newPage);

  // ── Invite modal handlers ─────────────────────────────────────────────────

  const handleOpenInviteModal = () => {
    // FAC-S5-026: clear all invite form state on open — never persists from a previous session.
    setInviteEmail('');
    setInviteRole('planner-user');
    setInviteDisplayName('');
    setInviteError(null);
    setInviteSuccess(false);
    setInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    // FAC-S5-026: email cleared from component state on modal close.
    setInviteEmail('');
    setInviteRole('planner-user');
    setInviteDisplayName('');
    setInviteError(null);
    setInviteSuccess(false);
    setInviteModalOpen(false);
  };

  const handleInviteSubmit = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Please enter a valid email address.');
      return;
    }
    if (!inviteRole) {
      setInviteError('Please select a role for this user.');
      return;
    }
    setInviteSubmitting(true);
    setInviteError(null);
    try {
      // FAC-S5-024: email and role submitted in POST body, NOT in URL query string.
      await api.createUser({
        email: inviteEmail.trim(),
        role: inviteRole,
        displayName: inviteDisplayName.trim() || undefined,
      });
      setInviteSuccess(true);
      // FAC-S5-026: email cleared from component state after successful submission.
      setInviteEmail('');
      setInviteRole('planner-user');
      setInviteDisplayName('');
      await loadUsers();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        setInviteError(
          'A user with this email address already exists in your tenant.'
        );
      } else if (status === 403) {
        setInviteError('You do not have permission to invite users.');
      } else {
        setInviteError('Unable to send invitation. Please try again.');
      }
    } finally {
      setInviteSubmitting(false);
    }
  };

  // ── Role change handler ────────────────────────────────────────────────────

  /**
   * TC-082: Role change triggers immutable server-side audit event per BR-008 / SN-012.
   * FAC-S5-024: userId in route param (/users/{userId}); new role in PATCH body.
   * // Triggers audit event per TC-082 (server-side via updateUser BR-008, SN-012)
   */
  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleEditingUserId(userId);
    setRoleEditError(null);
    try {
      // Triggers audit event per TC-082 (server-side, BR-008, SN-012).
      // FAC-S5-024: userId is route param; role is in PATCH body — not in URL query string.
      await api.updateUser(userId, { role: newRole });
      await loadUsers();
    } catch {
      setRoleEditError('Unable to update role. Please try again.');
    } finally {
      setRoleEditingUserId(null);
    }
  };

  // ── Deactivate handlers ───────────────────────────────────────────────────

  const handleDeactivateClick = (user: User) => {
    setUserToDeactivate(user);
    setDeactivateError(null);
    setDeactivateModalOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!userToDeactivate) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      // FAC-S5-024: userId in route param (/users/{userId}) only — no body or query params.
      await api.deactivateUser(userToDeactivate.id);
      setDeactivateModalOpen(false);
      setUserToDeactivate(null);
      await loadUsers();
    } catch {
      setDeactivateError('Unable to deactivate user. Please try again.');
    } finally {
      setDeactivating(false);
    }
  };

  const handleDeactivateCancel = () => {
    setDeactivateModalOpen(false);
    setUserToDeactivate(null);
    setDeactivateError(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const isEmpty = !loading && !error && filteredUsers.length === 0;

  return (
    <GoAContainer>
      {/* UserContext: user_context table; authentication context for session scoping */}
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--goa-space-m)',
          marginBottom: 'var(--goa-space-l)',
        }}
      >
        <h1 style={{ margin: 0 }}>User Management</h1>
        {/* Invite User button — tenant-admin only. API enforces role at the server layer.
            Planner-admin does not see this button; they have read-only access. */}
        {isTenantAdmin && (
          <GoAButton
            type="primary"
            onClick={handleOpenInviteModal}
            aria-label="Invite a new user to this tenant"
          >
            Invite User
          </GoAButton>
        )}
      </div>

      {/* Search by displayName — client-side, does NOT trigger a new API call per keystroke.
          FAC-S5-024: email excluded from search query to prevent Protected A value in URL. */}
      <GoAFormItem
        label="Search"
        helpText="Search by name. Email search is not available (Protected A)."
      >
        <GoAInput
          name="search"
          value={searchQuery}
          placeholder="Search by name..."
          onChange={(_name: string, value: string) => setSearchQuery(value)}
        />
      </GoAFormItem>

      {/* ── Filter Drawer ────────────────────────────────────────────────── */}
      <GoADetails heading="Filters" open={false}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--goa-space-m)',
            padding: 'var(--goa-space-m) 0',
          }}
        >
          <GoAFormItem label="Role">
            <GoADropdown
              name="role"
              value={roleFilter}
              onChange={(_name: string, values: string | string[]) => {
                setRoleFilter(typeof values === 'string' ? values : values[0]);
                setPage(1);
              }}
            >
              <GoADropdownItem value="" label="All Roles" />
              <GoADropdownItem value="planner-user" label="Planner User" />
              <GoADropdownItem value="planner-admin" label="Planner Admin" />
            </GoADropdown>
          </GoAFormItem>

          <GoAFormItem label="Status">
            <GoADropdown
              name="status"
              value={statusFilter}
              onChange={(_name: string, values: string | string[]) => {
                setStatusFilter(typeof values === 'string' ? values : values[0]);
                setPage(1);
              }}
            >
              <GoADropdownItem value="" label="All" />
              <GoADropdownItem value="active" label="Active" />
              <GoADropdownItem value="inactive" label="Inactive" />
            </GoADropdown>
          </GoAFormItem>
        </div>
      </GoADetails>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <GoACallout type="emergency" heading="Unable to load users">
          {error}
        </GoACallout>
      )}

      {/* Role edit error */}
      {roleEditError && (
        <GoACallout type="emergency" heading="Role update failed">
          {roleEditError}
        </GoACallout>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <GoACircularProgress variant="inline" message="Loading users..." />
      )}

      {/* ── Empty State ───────────────────────────────────────────────────── */}
      {isEmpty && (
        <GoACallout type="information" heading="No users found">
          {users.length === 0
            ? 'No users have been added to this tenant yet.'
            : 'No users match your current search or filters.'}
        </GoACallout>
      )}

      {/* ── User Table ────────────────────────────────────────────────────── */}
      {!loading && !error && filteredUsers.length > 0 && (
        <GoATable width="100%" onSort={(col: string, dir: number) => {
          setSortBy(col as SortColumn);
          setSortDir(dir === 1 ? 'ASC' : dir === -1 ? 'DESC' : 'ASC');
        }}>
          <thead>
            <tr>
              <GoATableSortHeader
                name="displayName"
                direction={sortDirForHeader('displayName')}
              >
                Name
              </GoATableSortHeader>
              {/* Email column: Protected A — rendered via MaskedField.
                  ✓ ASVS:V-8.3.1 — email masked for planner-admin; full value for tenant-admin.
                  ✓ CAS:RULE-017 — canUnmask={isTenantAdmin} gates full email display.
                  FAC-S5-024: email NOT placed in URL query string.
                  FAC-S5-026: email NOT written to localStorage/sessionStorage. */}
              <th>Email</th>
              <GoATableSortHeader
                name="roles"
                direction={sortDirForHeader('roles')}
              >
                Role
              </GoATableSortHeader>
              <GoATableSortHeader
                name="lastActivityAt"
                direction={sortDirForHeader('lastActivityAt')}
              >
                Last Activity
              </GoATableSortHeader>
              <th>Status</th>
              {/* Actions column: tenant-admin only. planner-admin sees read-only table. */}
              {isTenantAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.displayName ?? '—'}</td>
                <td>
                  {/* user.email is Protected A.
                      MaskedField enforces masking rule:
                        canUnmask={isTenantAdmin} → tenant-admin sees full email
                        canUnmask={false}         → planner-admin sees ***@domain masking
                      ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017
                      FAC-S5-026: raw email is NEVER written to localStorage/sessionStorage */}
                  <MaskedField
                    value={user.email}
                    fieldName="user.email"
                    canUnmask={isTenantAdmin}
                    isEmail
                  />
                </td>
                <td>
                  <GoABadge
                    type={roleBadgeType(user.roles)}
                    content={primaryRole(user.roles)}
                  />
                </td>
                <td>{formatDate(user.lastActivityAt)}</td>
                <td>
                  <GoABadge
                    type={statusBadgeType(user.status)}
                    content={
                      user.status.charAt(0).toUpperCase() + user.status.slice(1)
                    }
                  />
                </td>
                {/* Write actions — tenant-admin only. planner-admin sees no action column. */}
                {isTenantAdmin && (
                  <td>
                    {user.status === 'active' ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--goa-space-s)',
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* Inline role selector.
                            TC-082: role change generates server-side audit event (BR-008, SN-012).
                            FAC-S5-024: userId in route param; new role in PATCH body. */}
                        <GoAFormItem label="Change Role" helpText="">
                          <GoADropdown
                            name={`editRole-${user.id}`}
                            value={primaryRoleValue(user.roles)}
                            onChange={(_name: string, values: string | string[]) =>
                              void handleRoleChange(user.id, typeof values === 'string' ? values : values[0])
                            }
                            disabled={roleEditingUserId === user.id}
                          >
                            <GoADropdownItem value="planner-user" label="Planner User" />
                            <GoADropdownItem value="planner-admin" label="Planner Admin" />
                          </GoADropdown>
                        </GoAFormItem>

                        <GoAButton
                          type="secondary"
                          onClick={() => handleDeactivateClick(user)}
                          aria-label={`Deactivate ${user.displayName ?? 'user'}`}
                        >
                          Deactivate
                        </GoAButton>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--goa-color-text-secondary)' }}>
                        Inactive
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </GoATable>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {!loading && !error && total > perPage && (
        <GoAPagination
          pageNumber={page}
          itemCount={total}
          perPageCount={perPage}
          onChange={handlePageChange}
        />
      )}

      {/* ── Invite User Modal ─────────────────────────────────────────────── */}
      <GoAModal
        heading="Invite User"
        open={inviteModalOpen}
        onClose={handleCloseInviteModal}
      >
        {inviteSuccess ? (
          <>
            <GoACallout type="success" heading="Invitation Sent">
              Invitation sent. The user will receive an email with instructions to
              access the ADSP Project Planner.
            </GoACallout>
            <div style={{ marginTop: 'var(--goa-space-m)' }}>
              <GoAButton type="secondary" onClick={handleCloseInviteModal}>
                Close
              </GoAButton>
            </div>
          </>
        ) : (
          <>
            {inviteError && (
              <GoACallout type="emergency">{inviteError}</GoACallout>
            )}

            {/* Email — FAC-S5-026: held as component state only; cleared on close or success.
                FAC-S5-024: submitted in POST body, never in URL query string. */}
            <GoAFormItem label="Email Address" requirement="required">
              <GoAInput
                name="inviteEmail"
                type="email"
                value={inviteEmail}
                placeholder="firstname.lastname@gov.ab.ca"
                onChange={(_name: string, value: string) => setInviteEmail(value)}
              />
            </GoAFormItem>

            <GoAFormItem label="Role" requirement="required">
              <GoADropdown
                name="inviteRole"
                value={inviteRole}
                onChange={(_name: string, values: string | string[]) =>
                  setInviteRole(typeof values === 'string' ? values : values[0])
                }
              >
                <GoADropdownItem value="planner-user" label="Planner User" />
                <GoADropdownItem value="planner-admin" label="Planner Admin" />
              </GoADropdown>
            </GoAFormItem>

            <GoAFormItem
              label="Display Name"
              helpText="Optional. If omitted, resolved from Keycloak on the user's first login."
            >
              <GoAInput
                name="inviteDisplayName"
                value={inviteDisplayName}
                onChange={(_name: string, value: string) =>
                  setInviteDisplayName(value)
                }
              />
            </GoAFormItem>

            <div
              style={{
                display: 'flex',
                gap: 'var(--goa-space-s)',
                marginTop: 'var(--goa-space-l)',
              }}
            >
              <GoAButton
                type="primary"
                onClick={() => void handleInviteSubmit()}
                disabled={inviteSubmitting}
                aria-label="Send invitation to the entered email address"
              >
                {inviteSubmitting ? 'Sending…' : 'Send Invitation'}
              </GoAButton>
              <GoAButton type="secondary" onClick={handleCloseInviteModal}>
                Cancel
              </GoAButton>
            </div>
          </>
        )}
      </GoAModal>

      {/* ── Deactivate Confirm Modal ──────────────────────────────────────── */}
      <GoAModal
        heading="Deactivate User"
        open={deactivateModalOpen}
        onClose={handleDeactivateCancel}
      >
        <p>
          Are you sure you want to deactivate{' '}
          <strong>{userToDeactivate?.displayName ?? 'this user'}</strong>? They
          will no longer be able to access the ADSP Project Planner.
        </p>

        {deactivateError && (
          <GoACallout type="emergency">{deactivateError}</GoACallout>
        )}

        <div
          style={{
            display: 'flex',
            gap: 'var(--goa-space-s)',
            marginTop: 'var(--goa-space-l)',
          }}
        >
          <GoAButton
            type="primary"
            onClick={() => void handleDeactivateConfirm()}
            disabled={deactivating}
            aria-label={`Confirm deactivation of ${userToDeactivate?.displayName ?? 'user'}`}
          >
            {deactivating ? 'Deactivating…' : 'Deactivate'}
          </GoAButton>
          <GoAButton type="secondary" onClick={handleDeactivateCancel}>
            Cancel
          </GoAButton>
        </div>
      </GoAModal>
    </GoAContainer>
  );
};

export default UserManagement;
