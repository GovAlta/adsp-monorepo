import {
  GoabBadge,
  GoabBlock,
  GoabButton,
  GoabDatePicker,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabModal,
  GoabSpinner,
  GoabTable,
} from '@abgov/react-components';
import { useState } from 'react';
import { EventQuery, EventStatus, StoredAuditEvent, getEvent, getEvents } from './auditApi';
import { errorMessage } from './util';
import { Card, ErrorCallout, FormGrid, Json, STATUS_BADGE } from './common';

const PAGE_SIZE = 25;
const STATUSES: EventStatus[] = ['success', 'failure', 'blocked', 'error'];

function toDate(value: unknown, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const date = new Date(value as string);
  if (isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export function AuditEvents() {
  const [namespace, setNamespace] = useState('');
  const [filters, setFilters] = useState<EventQuery>({});
  const [events, setEvents] = useState<StoredAuditEvent[]>();
  const [next, setNext] = useState<string>();
  const [selected, setSelected] = useState<StoredAuditEvent>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const setFilter = (key: keyof EventQuery, value?: string) =>
    setFilters((current) => ({ ...current, [key]: value || undefined }));

  const search = async (after?: string) => {
    try {
      setLoading(true);
      setError(undefined);
      const { results, page } = await getEvents({ ...filters, top: PAGE_SIZE, after }, namespace || undefined);
      setEvents(after ? [...(events ?? []), ...results] : results);
      setNext(page.next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const open = async (event: StoredAuditEvent) => {
    try {
      setSelected(await getEvent(event.namespace, event.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const reset = () => {
    setNamespace('');
    setFilters({});
    setEvents(undefined);
    setNext(undefined);
  };

  return (
    <>
      <Card title="Search audit events">
        <FormGrid>
          <GoabFormItem label="Namespace">
            <GoabInput
              name="namespace"
              width="100%"
              value={namespace}
              placeholder="All namespaces"
              onChange={(e) => setNamespace(e.value)}
            />
          </GoabFormItem>
          <GoabFormItem label="Action">
            <GoabInput name="action" width="100%" value={filters.action ?? ''} onChange={(e) => setFilter('action', e.value)} />
          </GoabFormItem>
          <GoabFormItem label="Actor id">
            <GoabInput name="actor" width="100%" value={filters.actor ?? ''} onChange={(e) => setFilter('actor', e.value)} />
          </GoabFormItem>
          <GoabFormItem label="Status">
            <GoabDropdown
              name="status"
              width="100%"
              value={filters.status}
              onChange={(e) => setFilter('status', e.value as string)}
            >
              <GoabDropdownItem value="" label="Any" />
              {STATUSES.map((status) => (
                <GoabDropdownItem key={status} value={status} label={status} />
              ))}
            </GoabDropdown>
          </GoabFormItem>
          <GoabFormItem label="Resource type">
            <GoabInput
              name="resourceType"
              width="100%"
              value={filters.resourceType ?? ''}
              onChange={(e) => setFilter('resourceType', e.value)}
            />
          </GoabFormItem>
          <GoabFormItem label="Resource id">
            <GoabInput
              name="resourceId"
              width="100%"
              value={filters.resourceId ?? ''}
              onChange={(e) => setFilter('resourceId', e.value)}
            />
          </GoabFormItem>
          <GoabFormItem label="From">
            <GoabDatePicker name="from" onChange={(e) => setFilter('occurredFrom', toDate(e.value))} />
          </GoabFormItem>
          <GoabFormItem label="To">
            <GoabDatePicker name="to" onChange={(e) => setFilter('occurredTo', toDate(e.value, true))} />
          </GoabFormItem>
        </FormGrid>
        <GoabBlock gap="m" mt="xl">
          <GoabButton type="primary" leadingIcon="search" onClick={() => search()}>
            Search
          </GoabButton>
          <GoabButton type="tertiary" onClick={reset}>
            Reset
          </GoabButton>
        </GoabBlock>
      </Card>

      <ErrorCallout message={error} />
      {loading && <GoabSpinner type="infinite" size="large" />}

      {events && (
        <GoabTable width="100%" mt="l">
          <thead>
            <tr>
              <th>Occurred</th>
              <th>Namespace</th>
              <th>Action</th>
              <th>Status</th>
              <th>Actor</th>
              <th>Resource</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.occurredAt).toLocaleString()}</td>
                <td>{event.namespace}</td>
                <td>{event.action}</td>
                <td>
                  <GoabBadge type={STATUS_BADGE[event.status]} content={event.status} icon={false} />
                </td>
                <td>{event.actor.name ?? event.actor.id}</td>
                <td>{event.resource ? `${event.resource.type}/${event.resource.id}` : ''}</td>
                <td>
                  <GoabButton type="tertiary" size="compact" onClick={() => open(event)}>
                    Details
                  </GoabButton>
                </td>
              </tr>
            ))}
            {!events.length && (
              <tr>
                <td colSpan={7}>No events match the search.</td>
              </tr>
            )}
          </tbody>
        </GoabTable>
      )}
      {next && (
        <GoabBlock mt="m">
          <GoabButton type="secondary" onClick={() => search(next)}>
            Load more
          </GoabButton>
        </GoabBlock>
      )}

      <GoabModal
        open={!!selected}
        heading={selected ? `${selected.action} (${selected.status})` : ''}
        maxWidth="60rem"
        onClose={() => setSelected(undefined)}
      >
        {selected && <Json value={selected} />}
      </GoabModal>
    </>
  );
}
