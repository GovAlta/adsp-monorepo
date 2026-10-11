/**
 * SessionDashboard — pageId: session-dashboard, pageType: list-index
 *
 * Displays the authenticated user's planning sessions in a filterable, paginated table.
 * Protected B page: userId and tenantId are server-side scoping only — never rendered in UI.
 *
 * FAC-S5-024: No Protected B data in URL query strings.
 * FAC-S5-025: userId/tenantId not rendered in table cells.
 * FAC-S5-026: No Protected B data written to localStorage/sessionStorage.
 * ✓ ASVS:V-9.1.1 — JWT sourced from Keycloak context, not localStorage.
 * ✓ ASVS:V-3.2.2 — session state held in React state only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoAContainer,
  GoAButton,
  GoADetails,
  GoAFormItem,
  GoADropdown,
  GoADropdownItem,
  GoATable,
  GoAPagination,
  GoACallout,
  GoACircularProgress,
  GoANotification,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { PlanningSession, PlanningSessionStatus } from '../services/api.types';

type SortDirection = 'asc' | 'desc';
type SortColumn = 'title' | 'status' | 'updatedAt';

// Solid-color chips with white text — each status gets a distinct GoA brand colour.
// GoA palette: success #007a4e, warning-amber #ee7100, midtone-dark #666, grey #9e9e9e.
const STATUS_CHIP_STYLES: Record<PlanningSessionStatus, { background: string; color: string }> = {
  active:    { background: '#007a4e', color: '#ffffff' },
  paused:    { background: '#ee7100', color: '#ffffff' },
  completed: { background: '#5a5c63', color: '#ffffff' },
  archived:  { background: '#9e9e9e', color: '#ffffff' },
};

const STATUS_LABELS: Record<PlanningSessionStatus, string> = {
  active:    'Active',
  paused:    'Paused',
  completed: 'Completed',
  archived:  'Archived',
};

const PER_PAGE = 20;

const SessionDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<PlanningSession[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PlanningSessionStatus | ''>('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ✓ ASVS:V-9.1.1 — auth header injected by api service layer, not from localStorage
      const result = await api.listSessions({
        page,
        pageSize: PER_PAGE,
        status: statusFilter || undefined,
      });
      setSessions(result.items);
      setTotalItems(result.total);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        setAuthError(true);
      } else if (status === 403) {
        setError('You do not have permission to view planning sessions. Contact your administrator.');
      } else {
        setError('Unable to load planning sessions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleResume = async (session: PlanningSession) => {
    try {
      if (session.status === 'paused') {
        // FAC-S5-024: sessionId is a route param, not a query string containing Protected B data
        await api.updateSession(session.id, { status: 'active' });
      }
      navigate(`/sessions/${session.id}/planning`);
    } catch {
      setError('Unable to resume session. Please try again.');
    }
  };

  const isSessionIdle = (session: PlanningSession): boolean => {
    const lastActivity = session.lastResumedAt ?? session.createdAt;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - new Date(lastActivity).getTime() > sevenDaysMs;
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    let aVal = '';
    let bVal = '';
    if (sortColumn === 'title') {
      aVal = a.title;
      bVal = b.title;
    } else if (sortColumn === 'status') {
      aVal = a.status;
      bVal = b.status;
    } else {
      aVal = a.updatedAt;
      bVal = b.updatedAt;
    }
    const cmp = aVal.localeCompare(bVal);
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  return (
    <GoAContainer>
      {/* Auth exception banner — JWT expired / 401 */}
      {authError && (
        <GoANotification
          type="emergency"
          onDismiss={() => setAuthError(false)}
        >
          Your session has expired. You will be redirected to sign in.
        </GoANotification>
      )}

      {/* Page heading + primary action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--goa-space-l)' }}>
        <div>
          <h1 style={{ margin: 0 }}>My Planning Sessions</h1>
          <p style={{ margin: 'var(--goa-space-xs) 0 0', color: 'var(--goa-color-text-secondary)' }}>
            Track and resume your ADSP planning sessions.
          </p>
        </div>
        <GoAButton
          type="primary"
          onClick={() => navigate('/sessions/new')}
        >
          Start New Session
        </GoAButton>
      </div>

      {/* Filter drawer */}
      <GoADetails heading="Filter Sessions">
        <GoAFormItem label="Status">
          <GoADropdown
            name="status"
            value={statusFilter}
            onChange={(_name: string, values: string | string[]) =>
              setStatusFilter((typeof values === 'string' ? values : values[0]) as PlanningSessionStatus | '')
            }
          >
            <GoADropdownItem value="" label="All Statuses" />
            <GoADropdownItem value="active" label="Active" />
            <GoADropdownItem value="paused" label="Paused" />
            <GoADropdownItem value="completed" label="Completed" />
            <GoADropdownItem value="archived" label="Archived" />
          </GoADropdown>
        </GoAFormItem>
      </GoADetails>

      {/* Error state */}
      {error && (
        <GoACallout type="emergency" heading="Unable to load sessions">
          {error}
        </GoACallout>
      )}

      {/* Loading state */}
      {loading && <GoACircularProgress variant="inline" message="Loading sessions..." />}

      {/* Data table or empty state */}
      {!loading && !error && (
        <>
          {sortedSessions.length === 0 ? (
            <GoACallout type="information" heading="No planning sessions">
              You have no planning sessions yet. Start your first session to begin exploring ADSP service
              options.{' '}
              <GoAButton type="primary" onClick={() => navigate('/sessions/new')}>
                Start New Session
              </GoAButton>
            </GoACallout>
          ) : (
            <>
              <GoATable width="100%">
                <thead>
                  <tr>
                    <th style={{ width: '40%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('title')}>
                      Session Title {sortColumn === 'title' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ width: '12%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                      Status {sortColumn === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ width: '18%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('updatedAt')}>
                      Last Updated {sortColumn === 'updatedAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ width: '18%' }}>Created</th>
                    <th style={{ width: '12%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSessions.map((session) => (
                    <tr key={session.id}>
                      <td style={{ width: '40%' }}>
                        {/* FAC-S5-025: userId/tenantId NOT rendered */}
                        <a
                          href={`/sessions/${session.id}/planning`}
                          style={{ fontWeight: 500, color: 'var(--goa-color-interactive-default)' }}
                        >
                          {session.title}
                        </a>
                        {session.businessProblemSummary && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--goa-color-text-secondary)', marginTop: '2px' }}>
                            {session.businessProblemSummary.length > 80
                              ? `${session.businessProblemSummary.slice(0, 80)}...`
                              : session.businessProblemSummary}
                          </div>
                        )}
                        {isSessionIdle(session) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--goa-color-status-warning)', marginTop: '2px' }}>
                            Idle 7+ days
                          </div>
                        )}
                      </td>
                      <td style={{ width: '12%' }}>
                        <span style={{
                          ...STATUS_CHIP_STYLES[session.status],
                          padding: '3px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.02em',
                        }}>
                          {STATUS_LABELS[session.status]}
                        </span>
                      </td>
                      <td style={{ width: '18%' }}>
                        {new Date(session.updatedAt).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ width: '18%' }}>
                        {new Date(session.createdAt).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ width: '12%' }}>
                        {(session.status === 'active' || session.status === 'paused') && (
                          <GoAButton
                            type="tertiary"
                            size="compact"
                            onClick={() => handleResume(session)}
                          >
                            {session.status === 'paused' ? 'Resume' : 'Open'}
                          </GoAButton>
                        )}
                        {session.status === 'completed' && (
                          <GoAButton
                            type="tertiary"
                            size="compact"
                            onClick={() => navigate(`/sessions/${session.id}/export`)}
                          >
                            Export
                          </GoAButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </GoATable>

              <GoAPagination
                itemCount={totalItems}
                perPageCount={PER_PAGE}
                pageNumber={page}
                onChange={(value: number) => setPage(value)}
              />
            </>
          )}
        </>
      )}
    </GoAContainer>
  );
};

export default SessionDashboard;
