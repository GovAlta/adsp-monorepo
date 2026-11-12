import React, { FunctionComponent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoabButton, GoabIcon, GoabInput } from '@abgov/react-components';
import { RootState } from '@store/index';
import { fetchAuditConfiguration } from '@store/audit/actions';
import { resolveRetentionClass } from '@store/audit/models';
import type { AuditAction } from '@store/audit/models';
import DataTable from '@components/DataTable';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { CatalogCard, EntryDetail } from '../styled-components';

const matchesSearch = (action: AuditAction, term: string) =>
  [action.name, action.category, action.description].some((value) => value?.toLowerCase().includes(term));

const Highlight: FunctionComponent<{ text?: string; term: string }> = ({ text, term }) => {
  if (!text || !term) {
    return <>{text}</>;
  }
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let from = 0;
  for (let at = lower.indexOf(term); at !== -1; at = lower.indexOf(term, from)) {
    parts.push(text.slice(from, at), <mark key={at}>{text.slice(at, at + term.length)}</mark>);
    from = at + term.length;
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
};

const ActionRow: FunctionComponent<{ action: AuditAction; term: string }> = ({ action, term }) => {
  const [showDetails, setShowDetails] = useState(false);
  const toggle = () => setShowDetails(!showDetails);
  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <>
      <tr
        className="action-row"
        role="button"
        tabIndex={0}
        aria-expanded={showDetails}
        data-testid="audit-action-row"
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <td>
          <div data-testid="audit-action-name">
            <Highlight text={action.name} term={term} />
          </div>
          {term && action.description?.toLowerCase().includes(term) && (
            <div className="match-description" data-testid="audit-action-description-match">
              <Highlight text={action.description} term={term} />
            </div>
          )}
        </td>
        <td>
          <Highlight text={action.category} term={term} />
        </td>
        <td>
          {action.severity && (
            <span className={`severity severity-${action.severity}`} data-testid="audit-action-severity">
              {action.severity}
            </span>
          )}
        </td>
        <td>{resolveRetentionClass(action)}</td>
        <td>{[action.forwardToSiem && 'SIEM', action.captureChangeSet && 'Change set'].filter(Boolean).join(', ')}</td>
      </tr>
      {showDetails && (
        <tr>
          <td className="details-cell" colSpan={5}>
            <EntryDetail data-testid="audit-action-details">
              {JSON.stringify(
                {
                  version: action.version,
                  description: action.description,
                  resourceType: action.resourceType,
                  metadataSchema: action.metadataSchema,
                },
                null,
                2,
              )}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};

export const AuditCatalogs: FunctionComponent = () => {
  const dispatch = useDispatch();
  const indicator = useSelector((state: RootState) => state.session?.indicator);
  const catalogs = useSelector((state: RootState) => state.audit.catalogs);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchAuditConfiguration());
  }, [dispatch]);

  const term = search.trim().toLowerCase();
  const groups = useMemo(
    () =>
      catalogs
        .map((catalog) => ({
          catalog,
          actions: catalog.actions.filter((action) => !term || matchesSearch(action, term)),
        }))
        .filter(({ actions }) => actions.length > 0),
    [catalogs, term],
  );

  const total = catalogs.reduce((count, { actions }) => count + actions.length, 0);
  const shown = groups.reduce((count, { actions }) => count + actions.length, 0);

  const toggleGroup = (application: string) => {
    const next = new Set(expanded);
    if (!next.delete(application)) {
      next.add(application);
    }
    setExpanded(next);
  };

  if (indicator?.show) {
    return <PageIndicator />;
  }
  if (catalogs.length === 0) {
    return renderNoItem('audit catalog');
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--goa-space-s)',
          marginBottom: 'var(--goa-space-s)',
        }}
      >
        <GoabInput
          name="audit-catalog-search"
          testId="audit-catalog-search"
          leadingIcon="search"
          placeholder="Search actions"
          width="360px"
          value={search}
          trailingIcon={search ? 'close' : undefined}
          trailingIconAriaLabel="Clear search"
          onTrailingIconClick={() => setSearch('')}
          onChange={(d) => setSearch(d.value)}
        />
        <div style={{ display: 'flex', gap: 'var(--goa-space-xs)' }}>
          <GoabButton
            type="tertiary"
            size="compact"
            testId="audit-catalog-expand-all"
            onClick={() => setExpanded(new Set(catalogs.map(({ application }) => application)))}
          >
            Expand all
          </GoabButton>
          <GoabButton
            type="tertiary"
            size="compact"
            testId="audit-catalog-collapse-all"
            onClick={() => setExpanded(new Set())}
          >
            Collapse all
          </GoabButton>
        </div>
      </div>
      {term && (
        <div data-testid="audit-catalog-count" style={{ marginBottom: 'var(--goa-space-s)' }}>
          {shown} of {total} actions
        </div>
      )}
      {groups.length === 0 && <div data-testid="audit-catalog-no-match">No actions match your search.</div>}
      {groups.map(({ catalog, actions }) => {
        const open = !!term || expanded.has(catalog.application);
        return (
          <CatalogCard key={catalog.application}>
            <button
              type="button"
              className="card-header"
              aria-expanded={open}
              data-testid={`audit-catalog-toggle-${catalog.application}`}
              onClick={() => toggleGroup(catalog.application)}
            >
              <GoabIcon type={open ? 'chevron-down' : 'chevron-forward'} />
              {catalog.application}
              {catalog.isCore ? ' (core)' : ''} · {actions.length}
            </button>
            {open && (
              <div className="card-body">
                <DataTable data-testid={`audit-catalog-${catalog.application}`}>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Retention class</th>
                      <th>Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((action) => (
                      <ActionRow key={action.name} action={action} term={term} />
                    ))}
                  </tbody>
                </DataTable>
              </div>
            )}
          </CatalogCard>
        );
      })}
    </section>
  );
};
