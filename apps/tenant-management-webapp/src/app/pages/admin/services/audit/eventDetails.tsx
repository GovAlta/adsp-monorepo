import React, { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { GoabDetails } from '@abgov/react-components';
import type { AuditEventRecord } from '@store/audit/models';
import { EntryDetail } from '../styled-components';
import { ChangeSetDiff } from './changeSetDiff';

type FieldValue = string | number | null | undefined;

const isPresent = (value: FieldValue) => value !== undefined && value !== null && value !== '';

const Field: FunctionComponent<{ label: string; value?: FieldValue; mono?: boolean }> = ({ label, value, mono }) =>
  isPresent(value) ? (
    <>
      <dt>{label}</dt>
      <dd className={mono ? 'mono' : undefined}>{value}</dd>
    </>
  ) : null;

const Section: FunctionComponent<{ title: string; testId?: string; children: ReactNode }> = ({
  title,
  testId,
  children,
}) => (
  <SectionCard aria-label={title} data-testid={testId}>
    <h2>{title}</h2>
    {children}
  </SectionCard>
);

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : undefined);

export const AuditEventDetails: FunctionComponent<{ event: AuditEventRecord }> = ({ event }) => {
  const { actor, resource, changeSet, metadata } = event;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;
  const hasChangeSet = changeSet?.before !== undefined || changeSet?.after !== undefined;
  const roles = [...(actor?.roles ?? [])].sort((a, b) => a.localeCompare(b));

  return (
    <Layout data-testid="audit-event-details">
      <Section title="Event" testId="audit-event-section-event">
        <Fields>
          <Field label="Occurred" value={formatDate(event.occurredAt)} />
          <Field label="Namespace" value={event.namespace} />
          <Field label="Action" value={event.action} />
          <Field label="Category" value={event.category} />
          <Field label="Outcome" value={event.status} />
          <Field label="Severity" value={event.severity} />
        </Fields>
      </Section>

      <Section title="Actor" testId="audit-event-section-actor">
        <Fields>
          <Field label="Name" value={actor?.name} />
          <Field label="Email" value={actor?.email} />
          <Field label="Type" value={actor?.type} />
          <Field label="ID" value={actor?.id} mono />
        </Fields>
        {roles.length > 0 && (
          <RolesWrapper>
            <GoabDetails heading={`Roles (${roles.length})`} testId="audit-event-actor-roles">
              <RoleList data-testid="audit-event-actor-role-list">
                {roles.map((role) => (
                  <li key={role}>{role}</li>
                ))}
              </RoleList>
            </GoabDetails>
          </RolesWrapper>
        )}
      </Section>

      {resource && (
        <Section title="Resource" testId="audit-event-section-resource">
          <Fields>
            <Field label="Type" value={resource.type} />
            <Field label="Name" value={resource.name} />
            <Field label="ID" value={resource.id} mono />
          </Fields>
        </Section>
      )}

      <Section title="Identifiers" testId="audit-event-section-identifiers">
        <Fields>
          <Field label="Event ID" value={event.id} mono />
          <Field label="Correlation ID" value={event.correlationId} mono />
          <Field label="Session ID" value={event.sessionId} mono />
          <Field label="Scope" value={event.scopeIds?.join(', ')} />
        </Fields>
      </Section>

      <Section title="Retention" testId="audit-event-section-retention">
        <Fields>
          <Field label="Retention class" value={event.retentionClass} />
          <Field label="Retained until" value={formatDate(event.retentionUntil)} />
        </Fields>
      </Section>

      {hasChangeSet && (
        <Section title="Changes" testId="audit-event-section-changes">
          <ChangeSetDiff before={changeSet?.before} after={changeSet?.after} />
        </Section>
      )}

      {hasMetadata && (
        <Section title="Metadata" testId="audit-event-section-metadata">
          <EntryDetail data-testid="audit-event-metadata">{JSON.stringify(metadata, null, 2)}</EntryDetail>
        </Section>
      )}
    </Layout>
  );
};

const Layout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
  gap: var(--goa-space-l);
  margin-top: var(--goa-space-l);

  /* Wide content gets the full row. */
  [data-testid='audit-event-section-changes'],
  [data-testid='audit-event-section-metadata'] {
    grid-column: 1 / -1;
  }
`;

const SectionCard = styled.section`
  background: var(--goa-color-greyscale-white, #fff);
  border: 1px solid var(--goa-color-greyscale-200, #dcdcdc);
  border-radius: var(--goa-border-radius-m, 4px);
  min-width: 0;

  /* Doubled selector outranks global section/heading resets. */
  &&& {
    padding: var(--goa-space-l, 1.5rem);
  }

  h2 {
    margin: 0 0 var(--goa-space-m, 1rem);
    padding: 0;
    font-size: var(--goa-font-size-5, 1.5rem);
    letter-spacing: normal;
  }
`;

const Fields = styled.dl`
  display: grid;
  grid-template-columns: minmax(8rem, max-content) 1fr;
  gap: var(--goa-space-xs) var(--goa-space-l);
  margin: 0;

  dt {
    color: var(--goa-color-text-secondary, #666);
    font-weight: bold;
  }
  dd {
    margin: 0;
    word-break: break-word;
  }
  dd.mono {
    font-family: monospace;
  }
`;

const RolesWrapper = styled.div`
  margin-top: var(--goa-space-m);
`;

const RoleList = styled.ul`
  margin: 0;
  padding: var(--goa-space-s) var(--goa-space-m);
  max-height: 16rem;
  overflow-y: auto;
  list-style: none;
  background: #f3f3f3;
  font-family: monospace;
  font-size: var(--goa-font-size-2);

  li {
    padding: var(--goa-space-3xs) 0;
    word-break: break-all;
  }
`;
