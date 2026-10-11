/**
 * AdminHub.tsx — Administration section hub page (section-hub)
 *
 * Provides tile-based navigation to all administration sub-areas:
 * Pattern Library, Session History, Audit Log, User Management.
 *
 * Access: planner-admin or tenant-admin required (planner-user gets 403 from API layer).
 * ✓ ASVS:V-9.1.1 — page is gated by API role check; auth token from Keycloak context in api.ts
 *
 * Security context: stats badges display only aggregate numeric totals.
 * No Protected B personal data is fetched or rendered on this page (FAC-S5-025 PASS-N/A).
 * No localStorage/sessionStorage writes (FAC-S5-026).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoABadge,
  GoAButton,
  GoACallout,
  GoACircularProgress,
  GoAContainer,
  GoAGrid,
  GoAIcon,
} from '@abgov/react-components';
import { api } from '../services/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AdminStats {
  patternCount: number | null;
  sessionCount: number | null;
  auditCount: number | null;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const AdminHub: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats>({
    patternCount: null,
    sessionCount: null,
    auditCount: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<boolean>(false);

  // On mount: parallel load of aggregate counts for stats badges.
  // Uses page=1&pageSize=1 to retrieve only the total without full payload.
  // Stats bindings: listPatterns.total, listSessions.total, listAuditEvents.total
  // No Protected B personal data is fetched — numeric totals only (FAC-S5-024, FAC-S5-025).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatsError(false);

    Promise.all([
      api.listPatterns({ page: 1, pageSize: 1 }),
      api.listSessions({ page: 1, pageSize: 1 }),
      api.listAuditEvents({ page: 1, pageSize: 1 }),
    ])
      .then(([patternsResult, sessionsResult, auditResult]) => {
        if (!cancelled) {
          setStats({
            patternCount: patternsResult.total,
            sessionCount: sessionsResult.total,
            auditCount: auditResult.total,
          });
        }
      })
      .catch(() => {
        // Stats badge load failure: tiles remain functional; badges show '--' per content spec TC-035.
        if (!cancelled) {
          setStatsError(true);
          setStats({ patternCount: null, sessionCount: null, auditCount: null });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Formats a numeric stat for display. Returns '--' when null (load error).
  const formatStat = (count: number | null): string =>
    count !== null ? String(count) : '--';

  return (
    <GoAContainer>
      <h1>Administration</h1>
      <p>
        Manage business pattern templates, review tenant planning session history, examine the
        immutable audit log, and administer user access for this tenant.
      </p>

      {loading && (
        <GoACircularProgress variant="inline" message="Loading administration overview..." />
      )}

      {/* Stats load failure notice — tiles remain functional, counts show '--' */}
      {!loading && statsError && (
        <GoACallout type="important" heading="Statistics temporarily unavailable">
          Some tile statistics could not be loaded. Tile navigation remains fully functional.
        </GoACallout>
      )}

      <GoAGrid minChildWidth="350px" gap="l">
        {/* ── Tile 1: Pattern Library (requiredRole: planner-admin) ─────────────── */}
        <GoAContainer>
          <GoAIcon type="library" size="medium" />
          <h2>Pattern Library</h2>
          <p>
            Create and manage business pattern templates that guide the AI Planning Agent when
            matching session content to recommended ADSP service compositions.
          </p>
          {/* Stats badge: numeric count only — no personal data (FAC-S5-025) */}
          {!loading && (
            <GoABadge
              type="information"
              content={`${formatStat(stats.patternCount)} Active Patterns`}
            />
          )}
          <GoAButton
            type="primary"
            onClick={() => navigate('/admin/patterns')}
            aria-label="Manage Patterns — navigate to Pattern Library"
          >
            Manage Patterns
          </GoAButton>
        </GoAContainer>

        {/* ── Tile 2: Session History (requiredRole: planner-admin) ─────────────── */}
        <GoAContainer>
          <GoAIcon type="time" size="medium" />
          <h2>Session History</h2>
          <p>
            Review all planning sessions conducted within this tenant. Filter by date range, user,
            or status and export results for governance reporting.
          </p>
          {!loading && (
            <GoABadge
              type="information"
              content={`${formatStat(stats.sessionCount)} Tenant Sessions`}
            />
          )}
          <GoAButton
            type="primary"
            onClick={() => navigate('/admin/history')}
            aria-label="View History — navigate to Session History"
          >
            View History
          </GoAButton>
        </GoAContainer>

        {/* ── Tile 3: Audit Log (requiredRole: planner-admin) ──────────────────── */}
        <GoAContainer>
          <GoAIcon type="lock-closed" size="medium" />
          <h2>Audit Log</h2>
          <p>
            View the immutable HMAC-chained audit log of all administrative actions. Verify chain
            integrity and export records for compliance submissions.
          </p>
          {!loading && (
            <GoABadge
              type="information"
              content={`${formatStat(stats.auditCount)} Audit Events (30 days)`}
            />
          )}
          <GoAButton
            type="primary"
            onClick={() => navigate('/admin/audit')}
            aria-label="View Audit Log — navigate to Audit Log"
          >
            View Audit Log
          </GoAButton>
        </GoAContainer>

        {/* ── Tile 4: User Management (requiredRole: tenant-admin) ─────────────── */}
        {/* Note: this tile navigates to /admin/users which enforces tenant-admin role at the API layer.
            Rendering is unconditional here; the API returns 403 for planner-admin users. */}
        <GoAContainer>
          <GoAIcon type="people" size="medium" />
          <h2>User Management</h2>
          <p>
            Assign and edit planner-service roles for users within this tenant. Invite users,
            modify role assignments, and deactivate access as required.
          </p>
          {/* No stats badge — statsBinding is null per content spec */}
          <GoAButton
            type="primary"
            onClick={() => navigate('/admin/users')}
            aria-label="Manage Users — navigate to User Management"
          >
            Manage Users
          </GoAButton>
        </GoAContainer>
      </GoAGrid>
    </GoAContainer>
  );
};

export default AdminHub;
