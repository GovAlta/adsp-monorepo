import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoabButton,
  GoabCallout,
  GoabDrawer,
  GoabDropdown,
  GoabDropdownItem,
  GoabFilterChip,
  GoabFormItem,
  GoabInput,
} from '@abgov/react-components';
import { RootState } from '@store/index';
import { fetchAuditConfiguration, clearAuditEvents, exportAuditEvents, fetchAuditEvents } from '@store/audit/actions';
import { AUDIT_DEFAULT_PAGE_SIZE, AUDIT_PAGE_SIZES } from '@store/audit/models';
import type { AuditEventCriteria, AuditEventRecord } from '@store/audit/models';
import DataTable from '@components/DataTable';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import {
  ActiveFilters,
  FilterControls,
  FilterDrawerFooterActions,
  FilterPanelGrid,
  PageSizeSelector,
  PaginationRow,
  PaginationSummary,
  SearchActions,
} from '../../event-log/styled-components';
import { AuditEventDetails } from './eventDetails';

const READER_ROLE = 'audit-reader';
const ANY = 'any';
const CATEGORIES = ['administrative', 'runtime', 'security', 'data-access'];
const STATUSES = ['success', 'failure', 'blocked', 'error'];
const SEVERITIES = ['info', 'warning', 'critical'];

const FILTER_LABELS: Record<keyof AuditEventCriteria, string> = {
  namespace: 'Namespace',
  action: 'Action',
  actor: 'Actor ID',
  resourceType: 'Resource type',
  resourceId: 'Resource ID',
  scope: 'Scope',
  category: 'Category',
  status: 'Status',
  severity: 'Severity',
  correlationId: 'Correlation ID',
  sessionId: 'Session ID',
  occurredFrom: 'From',
  occurredTo: 'To',
};

const toIso = (value?: string) => (value ? new Date(value).toISOString() : undefined);

const EventRow: FunctionComponent<{ event: AuditEventRecord }> = ({ event }) => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <>
      <tr>
        <td>{new Date(event.occurredAt).toLocaleString()}</td>
        <td>{event.namespace}</td>
        <td data-testid="audit-event-action">{event.action}</td>
        <td>{event.actor?.name || event.actor?.email || event.actor?.id}</td>
        <td>{event.resource ? `${event.resource.type}${event.resource.id ? `/${event.resource.id}` : ''}` : ''}</td>
        <td>{event.category}</td>
        <td>{event.status}</td>
        <td>
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showDetails ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => setShowDetails(!showDetails)}
              testId="audit-event-toggle-details"
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td colSpan={8}>
            <AuditEventDetails event={event} />
          </td>
        </tr>
      )}
    </>
  );
};

export const AuditLogs: FunctionComponent = () => {
  const dispatch = useDispatch();
  const hasReaderRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:audit-service']?.roles?.includes(READER_ROLE),
  );
  const { results, next, loading } = useSelector((state: RootState) => state.audit.events);
  const catalogs = useSelector((state: RootState) => state.audit.catalogs);
  const knownNamespaces = useSelector((state: RootState) => state.audit.namespaces);
  const exporting = useSelector((state: RootState) => state.audit.exporting);
  const [criteria, setCriteria] = useState<AuditEventCriteria>({});
  const [applied, setApplied] = useState<AuditEventCriteria>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pageSize, setPageSize] = useState(AUDIT_DEFAULT_PAGE_SIZE);
  // The API pages by cursor, so the cursor that opens each page is remembered to allow going back.
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);

  const set = (key: keyof AuditEventCriteria, value?: string) =>
    setCriteria((current) => ({ ...current, [key]: value || undefined }));

  // The resource ID is only meaningful alongside a type, so clearing the type clears the ID.
  const setResourceType = (value?: string) =>
    setCriteria((current) => ({
      ...current,
      resourceType: value || undefined,
      resourceId: value ? current.resourceId : undefined,
    }));

  // Changing the namespace invalidates an action chosen from another namespace's catalog.
  const setNamespace = (value?: string) =>
    setCriteria((current) => ({ ...current, namespace: value || undefined, action: undefined }));

  // Catalogs list registered applications; the namespaces endpoint adds any namespace that has events but no visible
  // catalog (e.g. core services).
  const namespaces = Array.from(
    new Set([...catalogs.map((c) => c.application), ...knownNamespaces, applied.namespace ?? '']),
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  // Without a namespace, actions are shown as "namespace/action" so duplicates across applications stay distinct.
  const actionOptions = (criteria.namespace ? catalogs.filter((c) => c.application === criteria.namespace) : catalogs)
    .flatMap((c) =>
      c.actions.map((a) => {
        const value = criteria.namespace ? a.name : `${c.application}/${a.name}`;
        return { value, label: value };
      }),
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  const selectAction = (value: string) => {
    if (value === ANY) {
      set('action', undefined);
    } else if (criteria.namespace) {
      set('action', value);
    } else {
      // Application names never contain '/', so the first one separates namespace from action.
      const separator = value.indexOf('/');
      setCriteria((current) => ({
        ...current,
        namespace: value.substring(0, separator),
        action: value.substring(separator + 1),
      }));
    }
  };

  const loadFirstPage = (nextCriteria: AuditEventCriteria, size = pageSize) => {
    setApplied(nextCriteria);
    setPage(0);
    setCursors([undefined]);
    setSearched(true);
    dispatch(fetchAuditEvents(nextCriteria, undefined, size));
  };

  const search = () => {
    loadFirstPage({
      ...criteria,
      occurredFrom: toIso(criteria.occurredFrom),
      occurredTo: toIso(criteria.occurredTo),
    });
    setFiltersOpen(false);
  };

  const reset = () => {
    setCriteria({});
    loadFirstPage({});
  };

  const removeFilter = (key: keyof AuditEventCriteria) => {
    const remove = (current: AuditEventCriteria) => {
      const { [key]: _removed, ...rest } = current;
      return key === 'resourceType' ? { ...rest, resourceId: undefined } : rest;
    };
    setCriteria(remove);
    loadFirstPage(remove(applied));
  };

  const goNext = () => {
    setCursors([...cursors.slice(0, page + 1), next]);
    setPage(page + 1);
    dispatch(fetchAuditEvents(applied, next, pageSize));
  };

  const goPrevious = () => {
    setPage(page - 1);
    dispatch(fetchAuditEvents(applied, cursors[page - 1], pageSize));
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    loadFirstPage(applied, size);
  };

  useEffect(() => {
    if (hasReaderRole) {
      dispatch(fetchAuditConfiguration());
      dispatch(fetchAuditEvents({}, undefined, AUDIT_DEFAULT_PAGE_SIZE));
      setSearched(true);
    }
    return () => {
      dispatch(clearAuditEvents());
    };
  }, [dispatch, hasReaderRole]);

  if (!hasReaderRole) {
    return (
      <GoabCallout heading="Audit reader role required" type="information" testId="audit-role-callout">
        <p>You need the urn:ads:platform:audit-service 'audit-reader' role to see the audit log.</p>
      </GoabCallout>
    );
  }

  const badges = (Object.keys(FILTER_LABELS) as (keyof AuditEventCriteria)[])
    .filter((key) => applied[key])
    .map((key) => ({
      key,
      label: FILTER_LABELS[key],
      value: key === 'occurredFrom' || key === 'occurredTo' ? new Date(applied[key]).toLocaleString() : applied[key],
    }));
  const firstShown = page * pageSize + 1;

  return (
    <section>
      <p>The audit log shows who did what, and when, in your tenant. Events are read-only.</p>
      <SearchActions>
        <div>
          <GoabButton
            size="compact"
            type="secondary"
            onClick={() => dispatch(exportAuditEvents(applied))}
            disabled={loading || exporting || results.length === 0}
            testId="audit-export"
          >
            {exporting ? 'Downloading...' : 'Download CSV'}
          </GoabButton>
        </div>
        <FilterControls>
          <GoabButton
            size="compact"
            type="secondary"
            leadingIcon="filter"
            trailingIcon={filtersOpen ? 'chevron-back' : 'chevron-forward'}
            onClick={() => setFiltersOpen((open) => !open)}
            testId="audit-filters-toggle"
          >
            Filters
          </GoabButton>
        </FilterControls>
      </SearchActions>
      <GoabDrawer
        heading="Filters"
        position="right"
        open={filtersOpen}
        testId="audit-filter-panel"
        maxSize="480px"
        onClose={() => setFiltersOpen(false)}
        actions={
          <FilterDrawerFooterActions>
            <GoabButton
              size="compact"
              type="secondary"
              leadingIcon="reload"
              onClick={reset}
              disabled={loading}
              testId="audit-reset"
            >
              Reset
            </GoabButton>
            <GoabButton
              size="compact"
              type="secondary"
              leadingIcon="close"
              onClick={() => setFiltersOpen(false)}
              testId="audit-filter-close"
            >
              Close
            </GoabButton>
            <GoabButton size="compact" leadingIcon="search" onClick={search} disabled={loading} testId="audit-search">
              Search
            </GoabButton>
          </FilterDrawerFooterActions>
        }
      >
        <p>Add one or more filters to narrow the results. All selected filters are applied together.</p>
        <FilterPanelGrid>
          <div className="filter-label">Namespace</div>
          {namespaces.length > 0 ? (
            <GoabDropdown
              name="audit-namespace"
              native
              size="compact"
              width="100%"
              value={criteria.namespace || ANY}
              onChange={(d) => setNamespace(d.value === ANY ? undefined : (d.value as string))}
            >
              <GoabDropdownItem value={ANY} label="All namespaces" />
              {namespaces.map((n) => (
                <GoabDropdownItem key={n} value={n} label={n} />
              ))}
            </GoabDropdown>
          ) : (
            <GoabInput
              name="audit-namespace"
              size="compact"
              width="100%"
              value={criteria.namespace || ''}
              onChange={(d) => setNamespace(d.value)}
            />
          )}
          <div className="filter-label">Action</div>
          {actionOptions.length > 0 ? (
            <GoabDropdown
              name="audit-action"
              native
              size="compact"
              width="100%"
              value={criteria.action || ANY}
              onChange={(d) => selectAction(d.value as string)}
            >
              <GoabDropdownItem value={ANY} label="All actions" />
              {actionOptions.map((o) => (
                <GoabDropdownItem key={o.value} value={o.value} label={o.label} />
              ))}
            </GoabDropdown>
          ) : (
            <GoabInput
              name="audit-action"
              size="compact"
              width="100%"
              value={criteria.action || ''}
              onChange={(d) => set('action', d.value)}
            />
          )}
          <div className="filter-label">Actor ID</div>
          <GoabInput
            name="audit-actor"
            size="compact"
            width="100%"
            value={criteria.actor || ''}
            onChange={(d) => set('actor', d.value)}
          />
          <div className="filter-label">Resource type</div>
          <GoabInput
            name="audit-resource-type"
            size="compact"
            width="100%"
            value={criteria.resourceType || ''}
            onChange={(d) => setResourceType(d.value)}
          />
          <div className="filter-label">Resource ID</div>
          <GoabInput
            name="audit-resource-id"
            size="compact"
            width="100%"
            disabled={!criteria.resourceType}
            placeholder="Requires a resource type"
            value={criteria.resourceId || ''}
            onChange={(d) => set('resourceId', d.value)}
          />
          <div className="filter-label">Scope</div>
          <GoabInput
            name="audit-scope"
            size="compact"
            width="100%"
            value={criteria.scope || ''}
            onChange={(d) => set('scope', d.value)}
          />
          <div className="filter-label">Category</div>
          <GoabDropdown
            name="audit-category"
            native
            size="compact"
            width="100%"
            value={criteria.category || ANY}
            onChange={(d) => set('category', d.value === ANY ? undefined : (d.value as string))}
          >
            <GoabDropdownItem value={ANY} label="All categories" />
            {CATEGORIES.map((c) => (
              <GoabDropdownItem key={c} value={c} label={c} />
            ))}
          </GoabDropdown>
          <div className="filter-label">Status</div>
          <GoabDropdown
            name="audit-status"
            native
            size="compact"
            width="100%"
            value={criteria.status || ANY}
            onChange={(d) => set('status', d.value === ANY ? undefined : (d.value as string))}
          >
            <GoabDropdownItem value={ANY} label="All statuses" />
            {STATUSES.map((s) => (
              <GoabDropdownItem key={s} value={s} label={s} />
            ))}
          </GoabDropdown>
          <div className="filter-label">Severity</div>
          <GoabDropdown
            name="audit-severity"
            native
            size="compact"
            width="100%"
            value={criteria.severity || ANY}
            onChange={(d) => set('severity', d.value === ANY ? undefined : (d.value as string))}
          >
            <GoabDropdownItem value={ANY} label="All severities" />
            {SEVERITIES.map((s) => (
              <GoabDropdownItem key={s} value={s} label={s} />
            ))}
          </GoabDropdown>
          <div className="filter-label">Correlation ID</div>
          <GoabInput
            name="audit-correlation-id"
            size="compact"
            width="100%"
            value={criteria.correlationId || ''}
            onChange={(d) => set('correlationId', d.value)}
          />
          <div className="filter-label">Session ID</div>
          <GoabInput
            name="audit-session-id"
            size="compact"
            width="100%"
            value={criteria.sessionId || ''}
            onChange={(d) => set('sessionId', d.value)}
          />
          <GoabFormItem label="From" maxWidth="100%" mt="m">
            <GoabInput
              name="audit-from"
              type="datetime-local"
              size="compact"
              width="100%"
              value={criteria.occurredFrom || ''}
              onChange={(d) => set('occurredFrom', d.value)}
            />
          </GoabFormItem>
          <GoabFormItem label="To" maxWidth="100%">
            <GoabInput
              name="audit-to"
              type="datetime-local"
              size="compact"
              width="100%"
              value={criteria.occurredTo || ''}
              onChange={(d) => set('occurredTo', d.value)}
            />
          </GoabFormItem>
        </FilterPanelGrid>
      </GoabDrawer>
      <ActiveFilters role="group" aria-label="Active audit log filters" aria-busy={loading}>
        {badges.map(({ key, label, value }) => (
          <GoabFilterChip
            key={key}
            content={`${label}: ${value}`}
            testId={`audit-filter-badge-${key}`}
            onClick={() => removeFilter(key)}
          />
        ))}
      </ActiveFilters>

      {loading && results.length === 0 && <PageIndicator />}
      {!loading && searched && results.length === 0 && renderNoItem('audit event')}
      {results.length > 0 && (
        <>
          <DataTable data-testid="audit-events-table">
            <thead>
              <tr>
                <th>Occurred</th>
                <th>Namespace</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Resource</th>
                <th>Category</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </tbody>
          </DataTable>
          <PaginationRow>
            <PaginationSummary>
              <PageSizeSelector>
                <span>Show</span>
                {/* Native, matching the event log page size selector. */}
                <GoabDropdown
                  name="audit-page-size"
                  ariaLabel="Events per page"
                  native
                  value={`${pageSize}`}
                  size="compact"
                  width="9ch"
                  testId="audit-page-size"
                  onChange={(d) => changePageSize(Number(d.value))}
                >
                  {AUDIT_PAGE_SIZES.map((size) => (
                    <GoabDropdownItem key={size} value={`${size}`} label={`${size}`} />
                  ))}
                </GoabDropdown>
                <span>per page</span>
              </PageSizeSelector>
              <span data-testid="audit-result-count" aria-live="polite">
                {`Showing ${firstShown.toLocaleString()}–${(firstShown + results.length - 1).toLocaleString()} events`}
              </span>
            </PaginationSummary>
            <div style={{ display: 'flex', gap: 'var(--goa-space-s)' }}>
              <GoabButton
                size="compact"
                type="secondary"
                leadingIcon="arrow-back"
                disabled={loading || page === 0}
                onClick={goPrevious}
                testId="audit-previous"
              >
                Previous
              </GoabButton>
              <GoabButton
                size="compact"
                type="secondary"
                trailingIcon="arrow-forward"
                disabled={loading || !next}
                onClick={goNext}
                testId="audit-next"
              >
                Next
              </GoabButton>
            </div>
          </PaginationRow>
        </>
      )}
    </section>
  );
};
