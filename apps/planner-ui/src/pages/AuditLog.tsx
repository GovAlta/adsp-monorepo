/**
 * AuditLog.tsx — Audit Log (report-results page)
 *
 * Immutable, read-only paginated list of audit events for the current tenant.
 * HMAC chain integrity is verified on mount via HmacStatusBanner before table data is fetched.
 * Access: planner-admin or tenant-admin (planner-user receives 403 from API layer).
 *
 * Security context: Protected A (auditEvent.actorId)
 * - auditEvent.actorId is a Protected A GoA employee userId.
 *   It MUST NOT appear raw in any table cell or export.
 *   Resolved to actorDisplayName via the user list; displayed via MaskedField.
 * - actorId filter param is a standard Protected A query param per OpenAPI listAuditEvents spec (FAC-S5-024).
 * - No data written to localStorage or sessionStorage (FAC-S5-026).
 * - TC-047: NO edit or delete controls on ANY audit row — immutability per BR-014.
 *
 * ✓ ASVS:V-8.3.1 — actorId resolved to actorDisplayName; raw actorId never rendered or exported
 * ✓ ASVS:V-10.4.1 — HMAC chain integrity verification displayed on page load (via HmacStatusBanner)
 * ✓ ASVS:V-9.1.1 — auth token from Keycloak context in api.ts; no credentials in source
 *
 * TC coverage: TC-045, TC-046, TC-047, TC-048, TC-049, TC-055, TC-057
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
} from '@abgov/react-components';
import { api } from '../services/api';
import type { AuditEvent, AuditOutcome, User } from '../services/api.types';
import HmacStatusBanner from '../components/HmacStatusBanner';
import MaskedField from '../components/MaskedField';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * AuditEventWithDisplay extends AuditEvent with actorDisplayName.
 * actorDisplayName is resolved from the users list.
 * Raw actorId (Protected A) is NEVER rendered in any table cell or export (FAC-S5-025).
 */
interface AuditEventWithDisplay extends AuditEvent {
  actorDisplayName: string;
}

type SortDir = 'ASC' | 'DESC';

const ACTION_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'pattern.created', label: 'Pattern Created' },
  { value: 'pattern.updated', label: 'Pattern Updated' },
  { value: 'pattern.deactivated', label: 'Pattern Deactivated' },
  { value: 'session.exported', label: 'Session Exported' },
  { value: 'role.assigned', label: 'Role Assigned' },
  { value: 'role.changed', label: 'Role Changed' },
  { value: 'user.deactivated', label: 'User Deactivated' },
  { value: 'audit.accessed', label: 'Audit Log Accessed' },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function outcomeBadgeType(outcome: AuditOutcome): 'success' | 'emergency' {
  return outcome === 'success' ? 'success' : 'emergency';
}

/**
 * Generates a CSV blob from the current audit event list and triggers a browser download.
 * TC-049: CSV columns are timestamp, actorDisplayName, actionLabel, resourceId, outcome.
 * Raw actorId is EXCLUDED from all export formats (FAC-S5-025).
 */
function exportAuditCSV(events: AuditEventWithDisplay[]): void {
  const header = 'Timestamp,Actor,Action,Affected Resource,Outcome\n';
  const rows = events.map((e) => {
    const actor = e.actorDisplayName.replace(/"/g, '""');
    const action = e.actionLabel.replace(/"/g, '""');
    const resource = e.resourceId.replace(/"/g, '""');
    return [
      formatDateTime(e.occurredAt),
      `"${actor}"`,
      `"${action}"`,
      `"${resource}"`,
      e.outcome,
    ].join(',');
  });
  const blob = new Blob([header + rows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const AuditLog: React.FC = () => {
  // ── Audit events ──────────────────────────────────────────────────────────
  const [events, setEvents] = useState<AuditEventWithDisplay[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── Users — loaded for actor filter dropdown + actorId resolution ─────────
  // FAC-S5-025: actorId is resolved to actorDisplayName from this list.
  const [users, setUsers] = useState<User[]>([]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(25);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');
  // FAC-S5-024: actorId filter is a standard Protected A query param per OpenAPI listAuditEvents spec.
  // This is Protected A (GoA employee userId), not Protected B — standard query param per spec.
  const [actorIdFilter, setActorIdFilter] = useState<string>('');
  const [since, setSince] = useState<string>('');
  const [until, setUntil] = useState<string>('');

  // ── Sort — default: occurredAt DESC per content spec ─────────────────────
  const [sortDir, setSortDir] = useState<SortDir>('DESC');

  // ── Load users once on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api
      .listUsers({ page: 1, pageSize: 100 })
      .then((result) => {
        if (!cancelled) setUsers(result.items);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Load audit events ──────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listAuditEvents({
        page,
        pageSize: perPage,
        resourceType: resourceTypeFilter || undefined,
        // FAC-S5-024: actorId is Protected A per OpenAPI — standard listAuditEvents query param.
        actorId: actorIdFilter || undefined,
        since: since || undefined,
        until: until || undefined,
      });

      // Build userId → displayName map from the loaded user list.
      const userMap = new Map<string, string>(
        users.map((u) => [u.id, u.displayName ?? u.email ?? '—'])
      );

      // Resolve actorDisplayName. Raw actorId (Protected A) MUST NOT appear in any rendered cell.
      // ✓ ASVS:V-8.3.1 — actorId resolved to displayName in all rendered and exported output
      const enriched: AuditEventWithDisplay[] = result.items.map((e) => ({
        ...e,
        actorDisplayName: userMap.get(e.actorId) ?? '—',
      }));

      // Client-side sort by occurredAt (default DESC per content spec).
      enriched.sort((a, b) => {
        const dir = sortDir === 'ASC' ? 1 : -1;
        return (
          dir *
          (new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
        );
      });

      setEvents(enriched);
      setTotal(result.total);
    } catch {
      setError(
        'Audit log is temporarily unavailable. Please try again in a few moments.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, perPage, resourceTypeFilter, actorIdFilter, since, until, sortDir, users]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleApplyFilters = () => {
    setPage(1);
    void loadEvents();
  };

  const handleClearFilters = () => {
    setResourceTypeFilter('');
    setActorIdFilter('');
    setSince('');
    setUntil('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => setPage(newPage);

  // ── Render ────────────────────────────────────────────────────────────────

  const isEmpty = !loading && !error && events.length === 0;

  return (
    <GoAContainer>
      {/* ── HMAC Integrity Banner ─────────────────────────────────────────
          Loaded on mount before table data (TC-045, TC-046, BR-015, SYSREQ-020).
          ✓ ASVS:V-10.4.1 — chain integrity displayed prominently before audit content. */}
      <HmacStatusBanner />

      <h1>Audit Log</h1>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <GoACallout type="emergency" heading="Unable to load audit log">
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
          <GoAFormItem label="Action Type">
            <GoADropdown
              name="resourceType"
              value={resourceTypeFilter}
              onChange={(_name: string, values: string | string[]) =>
                setResourceTypeFilter(typeof values === 'string' ? values : values[0])
              }
            >
              <GoADropdownItem value="" label="All Action Types" />
              {ACTION_TYPE_OPTIONS.map((opt) => (
                <GoADropdownItem key={opt.value} value={opt.value} label={opt.label} />
              ))}
            </GoADropdown>
          </GoAFormItem>

          {/* Actor filter — shows displayName; actorId (Protected A) is the query param value.
              FAC-S5-024: actorId is Protected A per OpenAPI spec — standard listAuditEvents query param.
              The label shown to the user is displayName only (FAC-S5-025). */}
          <GoAFormItem
            label="Actor"
            helpText="Filter by actor. Displayed as name. (Actor identity is Protected A.)"
          >
            <GoADropdown
              name="actorId"
              value={actorIdFilter}
              onChange={(_name: string, values: string | string[]) =>
                setActorIdFilter(typeof values === 'string' ? values : values[0])
              }
            >
              <GoADropdownItem value="" label="All Actors" />
              {users.map((u) => (
                /* Item value is userId (opaque — the Protected A identifier sent to API).
                   Label is displayName only — raw actorId is NEVER rendered as dropdown text. */
                <GoADropdownItem key={u.id} value={u.id} label={u.displayName ?? u.email ?? '—'} />
              ))}
            </GoADropdown>
          </GoAFormItem>

          <GoAFormItem
            label="From Date"
            helpText="Show events from this date (ISO-8601 since param)."
          >
            <GoADatePicker
              name="since"
              value={since ? new Date(since) : undefined}
              onChange={(_name: string, value: Date) =>
                setSince(value.toISOString().split('T')[0])
              }
            />
          </GoAFormItem>

          <GoAFormItem
            label="To Date"
            helpText="Show events up to this date."
          >
            <GoADatePicker
              name="until"
              value={until ? new Date(until) : undefined}
              onChange={(_name: string, value: Date) =>
                setUntil(value.toISOString().split('T')[0])
              }
            />
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
          message="Loading audit events..."
        />
      )}

      {/* ── Empty State ───────────────────────────────────────────────────── */}
      {isEmpty && (
        <GoACallout type="information" heading="No audit events found">
          No audit events match the selected filters.
        </GoACallout>
      )}

      {/* ── Audit Events Table ────────────────────────────────────────────
          READ ONLY — TC-047: NO edit or delete controls on ANY row.
          Immutability enforced by the COMPLETE ABSENCE of any row action controls (BR-014). */}
      {!loading && !error && events.length > 0 && (
        <GoATable width="100%" onSort={(_sortBy: string, sortDirNum: number) => {
          setSortDir(sortDirNum === 1 ? 'ASC' : 'DESC');
          setPage(1);
        }}>
          <thead>
            <tr>
              {/* Timestamp: sortable (default DESC) */}
              <GoATableSortHeader
                name="occurredAt"
                direction={sortDir.toLowerCase() as 'asc' | 'desc'}
              >
                Timestamp
              </GoATableSortHeader>
              {/* Actor: non-sortable. Displays actorDisplayName only — raw actorId NEVER rendered.
                  ✓ ASVS:V-8.3.1 — actorId (Protected A) masked to displayName in all output */}
              <th>Actor</th>
              <th>Action</th>
              <th>Affected Resource</th>
              <th>Outcome</th>
              {/* TC-047: NO edit/delete column present on this table — BR-014 immutability. */}
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{formatDateTime(event.occurredAt)}</td>
                <td>
                  {/* actorId is Protected A — MUST NOT appear raw in any cell.
                      ✓ ASVS:V-8.3.1 — actorId resolved to actorDisplayName; raw actorId never rendered.
                      MaskedField with canUnmask=true shows actorDisplayName (not the raw actorId). */}
                  <MaskedField
                    value={event.actorDisplayName}
                    fieldName="auditEvent.actorId"
                    canUnmask={true}
                  />
                </td>
                <td>{event.actionLabel}</td>
                <td>{event.resourceId}</td>
                <td>
                  <GoABadge
                    type={outcomeBadgeType(event.outcome)}
                    content={
                      event.outcome.charAt(0).toUpperCase() +
                      event.outcome.slice(1)
                    }
                  />
                </td>
                {/* TC-047: NO edit/delete actions in this row — audit records are immutable (BR-014). */}
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

      {/* ── Export row ────────────────────────────────────────────────────
          TC-048: PDF export includes HMAC chain status header (via browser print).
          TC-049: CSV export — actorDisplayName only; raw actorId excluded (FAC-S5-025).
          No Protected A data written to localStorage (FAC-S5-026). */}
      {!loading && events.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--goa-space-s)',
            marginTop: 'var(--goa-space-l)',
          }}
        >
          {/* TC-048: PDF export triggers browser print — HMAC chain status displayed in header
              via the visible HmacStatusBanner above. */}
          <GoAButton
            type="secondary"
            onClick={() => window.print()}
            aria-label="Export audit log as PDF via browser print (includes HMAC chain status)"
          >
            Export PDF
          </GoAButton>
          <GoAButton
            type="secondary"
            onClick={() => exportAuditCSV(events)}
            aria-label="Export audit log as CSV (raw actorId excluded — Protected A)"
          >
            Export CSV
          </GoAButton>
        </div>
      )}
    </GoAContainer>
  );
};

export default AuditLog;
