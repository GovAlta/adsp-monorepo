/**
 * PatternLibrary.tsx — Pattern Library list-index page
 *
 * Paginated, filterable, sortable list of business patterns for the tenant.
 * Allows creation (navigate to PatternEditor in create mode) and editing
 * (navigate to PatternEditor in edit mode with patternId).
 *
 * Integration: INT-002 (ADSP Config Service) is STUB — returns empty list with
 * X-Integration-Stubbed: INT-002 header (OPEN-004). Empty state is shown in stub mode.
 *
 * Access: planner-admin or tenant-admin required (planner-user gets 403).
 * ✓ ASVS:V-9.1.1 — auth enforced at API layer; token from Keycloak context in api.ts
 *
 * Security: pattern data is tenant-scoped configuration, not Protected B personal data.
 * Filter params (status, page, sort) are NOT Protected B — safe as query params (FAC-S5-024).
 * No localStorage/sessionStorage writes (FAC-S5-026).
 * No masking required (FAC-S5-025 PASS-N/A).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  GoAIconButton,
  GoAPagination,
  GoATable,
  GoATableSortHeader,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { BusinessPattern } from '../services/api.types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type SortColumn = 'name' | 'lastModified' | 'matchCount';
type SortDir = 'ASC' | 'DESC';
type StatusFilter = 'all' | 'active' | 'inactive';

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface PatternLibraryProps {
  readOnly?: boolean;
}

const PatternLibrary: React.FC<PatternLibraryProps> = ({ readOnly = false }) => {
  const navigate = useNavigate();

  const [patterns, setPatterns] = useState<BusinessPattern[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isStub503, setIsStub503] = useState<boolean>(false);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(20);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Sort state — default: lastModified DESC per content spec
  const [sortBy, setSortBy] = useState<SortColumn>('lastModified');
  const [sortDir, setSortDir] = useState<SortDir>('DESC');

  // ── Load patterns ─────────────────────────────────────────────────────────
  const loadPatterns = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsStub503(false);
    try {
      const result = await api.listPatterns({
        page,
        pageSize: perPage,
        status: statusFilter !== 'all' ? (statusFilter as 'active' | 'inactive') : undefined,
      });
      // Client-side sort — placeholder until INT-002 live (sortBy/sortDir to be passed
      // as query params once ADSP Config Service supports them per OPEN-004).
      const sorted = [...result.items].sort((a, b) => {
        const dir = sortDir === 'ASC' ? 1 : -1;
        if (sortBy === 'name') return dir * a.name.localeCompare(b.name);
        if (sortBy === 'matchCount') return dir * (a.matchCount - b.matchCount);
        // lastModified (default)
        return dir * (new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime());
      });
      setPatterns(sorted);
      setTotal(result.total);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        // INT-002 stub unavailable — show stub warning banner (TC-027)
        setIsStub503(true);
        setPatterns([]);
        setTotal(0);
      } else {
        setError('Pattern data could not be loaded. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, sortBy, sortDir]);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStatusFilterChange = (_name: string, values: string | string[]) => {
    const value = typeof values === 'string' ? values : values[0];
    setStatusFilter(value as StatusFilter);
    setPage(1);
  };

  const handleDateFromChange = (_name: string, value: Date) => {
    setDateFrom(value.toISOString().split('T')[0]);
    setPage(1);
  };

  const handleDateToChange = (_name: string, value: Date) => {
    setDateTo(value.toISOString().split('T')[0]);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const formatDate = (iso: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortDirForHeader = (col: SortColumn): 'asc' | 'desc' | 'none' =>
    sortBy === col ? (sortDir.toLowerCase() as 'asc' | 'desc') : 'none';

  // ── Empty-state detection ─────────────────────────────────────────────────
  const isFiltered = statusFilter !== 'all' || dateFrom !== '' || dateTo !== '';
  const isEmpty = !loading && !error && !isStub503 && patterns.length === 0;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <GoAContainer>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--goa-space-s)' }}>
          <h1 style={{ margin: 0 }}>{readOnly ? 'Available Patterns' : 'Pattern Library'}</h1>
          {!loading && (
            <GoABadge type="midtone" content={`${total} patterns`} />
          )}
        </div>
        {!readOnly && (
          <GoAButton
            type="primary"
            onClick={() => navigate('/admin/patterns/new')}
            aria-label="Create Pattern — navigate to Pattern Editor in create mode"
          >
            Create Pattern
          </GoAButton>
        )}
      </div>

      {/* ── INT-002 Stub Banner ─────────────────────────────────────────── */}
      {isStub503 && (
        <GoACallout type="important" heading="Pattern data is temporarily unavailable">
          The pattern service is being provisioned. Please try again later.
        </GoACallout>
      )}

      {/* ── General error ────────────────────────────────────────────────── */}
      {error && (
        <GoACallout type="emergency" heading="Unable to load patterns">
          {error}
        </GoACallout>
      )}

      {/* ── Filter Drawer ────────────────────────────────────────────────── */}
      <GoADetails heading="Filter Patterns" open={false}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--goa-space-m)',
            padding: 'var(--goa-space-m) 0',
          }}
        >
          <GoAFormItem label="Status">
            <GoADropdown
              name="status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <GoADropdownItem value="all" label="All Statuses" />
              <GoADropdownItem value="active" label="Active" />
              <GoADropdownItem value="inactive" label="Inactive" />
            </GoADropdown>
          </GoAFormItem>

          <GoAFormItem label="Last Modified From" helpText="Filter patterns modified from this date.">
            <GoADatePicker
              name="dateFrom"
              value={dateFrom ? new Date(dateFrom) : undefined}
              onChange={handleDateFromChange}
            />
          </GoAFormItem>

          <GoAFormItem label="Last Modified To" helpText="Filter patterns modified up to this date.">
            <GoADatePicker
              name="dateTo"
              value={dateTo ? new Date(dateTo) : undefined}
              onChange={handleDateToChange}
            />
          </GoAFormItem>
        </div>

        {isFiltered && (
          <GoAButton type="secondary" onClick={handleClearFilters}>
            Clear Filters
          </GoAButton>
        )}
      </GoADetails>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <GoACircularProgress variant="inline" message="Loading patterns..." />
      )}

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      {!loading && !error && !isStub503 && !isEmpty && (
        <GoATable width="100%" onSort={(col: string, dir: number) => {
          setSortBy(col as SortColumn);
          setSortDir(dir === 1 ? 'ASC' : dir === -1 ? 'DESC' : 'ASC');
          setPage(1);
        }}>
          <thead>
            <tr>
              <GoATableSortHeader
                name="name"
                direction={sortDirForHeader('name')}
              >
                Pattern Name
              </GoATableSortHeader>
              <GoATableSortHeader
                name="lastModified"
                direction={sortDirForHeader('lastModified')}
              >
                Last Modified
              </GoATableSortHeader>
              {/* Status is non-sortable per content spec */}
              <th>Status</th>
              <GoATableSortHeader
                name="matchCount"
                direction={sortDirForHeader('matchCount')}
              >
                Matches
              </GoATableSortHeader>
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {patterns.map((pattern) => (
              <tr key={pattern.id}>
                <td>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/patterns/${pattern.id}/view`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--goa-color-interactive-default)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      textDecoration: 'underline',
                    }}
                    aria-label={`View pattern: ${pattern.name}`}
                  >
                    {pattern.name}
                  </button>
                </td>
                <td>{formatDate(pattern.lastModified)}</td>
                <td>
                  <GoABadge
                    type={pattern.status === 'active' ? 'success' : 'midtone'}
                    content={pattern.status === 'active' ? 'Active' : 'Inactive'}
                  />
                </td>
                <td>{pattern.matchCount}</td>
                {!readOnly && (
                  <td>
                    <GoAIconButton
                      icon="create"
                      title={`Edit ${pattern.name}`}
                      onClick={() => navigate(`/admin/patterns/${pattern.id}`)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </GoATable>
      )}

      {/* ── Empty State (no patterns exist) ──────────────────────────────── */}
      {isEmpty && !isFiltered && (
        <GoACallout type="information" heading="No patterns available">
          {readOnly
            ? 'No business patterns are currently available. Check back later or contact your administrator.'
            : 'No business patterns have been created for this tenant. Create your first pattern to enable AI-assisted pattern matching in planning sessions.'}
          {!readOnly && (
            <>
              <br />
              <GoAButton
                type="primary"
                onClick={() => navigate('/admin/patterns/new')}
                aria-label="Create Pattern — navigate to Pattern Editor"
              >
                Create Pattern
              </GoAButton>
            </>
          )}
        </GoACallout>
      )}

      {/* ── Empty State (no patterns match current filter) ───────────────── */}
      {isEmpty && isFiltered && (
        <GoACallout type="information" heading="No patterns match your filters">
          No patterns match your current filters. Clear filters to see all patterns.
          <br />
          <GoAButton type="secondary" onClick={handleClearFilters}>
            Clear Filters
          </GoAButton>
        </GoACallout>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {!loading && !error && !isStub503 && total > perPage && (
        <GoAPagination
          pageNumber={page}
          itemCount={total}
          perPageCount={perPage}
          onChange={handlePageChange}
        />
      )}
    </GoAContainer>
  );
};

export default PatternLibrary;
