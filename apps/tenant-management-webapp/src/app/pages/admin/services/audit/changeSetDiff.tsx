import React, { FunctionComponent, useMemo, useState } from 'react';
import styled from 'styled-components';
import { GoabButton, GoabCheckbox } from '@abgov/react-components';
import { ChangeEntry, ChangeKind, diffChangeSet } from './changeDiff';
import { EntryDetail } from '../styled-components';

const SYMBOLS: Record<ChangeKind, string> = { added: '+', removed: '−', changed: '~', unchanged: '' };
const LABELS: Record<ChangeKind, string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
  unchanged: 'Unchanged',
};

const format = (value: unknown) => (value === undefined ? '' : JSON.stringify(value));

export const ChangeSetDiff: FunctionComponent<{ before?: unknown; after?: unknown }> = ({ before, after }) => {
  const [mode, setMode] = useState<'diff' | 'json'>('diff');
  const [showUnchanged, setShowUnchanged] = useState(false);
  const entries = useMemo(() => diffChangeSet(before, after), [before, after]);

  const count = (kind: ChangeKind) => entries.filter((e) => e.kind === kind).length;
  const visible = entries.filter((e) => showUnchanged || e.kind !== 'unchanged');

  return (
    <section aria-label="Change set" data-testid="audit-event-changeset">
      <Header>
        <strong>Change set</strong>
        <Summary data-testid="audit-changeset-summary">
          {(['added', 'changed', 'removed'] as ChangeKind[]).map((kind) => (
            <Badge key={kind} $kind={kind}>
              {SYMBOLS[kind]} {count(kind)} {LABELS[kind].toLowerCase()}
            </Badge>
          ))}
        </Summary>
        <Modes>
          <GoabButton
            size="compact"
            type={mode === 'diff' ? 'primary' : 'tertiary'}
            onClick={() => setMode('diff')}
            testId="audit-changeset-mode-diff"
          >
            Diff
          </GoabButton>
          <GoabButton
            size="compact"
            type={mode === 'json' ? 'primary' : 'tertiary'}
            onClick={() => setMode('json')}
            testId="audit-changeset-mode-json"
          >
            JSON
          </GoabButton>
        </Modes>
      </Header>

      {mode === 'json' ? (
        <JsonColumns>
          <div>
            <strong>Before</strong>
            <EntryDetail data-testid="audit-event-changeset-before">{JSON.stringify(before ?? null, null, 2)}</EntryDetail>
          </div>
          <div>
            <strong>After</strong>
            <EntryDetail data-testid="audit-event-changeset-after">{JSON.stringify(after ?? null, null, 2)}</EntryDetail>
          </div>
        </JsonColumns>
      ) : (
        <>
          {count('unchanged') > 0 && (
            <GoabCheckbox
              name="audit-changeset-unchanged"
              text={`Show ${count('unchanged')} unchanged field${count('unchanged') === 1 ? '' : 's'}`}
              checked={showUnchanged}
              onChange={(e) => setShowUnchanged(e.checked)}
              testId="audit-changeset-unchanged"
            />
          )}
          {visible.length === 0 ? (
            <p data-testid="audit-changeset-empty">No field-level changes were recorded.</p>
          ) : (
            <DiffTable data-testid="audit-changeset-diff">
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Before</th>
                  <th scope="col">After</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry: ChangeEntry, index) => (
                  <tr key={`${index}:${entry.path}`} data-kind={entry.kind}>
                    <th scope="row">
                      <Badge $kind={entry.kind} aria-label={LABELS[entry.kind]}>
                        {SYMBOLS[entry.kind] || '='}
                      </Badge>{' '}
                      {entry.path}
                    </th>
                    <Cell $kind={entry.kind === 'unchanged' ? 'unchanged' : 'removed'}>{format(entry.before)}</Cell>
                    <Cell $kind={entry.kind === 'unchanged' ? 'unchanged' : 'added'}>{format(entry.after)}</Cell>
                  </tr>
                ))}
              </tbody>
            </DiffTable>
          )}
        </>
      )}
    </section>
  );
};

const COLORS: Record<ChangeKind, { bg: string; fg: string }> = {
  added: { bg: '#e6f4ea', fg: '#0b6b2c' },
  removed: { bg: '#fdecea', fg: '#a4262c' },
  changed: { bg: '#fff4ce', fg: '#7a5900' },
  unchanged: { bg: 'transparent', fg: 'inherit' },
};

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--goa-space-m);
  margin: var(--goa-space-m) 0 var(--goa-space-s);
`;

const Summary = styled.div`
  display: flex;
  gap: var(--goa-space-xs);
`;

const Modes = styled.div`
  display: flex;
  gap: var(--goa-space-2xs);
  margin-left: auto;
`;

const Badge = styled.span<{ $kind: ChangeKind }>`
  display: inline-block;
  min-width: 1.5em;
  padding: 0 var(--goa-space-xs);
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  background: ${({ $kind }) => COLORS[$kind].bg};
  color: ${({ $kind }) => COLORS[$kind].fg};
`;

const JsonColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--goa-space-m);
`;

const DiffTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: monospace;
  font-size: var(--goa-font-size-2);

  th,
  td {
    padding: var(--goa-space-2xs) var(--goa-space-s);
    text-align: left;
    vertical-align: top;
    word-break: break-word;
    border-bottom: 1px solid #ddd;
  }
  thead th {
    font-family: inherit;
  }
  tbody th {
    font-weight: normal;
    width: 30%;
  }
`;

const Cell = styled.td<{ $kind: ChangeKind }>`
  width: 35%;
  background: ${({ $kind }) => COLORS[$kind].bg};
  color: ${({ $kind }) => COLORS[$kind].fg};
`;
