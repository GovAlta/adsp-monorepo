import React, { FunctionComponent } from 'react';
import type { AuditEventRecord } from '@store/audit/models';
import { EntryDetail } from '../styled-components';

const Field: FunctionComponent<{ label: string; value?: string | number | null }> = ({ label, value }) =>
  value === undefined || value === null || value === '' ? null : (
    <div>
      <strong>{label}:</strong> {value}
    </div>
  );

const Block: FunctionComponent<{ label: string; value: unknown; testId: string }> = ({ label, value, testId }) =>
  value === undefined || value === null ? null : (
    <div>
      <strong>{label}</strong>
      <EntryDetail data-testid={testId}>{JSON.stringify(value, null, 2)}</EntryDetail>
    </div>
  );

export const AuditEventDetails: FunctionComponent<{ event: AuditEventRecord }> = ({ event }) => {
  const { actor, resource, changeSet, metadata } = event;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;
  return (
    <div data-testid="audit-event-details">
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
      <Block label="Change set: before" value={changeSet?.before} testId="audit-event-changeset-before" />
      <Block label="Change set: after" value={changeSet?.after} testId="audit-event-changeset-after" />
      {hasMetadata && <Block label="Metadata" value={metadata} testId="audit-event-metadata" />}
    </div>
  );
};
