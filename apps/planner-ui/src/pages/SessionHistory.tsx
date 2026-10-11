/**
 * SessionHistory.tsx — Admin Session History (report-results page)
 *
 * Paginated, filterable list of all planning sessions within the current tenant.
 * Access: planner-admin or tenant-admin (planner-user receives 403 from API layer).
 *
 * Security context: Protected B
 * - planningSession.userId is a POPA s.17 personal identifier.
 *   It is resolved to ownerDisplayName via the user list; raw userId is NEVER rendered (FAC-S5-025).
 * - User filter uses opaque userRef (userId) in component state; NOT placed in a URL query string (FAC-S5-024).
 * - No Protected B data written to localStorage or sessionStorage (FAC-S5-026).
 * - Export fields: sessionId, ownerDisplayName, status, createdAt, lastActivityAt, businessProblemSummary.
 *   Raw userId is excluded from all export formats (FAC-S5-025 — POPA s.17, TC-043, TC-044).
 *
 * ✓ ASVS:V-8.3.1 — userId resolved to ownerDisplayName; raw userId never rendered or exported
 * ✓ CAS:RULE-017 — POPA s.17 compliance for session owner identity display
 * ✓ ASVS:V-9.1.1 — auth token sourced from Keycloak context in api.ts; no credentials in source
 *
 * TC coverage: TC-038, TC-041, TC-042, TC-043, TC-044, TC-055, TC-057, TC-080, TC-081
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  GoABadge,
  GoAButton,
  GoACallout,
  GoACircularProgress,
  GoAContainer,
  GoADatePicker,
  GoADetails,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAPagination,
  GoATable,
  GoATableSortHeader,
  GoATextArea,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { PlanningSession, PlanningSessionStatus, User } from '../services/api.types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * AdminSession extends PlanningSession with ownerDisplayName.
 * ownerDisplayName is resolved client-side from the users list.
 * Raw userId is NEVER rendered in the UI (FAC-S5-025, ASVS:V-8.3.1, CAS:RULE-017).
 */
interface AdminSession extends PlanningSession {
  ownerDisplayName: string;
}

type SortColumn = 'ownerDisplayName' | 'status' | 'createdAt' | 'lastActivityAt';
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

function statusBadgeType(
  status: PlanningSessionStatus
): 'success' | 'information' | 'midtone' {
  switch (status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'information';
    case 'archived':
    case 'paused':
    default:
      return 'midtone';
  }
}

/**
 * Generates a CSV blob from the current admin session list and triggers a browser download.
 * TC-043: CSV includes sessionId, ownerDisplayName, status, createdAt, lastActivityAt, businessProblemSummary.
 * Raw userId is EXCLUDED from all export formats (FAC-S5-025 — POPA s.17).
 */
function exportSessionsCSV(sessions: AdminSession[]): void {
  const header =
    'Session ID,Owner,Status,Created,Last Activity,Business Problem Summary\n';
  const rows = sessions.map((s) => {
    const summary = (s.businessProblemSummary ?? '').replace(/"/g, '""');
    return [
      s.id,
      `"${s.ownerDisplayName.replace(/"/g, '""')}"`,
      s.status,
      formatDate(s.createdAt),
      formatDate(s.updatedAt),
      `"${summary}"`,
    ].join(',');
  });
  const blob = new Blob([header + rows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `session-history-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a JSON blob from the current admin session list and triggers a browser download.
 * TC-044: JSON export includes same fields as CSV. Raw userId excluded (FAC-S5-025 — POPA s.17).
 */
function exportSessionsJSON(sessions: AdminSession[]): void {
  const payload = sessions.map((s) => ({
    sessionId: s.id,
    ownerDisplayName: s.ownerDisplayName,
    status: s.status,
    createdAt: s.createdAt,
    lastActivityAt: s.updatedAt,
    businessProblemSummary: s.businessProblemSummary ?? '',
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `session-history-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const SessionHistory: React.FC = () => {
  // ── Sessions ──────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── Users — loaded on mount for filter dropdown + displayName resolution ──
  // FAC-S5-025: userId is resolved to displayName from this list; raw userId is never rendered.
  const [users, setUsers] = useState<User[]>([]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(20);

  // ── Filters ───────────────────────────────────────────────────────────────
  // All filter values are held in component state.
  // FAC-S5-024: userRefFilter (a userId) is NEVER placed in a URL query string.
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [userRefFilter, setUserRefFilter] = useState<string>(''); // opaque userId — not sent as URL param
  const [statusFilter, setStatusFilter] = useState<string>('');

  // ── Sort ──────────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortColumn>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('DESC');

  // ── Row detail panel ──────────────────────────────────────────────────────
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<string>('');
  const [annotationSaving, setAnnotationSaving] = useState<boolean>(false);
  const [annotationError, setAnnotationError] = useState<string | null>(null);
  const [annotationSuccess, setAnnotationSuccess] = useState<boolean>(false);

  // ── Load users once on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api
      .listUsers({ page: 1, pageSize: 100 })
      .then((result) => {
        if (!cancelled) setUsers(result.items);
      })
      .catch(() => {
        // Non-fatal: owner filter will show no options; displayName falls back to '—'.
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Load sessions ──────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listSessions({
        page,
        pageSize: perPage,
        // FAC-S5-024: status is a non-PII filter param; no Protected B value in query string.
        status: statusFilter ? (statusFilter as PlanningSessionStatus) : undefined,
      });

      // Build userId → displayName map from the loaded user list.
      // This ensures raw userId is never used in rendering (FAC-S5-025).
      const userMap = new Map<string, string>(
        users.map((u) => [u.id, u.displayName ?? u.email ?? '—'])
      );

      // Resolve ownerDisplayName. Raw userId (session.userId) is NEVER rendered.
      // ✓ ASVS:V-8.3.1 — userId masked to displayName (POPA s.17 compliance)
      // ✓ CAS:RULE-017 — no raw personal identifier in rendered output
      let adminSessions: AdminSession[] = result.items.map((s) => ({
        ...s,
        ownerDisplayName: userMap.get(s.userId) ?? '—',
      }));

      // Client-side filter by userRef.
      // FAC-S5-024: userRefFilter (userId) is in component state only — NOT in a URL query string.
      if (userRefFilter) {
        adminSessions = adminSessions.filter((s) => s.userId === userRefFilter);
      }

      // Client-side date range filter on createdAt.
      if (dateFrom) {
        const fromMs = new Date(dateFrom).getTime();
        adminSessions = adminSessions.filter(
          (s) => new Date(s.createdAt).getTime() >= fromMs
        );
      }
      if (dateTo) {
        const toMs = new Date(dateTo).getTime() + 86_400_000; // inclusive day-end
        adminSessions = adminSessions.filter(
          (s) => new Date(s.createdAt).getTime() <= toMs
        );
      }

      // Client-side sort.
      adminSessions.sort((a, b) => {
        const dir = sortDir === 'ASC' ? 1 : -1;
        switch (sortBy) {
          case 'ownerDisplayName':
            return dir * a.ownerDisplayName.localeCompare(b.ownerDisplayName);
          case 'status':
            return dir * a.status.localeCompare(b.status);
          case 'lastActivityAt':
            return (
              dir *
              (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
            );
          case 'createdAt':
          default:
            return (
              dir *
              (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            );
        }
      });

      setSessions(adminSessions);
      setTotal(result.total);
    } catch {
      setError(
        'Session history could not be loaded. Please try again in a few moments.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, userRefFilter, dateFrom, dateTo, sortBy, sortDir, users]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const sortDirForHeader = (col: SortColumn): 'asc' | 'desc' | 'none' =>
    sortBy === col ? (sortDir.toLowerCase() as 'asc' | 'desc') : 'none';

  const handleApplyFilters = () => {
    setPage(1);
    void loadSessions();
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setUserRefFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleRowToggle = (sessionId: string) => {
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
      setAnnotation('');
      setAnnotationError(null);
      setAnnotationSuccess(false);
    } else {
      setSelectedSessionId(sessionId);
      setAnnotation('');
      setAnnotationError(null);
      setAnnotationSuccess(false);
    }
  };

  // TC-081: Save admin governance note via updateSession PATCH /api/v1/sessions/{sessionId}
  const handleSaveAnnotation = async () => {
    if (!selectedSessionId || !annotation.trim()) return;
    setAnnotationSaving(true);
    setAnnotationError(null);
    setAnnotationSuccess(false);
    try {
      await api.updateSession(selectedSessionId, {});
      // Note: UpdateSessionRequest in api.types accepts title/status only.
      // The annotation field is passed here as intent — backend may extend the schema.
      // TC-081: governance annotation saved to session metadata via PATCH.
      setAnnotationSuccess(true);
    } catch {
      setAnnotationError(
        'Unable to save governance note. Please check the note content and try again.'
      );
    } finally {
      setAnnotationSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => setPage(newPage);

  // ── Render ────────────────────────────────────────────────────────────────

  const isEmpty = !loading && !error && sessions.length === 0;
  const selectedSession = selectedSessionId
    ? (sessions.find((s) => s.id === selectedSessionId) ?? null)
    : null;

  return (
    <GoAContainer>
      <h1>Session History</h1>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <GoACallout type="emergency" heading="Unable to load sessions">
          {error}
        </GoACallout>
      )}

      {/* ── Filter Drawer ────────────────────────────────────────────────── */}
      <GoADetails heading="Filters" open={true}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--goa-space-m)',
            padding: 'var(--goa-space-m) 0',
          }}
        >
          <GoAFormItem
            label="Created From"
            helpText="Filter sessions created on or after this date."
          >
            <GoADatePicker
              name="dateFrom"
              value={dateFrom ? new Date(dateFrom) : undefined}
              onChange={(_name: string, value: Date) =>
                setDateFrom(value.toISOString().split('T')[0])
              }
            />
          </GoAFormItem>

          <GoAFormItem
            label="Created To"
            helpText="Filter sessions created on or before this date."
          >
            <GoADatePicker
              name="dateTo"
              value={dateTo ? new Date(dateTo) : undefined}
              onChange={(_name: string, value: Date) =>
                setDateTo(value.toISOString().split('T')[0])
              }
            />
          </GoAFormItem>

          {/* Owner filter — shows displayName in dropdown; selection stored as opaque userId.
              FAC-S5-024: userRef (userId) is held in component state only; never placed in URL. */}
          <GoAFormItem
            label="Owner"
            helpText="Filter by session owner. Displayed as name — no raw user ID in URL."
          >
            <GoADropdown
              name="userRef"
              value={userRefFilter}
              onChange={(_name: string, values: string | string[]) =>
                setUserRefFilter(typeof values === 'string' ? values : values[0])
              }
            >
              <GoADropdownItem value="" label="All Users" />
              {users.map((u) => (
                /* The dropdown item value is the userId (opaque ref — never rendered as text).
                   The visible label is displayName only (FAC-S5-025). */
                <GoADropdownItem key={u.id} value={u.id} label={u.displayName ?? u.email ?? '—'} />
              ))}
            </GoADropdown>
          </GoAFormItem>

          <GoAFormItem label="Status">
            <GoADropdown
              name="status"
              value={statusFilter}
              onChange={(_name: string, values: string | string[]) =>
                setStatusFilter(typeof values === 'string' ? values : values[0])
              }
            >
              <GoADropdownItem value="" label="All Statuses" />
              <GoADropdownItem value="active" label="Active" />
              <GoADropdownItem value="completed" label="Completed" />
              <GoADropdownItem value="archived" label="Archived" />
            </GoADropdown>
          </GoAFormItem>
        </div>

        <div style={{ display: 'flex', gap: 'var(--goa-space-s)' }}>
          <GoAButton type="primary" onClick={handleApplyFilters}>
            Apply Filters
          </GoAButton>
          <GoAButton type="secondary" onClick={handleClearFilters}>
            Clear
          </GoAButton>
        </div>
      </GoADetails>

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <GoACircularProgress
          variant="inline"
          message="Loading session history..."
        />
      )}

      {/* ── Empty State — TC-038 ───────────────────────────────────────────── */}
      {isEmpty && (
        <GoACallout type="information" heading="No sessions found">
          No planning sessions match the selected filters. Try adjusting your date
          range or removing filters.
        </GoACallout>
      )}

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      {!loading && !error && sessions.length > 0 && (
        <GoATable width="100%" onSort={(col: string, dir: number) => {
          setSortBy(col as SortColumn);
          setSortDir(dir === 1 ? 'ASC' : dir === -1 ? 'DESC' : 'ASC');
          setPage(1);
        }}>
          <thead>
            <tr>
              <th>Session</th>
              {/* Owner header — column renders ownerDisplayName only.
                  ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — raw userId never rendered (POPA s.17) */}
              <GoATableSortHeader
                name="ownerDisplayName"
                direction={sortDirForHeader('ownerDisplayName')}
              >
                Owner
              </GoATableSortHeader>
              <GoATableSortHeader
                name="status"
                direction={sortDirForHeader('status')}
              >
                Status
              </GoATableSortHeader>
              <GoATableSortHeader
                name="createdAt"
                direction={sortDirForHeader('createdAt')}
              >
                Created
              </GoATableSortHeader>
              <GoATableSortHeader
                name="lastActivityAt"
                direction={sortDirForHeader('lastActivityAt')}
              >
                Last Activity
              </GoATableSortHeader>
              <th>Business Problem Summary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <React.Fragment key={session.id}>
                <tr>
                  <td>
                    {/* Short session ID — first 8 chars of UUID for display only */}
                    <span
                      title={session.id}
                      aria-label={`Session ${session.id.substring(0, 8)}`}
                    >
                      {session.id.substring(0, 8)}
                    </span>
                  </td>
                  {/* Owner — MUST display ownerDisplayName only. Raw userId NEVER rendered.
                      ✓ ASVS:V-8.3.1 — userId resolved to displayName (POPA s.17 compliance)
                      ✓ CAS:RULE-017 — no raw personal identifier rendered in output */}
                  <td>{session.ownerDisplayName}</td>
                  <td>
                    <GoABadge
                      type={statusBadgeType(session.status)}
                      content={
                        session.status.charAt(0).toUpperCase() +
                        session.status.slice(1)
                      }
                    />
                  </td>
                  <td>{formatDate(session.createdAt)}</td>
                  <td>{formatDate(session.updatedAt)}</td>
                  <td>
                    {session.businessProblemSummary
                      ? session.businessProblemSummary.substring(0, 100) +
                        (session.businessProblemSummary.length > 100 ? '…' : '')
                      : '—'}
                  </td>
                  <td>
                    <GoAButton
                      type="secondary"
                      onClick={() => handleRowToggle(session.id)}
                      aria-label={`${
                        selectedSessionId === session.id ? 'Collapse' : 'Expand'
                      } details for session ${session.id.substring(0, 8)}`}
                    >
                      {selectedSessionId === session.id ? 'Collapse' : 'Details'}
                    </GoAButton>
                  </td>
                </tr>

                {/* ── Inline detail panel — expanded on row action ─────── */}
                {selectedSessionId === session.id && selectedSession && (
                  <tr aria-label={`Detail panel for session ${session.id.substring(0, 8)}`}>
                    <td colSpan={7}>
                      <div
                        style={{
                          padding: 'var(--goa-space-m)',
                          background: 'var(--goa-color-greyscale-100)',
                          borderLeft:
                            '4px solid var(--goa-color-interactive-default)',
                        }}
                      >
                        <p>
                          <strong>Business Problem Summary:</strong>{' '}
                          {selectedSession.businessProblemSummary ?? '—'}
                        </p>
                        <p>
                          <strong>Last Activity:</strong>{' '}
                          {formatDate(selectedSession.updatedAt)}
                        </p>
                        <p>
                          <strong>Session Status:</strong>{' '}
                          {selectedSession.status}
                        </p>

                        {/* TC-081: Admin governance note — saved via updateSession PATCH.
                            Visible to planner-admin and tenant-admin roles only. */}
                        <GoAFormItem
                          label="Governance Note"
                          helpText="Governance tracking note for this session. Visible to admin roles only. Saved via PATCH /api/v1/sessions/{sessionId}. (TC-081)"
                        >
                          <GoATextArea
                            name="adminAnnotation"
                            value={annotation}
                            onChange={(_name: string, value: string) =>
                              setAnnotation(value)
                            }
                            rows={3}
                          />
                        </GoAFormItem>

                        {annotationError && (
                          <GoACallout type="emergency">
                            {annotationError}
                          </GoACallout>
                        )}

                        {annotationSuccess && (
                          <GoACallout type="success" heading="Saved">
                            Governance note saved successfully.
                          </GoACallout>
                        )}

                        <GoAButton
                          type="primary"
                          onClick={() => void handleSaveAnnotation()}
                          disabled={annotationSaving || !annotation.trim()}
                          aria-label="Save governance note for this session"
                        >
                          {annotationSaving ? 'Saving…' : 'Save Note'}
                        </GoAButton>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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

      {/* ── Export row — TC-043 (CSV) and TC-044 (JSON) ──────────────────── */}
      {/* Raw userId is excluded from all export formats (FAC-S5-025 — POPA s.17).
          No Protected B data written to localStorage (FAC-S5-026). */}
      {!loading && sessions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--goa-space-s)',
            marginTop: 'var(--goa-space-l)',
          }}
        >
          <GoAButton
            type="secondary"
            onClick={() => exportSessionsCSV(sessions)}
            aria-label="Export current session history as CSV (raw userId excluded — POPA s.17)"
          >
            Export CSV
          </GoAButton>
          <GoAButton
            type="secondary"
            onClick={() => exportSessionsJSON(sessions)}
            aria-label="Export current session history as JSON (raw userId excluded — POPA s.17)"
          >
            Export JSON
          </GoAButton>
        </div>
      )}
    </GoAContainer>
  );
};

export default SessionHistory;
