import { GoabButton, GoabCheckbox, GoabDetails } from '@abgov/react-components';
import { CSSProperties, ReactNode, useMemo, useState } from 'react';
import { StoredAuditEvent } from './auditApi';
import { ChangeKind, diffChangeSet } from './changeDiff';
import { Json } from './common';

type FieldValue = string | number | null | undefined;

const SYMBOLS: Record<ChangeKind, string> = { added: '+', removed: '−', changed: '~', unchanged: '=' };
const COLORS: Record<ChangeKind, { bg: string; fg: string }> = {
  added: { bg: '#e6f4ea', fg: '#0b6b2c' },
  removed: { bg: '#fdecea', fg: '#a4262c' },
  changed: { bg: '#fff4ce', fg: '#7a5900' },
  unchanged: { bg: 'transparent', fg: 'inherit' },
};

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))',
  gap: '1.5rem',
  margin: '1rem 0',
};
const cardStyle: CSSProperties = {
  border: '1px solid var(--goa-color-greyscale-200, #dcdcdc)',
  borderRadius: 4,
  padding: '1.5rem',
  minWidth: 0,
  background: '#fff',
};
const fullRow: CSSProperties = { ...cardStyle, gridColumn: '1 / -1' };
const fieldsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(8rem, max-content) 1fr',
  gap: '0.5rem 1.5rem',
  margin: 0,
};
const labelStyle: CSSProperties = { fontWeight: 'bold', color: 'var(--goa-color-text-secondary, #666)' };
const valueStyle: CSSProperties = { margin: 0, wordBreak: 'break-word' };
const monoStyle: CSSProperties = { ...valueStyle, fontFamily: 'monospace' };
const headingStyle: CSSProperties = { margin: '0 0 1rem', fontSize: 'var(--goa-font-size-5, 1.5rem)' };
const cellStyle: CSSProperties = { padding: '0.25rem 0.75rem', verticalAlign: 'top', wordBreak: 'break-word' };

const isPresent = (value: FieldValue) => value !== undefined && value !== null && value !== '';
const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : undefined);
const formatValue = (value: unknown) => (value === undefined ? '' : JSON.stringify(value));

function Field({ label, value, mono }: { label: string; value?: FieldValue; mono?: boolean }) {
  return isPresent(value) ? (
    <>
      <dt style={labelStyle}>{label}</dt>
      <dd style={mono ? monoStyle : valueStyle}>{value}</dd>
    </>
  ) : null;
}

function Section({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section aria-label={title} style={wide ? fullRow : cardStyle}>
      <h2 style={headingStyle}>{title}</h2>
      {children}
    </section>
  );
}

function ChangeSet({ before, after }: { before?: unknown; after?: unknown }) {
  const [mode, setMode] = useState<'diff' | 'json'>('diff');
  const [showUnchanged, setShowUnchanged] = useState(false);
  const entries = useMemo(() => diffChangeSet(before, after), [before, after]);
  const unchanged = entries.filter((e) => e.kind === 'unchanged').length;
  const visible = entries.filter((e) => showUnchanged || e.kind !== 'unchanged');
  const count = (kind: ChangeKind) => entries.filter((e) => e.kind === kind).length;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
        {(['added', 'changed', 'removed'] as ChangeKind[]).map((kind) => (
          <span
            key={kind}
            style={{ padding: '0 0.5rem', borderRadius: 4, background: COLORS[kind].bg, color: COLORS[kind].fg }}
          >
            {SYMBOLS[kind]} {count(kind)} {kind}
          </span>
        ))}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
          <GoabButton size="compact" type={mode === 'diff' ? 'primary' : 'tertiary'} onClick={() => setMode('diff')}>
            Diff
          </GoabButton>
          <GoabButton size="compact" type={mode === 'json' ? 'primary' : 'tertiary'} onClick={() => setMode('json')}>
            JSON
          </GoabButton>
        </div>
      </div>

      {mode === 'json' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <strong>Before</strong>
            <Json value={before ?? null} />
          </div>
          <div>
            <strong>After</strong>
            <Json value={after ?? null} />
          </div>
        </div>
      ) : (
        <>
          {unchanged > 0 && (
            <GoabCheckbox
              name="audit-changeset-unchanged"
              text={`Show ${unchanged} unchanged field${unchanged === 1 ? '' : 's'}`}
              checked={showUnchanged}
              onChange={(e) => setShowUnchanged(e.checked)}
            />
          )}
          {visible.length === 0 ? (
            <p>No field-level changes were recorded.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={cellStyle}>Field</th>
                  <th style={cellStyle}>Before</th>
                  <th style={cellStyle}>After</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry, index) => (
                  <tr key={`${index}:${entry.path}`} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={cellStyle}>
                      <span
                        style={{
                          padding: '0 0.5rem',
                          borderRadius: 4,
                          background: COLORS[entry.kind].bg,
                          color: COLORS[entry.kind].fg,
                        }}
                      >
                        {SYMBOLS[entry.kind]}
                      </span>{' '}
                      {entry.path}
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        background: entry.kind === 'unchanged' ? undefined : COLORS.removed.bg,
                        color: entry.kind === 'unchanged' ? undefined : COLORS.removed.fg,
                      }}
                    >
                      {formatValue(entry.before)}
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        background: entry.kind === 'unchanged' ? undefined : COLORS.added.bg,
                        color: entry.kind === 'unchanged' ? undefined : COLORS.added.fg,
                      }}
                    >
                      {formatValue(entry.after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export function EventDetails({ event }: { event: StoredAuditEvent }) {
  const { actor, resource, changeSet, metadata } = event;
  const roles = [...(actor?.roles ?? [])].sort((a, b) => a.localeCompare(b));
  const hasChangeSet = changeSet?.before !== undefined || changeSet?.after !== undefined;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  return (
    <div style={layoutStyle}>
      <Section title="Event">
        <dl style={fieldsStyle}>
          <Field label="Occurred" value={formatDate(event.occurredAt)} />
          <Field label="Namespace" value={event.namespace} />
          <Field label="Action" value={event.action} />
          <Field label="Category" value={event.category} />
          <Field label="Outcome" value={event.status} />
          <Field label="Severity" value={event.severity} />
        </dl>
      </Section>

      <Section title="Actor">
        <dl style={fieldsStyle}>
          <Field label="Name" value={actor?.name} />
          <Field label="Email" value={actor?.email} />
          <Field label="Type" value={actor?.type} />
          <Field label="ID" value={actor?.id} mono />
        </dl>
        {roles.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <GoabDetails heading={`Roles (${roles.length})`}>
              <ul
                style={{
                  margin: 0,
                  padding: '0.5rem 1rem',
                  maxHeight: '16rem',
                  overflowY: 'auto',
                  listStyle: 'none',
                  background: '#f3f3f3',
                  fontFamily: 'monospace',
                }}
              >
                {roles.map((role) => (
                  <li key={role} style={{ wordBreak: 'break-all' }}>
                    {role}
                  </li>
                ))}
              </ul>
            </GoabDetails>
          </div>
        )}
      </Section>

      {resource && (
        <Section title="Resource">
          <dl style={fieldsStyle}>
            <Field label="Type" value={resource.type} />
            <Field label="Name" value={resource.name} />
            <Field label="ID" value={resource.id} mono />
          </dl>
        </Section>
      )}

      <Section title="Identifiers">
        <dl style={fieldsStyle}>
          <Field label="Event ID" value={event.id} mono />
          <Field label="Correlation ID" value={event.correlationId} mono />
          <Field label="Session ID" value={event.sessionId} mono />
          <Field label="Scope" value={event.scopeIds?.join(', ')} />
        </dl>
      </Section>

      <Section title="Retention">
        <dl style={fieldsStyle}>
          <Field label="Retention class" value={event.retentionClass} />
          <Field label="Retained until" value={formatDate(event.retentionUntil)} />
        </dl>
      </Section>

      {hasChangeSet && (
        <Section title="Changes" wide>
          <ChangeSet before={changeSet?.before} after={changeSet?.after} />
        </Section>
      )}

      {hasMetadata && (
        <Section title="Metadata" wide>
          <Json value={metadata} />
        </Section>
      )}
    </div>
  );
}
