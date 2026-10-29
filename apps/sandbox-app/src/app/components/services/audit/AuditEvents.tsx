import {
  GoabBadge,
  GoabButton,
  GoabDrawer,
  GoabDropdown,
  GoabDropdownItem,
  GoabFilterChip,
  GoabFormItem,
  GoabInput,
  GoabSpinner,
} from '@abgov/react-components';
import { Fragment, useEffect, useState } from 'react';
import {
  ActionDefinition,
  EventQuery,
  StoredAuditEvent,
  exportEvents,
  getActions,
  getEvents,
  getNamespaces,
} from './auditApi';
import { downloadCsv, errorMessage, exportErrorMessage } from './util';
import { ErrorCallout, Json, STATUS_BADGE } from './common';

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const ANY = 'any';
const STATUSES = ['success', 'failure', 'blocked', 'error'];
const CATEGORIES = ['administrative', 'runtime', 'security', 'data-access'];
const SEVERITIES = ['info', 'warning', 'critical'];

interface Criteria extends Omit<EventQuery, 'top' | 'after'> {
  namespace?: string;
}

const FILTER_LABELS: Record<keyof Criteria, string> = {
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

const gridStyle = { display: 'grid', gridTemplateColumns: '9rem 1fr', gap: '0.75rem 1rem', alignItems: 'center' };
const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginTop: '1rem',
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return value === undefined || value === null || value === '' ? null : (
    <div>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function EventDetails({ event }: { event: StoredAuditEvent }) {
  const { actor, resource, changeSet, metadata } = event;
  return (
    <div>
      <Field label="Event ID" value={event.id} />
      <Field label="Correlation ID" value={event.correlationId} />
      <Field label="Session ID" value={event.sessionId} />
      <Field label="Severity" value={event.severity} />
      <Field label="Scope" value={event.scopeIds?.join(', ')} />
      <Field label="Actor ID" value={actor?.id} />
      <Field label="Actor type" value={actor?.type} />
      <Field label="Actor name" value={actor?.name} />
      <Field label="Actor email" value={actor?.email} />
      <Field label="Actor roles" value={actor?.roles?.join(', ')} />
      <Field label="Resource type" value={resource?.type} />
      <Field label="Resource ID" value={resource?.id} />
      <Field label="Resource name" value={resource?.name} />
      <Field label="Retention class" value={event.retentionClass} />
      <Field
        label="Retained until"
        value={event.retentionUntil ? new Date(event.retentionUntil).toLocaleString() : undefined}
      />
      {changeSet?.before && (
        <>
          <strong>Change set: before</strong>
          <Json value={changeSet.before} />
        </>
      )}
      {changeSet?.after && (
        <>
          <strong>Change set: after</strong>
          <Json value={changeSet.after} />
        </>
      )}
      {metadata && Object.keys(metadata).length > 0 && (
        <>
          <strong>Metadata</strong>
          <Json value={metadata} />
        </>
      )}
    </div>
  );
}

export function AuditEvents() {
  const [criteria, setCriteria] = useState<Criteria>({});
  const [applied, setApplied] = useState<Criteria>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [events, setEvents] = useState<StoredAuditEvent[]>();
  const [expanded, setExpanded] = useState<string>();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // The API pages by cursor, so the cursor that opens each page is remembered to allow going back.
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [next, setNext] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string>();

  const set = (key: keyof Criteria, value?: string) =>
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

  const load = async (nextCriteria: Criteria, after: string | undefined, size: number) => {
    try {
      setLoading(true);
      setError(undefined);
      const { namespace, ...filters } = nextCriteria;
      const result = await getEvents({ ...filters, top: size, after }, namespace);
      setEvents(result.results);
      setNext(result.page.next);
      setExpanded(undefined);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadFirstPage = (nextCriteria: Criteria, size = pageSize) => {
    setApplied(nextCriteria);
    setPage(0);
    setCursors([undefined]);
    return load(nextCriteria, undefined, size);
  };

  const search = () => {
    setFiltersOpen(false);
    return loadFirstPage({
      ...criteria,
      occurredFrom: toIso(criteria.occurredFrom),
      occurredTo: toIso(criteria.occurredTo),
    });
  };

  const reset = () => {
    setCriteria({});
    return loadFirstPage({});
  };

  const removeFilter = (key: keyof Criteria) => {
    const remove = (current: Criteria): Criteria => {
      const { [key]: _removed, ...rest } = current;
      return key === 'resourceType' ? { ...rest, resourceId: undefined } : rest;
    };
    setCriteria(remove);
    return loadFirstPage(remove(applied));
  };

  const goNext = () => {
    setCursors([...cursors.slice(0, page + 1), next]);
    setPage(page + 1);
    return load(applied, next, pageSize);
  };

  const goPrevious = () => {
    setPage(page - 1);
    return load(applied, cursors[page - 1], pageSize);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    return loadFirstPage(applied, size);
  };

  const download = async () => {
    try {
      setExporting(true);
      setError(undefined);
      const { namespace, ...filters } = applied;
      const csv = await exportEvents(filters, namespace);
      downloadCsv(`audit-events-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } catch (err) {
      setError(await exportErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadFirstPage({});
    // The namespace list only improves the filter, so failing to load it is not surfaced as an error.
    getNamespaces()
      .then(setNamespaces)
      .catch(() => setNamespaces([]));
  }, []);

  // The actions of a namespace come from its catalog; without a namespace the action is entered as text.
  useEffect(() => {
    if (!criteria.namespace) {
      setActions([]);
      return;
    }
    let current = true;
    getActions(criteria.namespace)
      .then((definitions: ActionDefinition[]) => current && setActions(definitions.map((a) => a.name).sort()))
      .catch(() => current && setActions([]));
    return () => {
      current = false;
    };
  }, [criteria.namespace]);

  const badges = (Object.keys(FILTER_LABELS) as (keyof Criteria)[])
    .filter((key) => applied[key])
    .map((key) => ({
      key,
      label: FILTER_LABELS[key],
      value:
        key === 'occurredFrom' || key === 'occurredTo'
          ? new Date(applied[key] as string).toLocaleString()
          : applied[key],
    }));
  const firstShown = page * pageSize + 1;

  const selectField = (
    name: string,
    value: string | undefined,
    anyLabel: string,
    options: string[],
    onChange: (value?: string) => void,
  ) => (
    <GoabDropdown
      name={name}
      native
      size="compact"
      width="100%"
      value={value || ANY}
      onChange={(d) => onChange(d.value === ANY ? undefined : (d.value as string))}
    >
      <GoabDropdownItem value={ANY} label={anyLabel} />
      {options.map((o) => (
        <GoabDropdownItem key={o} value={o} label={o} />
      ))}
    </GoabDropdown>
  );

  const textField = (name: string, key: keyof Criteria, extra: { disabled?: boolean; placeholder?: string } = {}) => (
    <GoabInput
      name={name}
      size="compact"
      width="100%"
      value={criteria[key] || ''}
      onChange={(d) => (key === 'resourceType' ? setResourceType(d.value) : set(key, d.value))}
      {...extra}
    />
  );

  return (
    <section>
      <p>The audit log shows who did what, and when, in your tenant. Events are read-only.</p>
      <div style={{ ...rowStyle, marginTop: 0 }}>
        <GoabButton
          size="compact"
          type="secondary"
          leadingIcon="download"
          disabled={loading || exporting || !events?.length}
          onClick={download}
          testId="audit-export"
        >
          {exporting ? 'Downloading...' : 'Download CSV'}
        </GoabButton>
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
      </div>

      <GoabDrawer
        heading="Filters"
        position="right"
        open={filtersOpen}
        maxSize="480px"
        testId="audit-filter-panel"
        onClose={() => setFiltersOpen(false)}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <GoabButton size="compact" type="secondary" leadingIcon="reload" disabled={loading} onClick={reset}>
              Reset
            </GoabButton>
            <GoabButton size="compact" type="secondary" leadingIcon="close" onClick={() => setFiltersOpen(false)}>
              Close
            </GoabButton>
            <GoabButton size="compact" leadingIcon="search" disabled={loading} onClick={search} testId="audit-search">
              Search
            </GoabButton>
          </div>
        }
      >
        <p>Add one or more filters to narrow the results. All selected filters are applied together.</p>
        <div style={gridStyle}>
          <div>Namespace</div>
          {namespaces.length > 0
            ? selectField('audit-namespace', criteria.namespace, 'All namespaces', namespaces, setNamespace)
            : textField('audit-namespace', 'namespace')}
          <div>Action</div>
          {actions.length > 0
            ? selectField('audit-action', criteria.action, 'All actions', actions, (v) => set('action', v))
            : textField('audit-action', 'action')}
          <div>Actor ID</div>
          {textField('audit-actor', 'actor')}
          <div>Resource type</div>
          {textField('audit-resource-type', 'resourceType')}
          <div>Resource ID</div>
          {textField('audit-resource-id', 'resourceId', {
            disabled: !criteria.resourceType,
            placeholder: 'Requires a resource type',
          })}
          <div>Scope</div>
          {textField('audit-scope', 'scope')}
          <div>Category</div>
          {selectField('audit-category', criteria.category, 'All categories', CATEGORIES, (v) => set('category', v))}
          <div>Status</div>
          {selectField('audit-status', criteria.status, 'All statuses', STATUSES, (v) => set('status', v))}
          <div>Severity</div>
          {selectField('audit-severity', criteria.severity, 'All severities', SEVERITIES, (v) => set('severity', v))}
          <div>Correlation ID</div>
          {textField('audit-correlation-id', 'correlationId')}
          <div>Session ID</div>
          {textField('audit-session-id', 'sessionId')}
        </div>
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
      </GoabDrawer>

      <div
        role="group"
        aria-label="Active audit log filters"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
      >
        {badges.map(({ key, label, value }) => (
          <GoabFilterChip
            key={key}
            content={`${label}: ${value}`}
            testId={`audit-filter-badge-${key}`}
            onClick={() => removeFilter(key)}
          />
        ))}
      </div>

      <ErrorCallout message={error} />
      {loading && !events?.length && <GoabSpinner type="infinite" size="large" />}
      {!loading && events && !events.length && !error && <p>No audit events match the filters.</p>}

      {!!events?.length && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
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
              {events.map((event) => (
                <Fragment key={event.id}>
                  <tr style={{ borderTop: '1px solid var(--goa-color-greyscale-200, #dcdcdc)' }}>
                    <td>{new Date(event.occurredAt).toLocaleString()}</td>
                    <td>{event.namespace}</td>
                    <td>{event.action}</td>
                    <td>{event.actor.name || event.actor.email || event.actor.id}</td>
                    <td>
                      {event.resource
                        ? `${event.resource.type}${event.resource.id ? `/${event.resource.id}` : ''}`
                        : ''}
                    </td>
                    <td>{event.category}</td>
                    <td>
                      <GoabBadge type={STATUS_BADGE[event.status]} content={event.status} icon={false} />
                    </td>
                    <td>
                      <GoabButton
                        type="tertiary"
                        size="compact"
                        leadingIcon={expanded === event.id ? 'eye-off' : 'eye'}
                        onClick={() => setExpanded(expanded === event.id ? undefined : event.id)}
                      >
                        {expanded === event.id ? 'Hide' : 'Show'}
                      </GoabButton>
                    </td>
                  </tr>
                  {expanded === event.id && (
                    <tr>
                      <td colSpan={8}>
                        <EventDetails event={event} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          <div style={rowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>Show</span>
              <GoabDropdown
                name="audit-page-size"
                ariaLabel="Events per page"
                native
                size="compact"
                width="9ch"
                value={`${pageSize}`}
                onChange={(d) => changePageSize(Number(d.value))}
              >
                {PAGE_SIZES.map((size) => (
                  <GoabDropdownItem key={size} value={`${size}`} label={`${size}`} />
                ))}
              </GoabDropdown>
              <span>per page</span>
              <span aria-live="polite">
                {`Showing ${firstShown.toLocaleString()}–${(firstShown + events.length - 1).toLocaleString()} events`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          </div>
        </>
      )}
    </section>
  );
}
