import React, { FunctionComponent, ReactNode } from 'react';
import { GoabBadge } from '@abgov/react-components';
import type { GoabBadgeType } from '@abgov/ui-components-common';
import type { ToolCall } from '@core-services/app-common';
import styled from 'styled-components';
import { AccessDiscoveryStatus, AccessEnvironmentSummary, AccessRealmKind } from '@store/agent/model';

interface AccessRealm {
  realm: string;
  name: string;
  kind: AccessRealmKind;
  status?: string;
  issuer?: string;
  endpoints?: Record<string, string | undefined>;
}

interface AccessToolResult {
  status: AccessDiscoveryStatus;
  reason?: string;
  message?: string;
  missingRoles?: string[];
  environment?: AccessEnvironmentSummary;
  environments?: Array<AccessEnvironmentSummary & { current: boolean; inspectable: boolean }>;
  realms?: AccessRealm[];
  realm?: AccessRealm;
}

type CardStatus = 'pending' | 'complete' | 'notice' | 'error';

const TOOL_HEADINGS: Record<string, { pending: string; done: string }> = {
  listAccessEnvironments: { pending: 'Checking environments…', done: 'Access Service environments' },
  listAccessRealms: { pending: 'Checking realms…', done: 'Realms you can inspect' },
  getAccessRealmInfo: { pending: 'Checking realm details…', done: 'Realm details' },
};

const NOTICE_BADGES: Record<string, { type: GoabBadgeType; content: string }> = {
  unavailable: { type: 'important', content: 'Not available' },
  'not-found': { type: 'important', content: 'Not found' },
  unreachable: { type: 'important', content: 'No response' },
};

const REALM_KIND_LABELS: Record<AccessRealmKind, string> = { tenant: 'Tenant', core: 'Core' };

const ENDPOINT_LABELS: Array<[string, string]> = [
  ['authorization', 'Authorization'],
  ['token', 'Token'],
  ['userInfo', 'User info'],
  ['endSession', 'End session'],
  ['jwks', 'JWKS'],
];

const MAX_ERROR_CHARS = 1024;

export function isAccessDiscoveryTool(toolName?: string): boolean {
  return Boolean(toolName && Object.prototype.hasOwnProperty.call(TOOL_HEADINGS, toolName));
}

/**
 * Renders the Access Service discovery tools as status cards; returns null for any other tool so the chat
 * shows its default tool card instead.
 */
export function renderAccessToolCall(toolCall: ToolCall): ReactNode {
  return isAccessDiscoveryTool(toolCall.toolName) ? <AccessToolCall toolCall={toolCall} /> : null;
}

function getCardStatus(toolCall: ToolCall, result?: AccessToolResult): CardStatus {
  if (toolCall.error != null) {
    return 'error';
  }
  if (!result) {
    return 'pending';
  }
  return result.status === 'available' ? 'complete' : 'notice';
}

function toErrorText(error: unknown): string {
  const text = typeof error === 'string' ? error : JSON.stringify(error);
  return text.length > MAX_ERROR_CHARS ? `${text.slice(0, MAX_ERROR_CHARS)}… truncated` : text;
}

const StatusBadge: FunctionComponent<{ status: CardStatus; result?: AccessToolResult }> = ({ status, result }) => {
  switch (status) {
    case 'complete':
      return <GoabBadge type="information" content="Read-only" icon={false} />;
    case 'notice': {
      const badge = NOTICE_BADGES[result?.status] ?? NOTICE_BADGES.unavailable;
      return <GoabBadge type={badge.type} content={badge.content} icon={false} />;
    }
    case 'error':
      return <GoabBadge type="emergency" content="Failed" icon={false} />;
    default:
      return null;
  }
};

const EnvironmentsTable: FunctionComponent<{ environments: AccessToolResult['environments'] }> = ({ environments }) => (
  <table data-testid="access-environments-table">
    <thead>
      <tr>
        <th>Environment</th>
        <th>Keycloak host</th>
        <th>This session</th>
        <th>Access</th>
      </tr>
    </thead>
    <tbody>
      {environments.map((environment) => (
        <tr key={environment.id} data-inspectable={environment.inspectable}>
          <td>{environment.label}</td>
          <td>
            <code>{environment.host}</code>
          </td>
          <td>{environment.inspectable ? 'Can inspect' : 'Not from this session'}</td>
          <td>{environment.readOnly ? 'Read-only' : 'Read and write'}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const RealmList: FunctionComponent<{ realms: AccessRealm[] }> = ({ realms }) => (
  <ul data-testid="access-realms-list">
    {realms.map((realm) => (
      <li key={realm.realm}>
        <strong>{realm.name}</strong> — <code>{realm.realm}</code> ({REALM_KIND_LABELS[realm.kind] ?? realm.kind}
        {realm.status ? `, ${realm.status}` : ''})
      </li>
    ))}
  </ul>
);

const RealmDetails: FunctionComponent<{ realm: AccessRealm; environment?: AccessEnvironmentSummary }> = ({
  realm,
  environment,
}) => (
  <dl data-testid="access-realm-details">
    {environment && (
      <>
        <dt>Environment</dt>
        <dd>{environment.label}</dd>
      </>
    )}
    <dt>Realm ID</dt>
    <dd>
      <code>{realm.realm}</code>
    </dd>
    <dt>Name</dt>
    <dd>{realm.name}</dd>
    <dt>Type</dt>
    <dd>{REALM_KIND_LABELS[realm.kind] ?? realm.kind}</dd>
    {realm.issuer && (
      <>
        <dt>Issuer</dt>
        <dd>
          <code>{realm.issuer}</code>
        </dd>
      </>
    )}
    {ENDPOINT_LABELS.filter(([key]) => realm.endpoints?.[key]).map(([key, label]) => (
      <React.Fragment key={key}>
        <dt>{label} endpoint</dt>
        <dd>
          <code>{realm.endpoints[key]}</code>
        </dd>
      </React.Fragment>
    ))}
  </dl>
);

export const AccessToolCall: FunctionComponent<{ toolCall: ToolCall }> = ({ toolCall }) => {
  if (!isAccessDiscoveryTool(toolCall.toolName)) {
    return null;
  }

  const result = toolCall.result as AccessToolResult | undefined;
  const status = getCardStatus(toolCall, result);
  const headings = TOOL_HEADINGS[toolCall.toolName];

  return (
    <ToolCard data-status={status} data-testid={`access-tool-${toolCall.toolName}`}>
      <CardHeader>
        <strong>{status === 'pending' ? headings.pending : headings.done}</strong>
        <StatusBadge status={status} result={result} />
      </CardHeader>
      {status === 'error' && (
        <>
          <p>The check could not be completed.</p>
          <pre>{toErrorText(toolCall.error)}</pre>
        </>
      )}
      {status === 'notice' && (
        <>
          <p>{result.message}</p>
          {result.missingRoles && result.missingRoles.length > 0 && (
            <p>
              Missing role: <code>{result.missingRoles.join(', ')}</code>
            </p>
          )}
        </>
      )}
      {(status === 'complete' || status === 'notice') && result.environments?.length > 0 && (
        <EnvironmentsTable environments={result.environments} />
      )}
      {status === 'complete' && result.realms?.length > 0 && <RealmList realms={result.realms} />}
      {status === 'complete' && result.realm && <RealmDetails realm={result.realm} environment={result.environment} />}
    </ToolCard>
  );
};

const ToolCard = styled.div`
  margin: 0 var(--goa-space-xl) var(--goa-space-m) var(--goa-space-xl);
  padding: var(--goa-space-s) var(--goa-space-m);
  border-left: 3px solid var(--goa-color-greyscale-400);
  background-color: var(--goa-color-greyscale-100);
  font-size: var(--goa-font-size-2);

  &[data-status='complete'] {
    border-left-color: var(--goa-color-success-default);
  }

  &[data-status='notice'] {
    border-left-color: var(--goa-color-warning-default);
  }

  &[data-status='error'] {
    border-left-color: var(--goa-color-emergency-default);
  }

  &[data-status='pending'] {
    color: var(--goa-color-text-secondary);
  }

  & p {
    margin: var(--goa-space-xs) 0;
  }

  & table {
    width: 100%;
    border-collapse: collapse;
    margin-top: var(--goa-space-xs);
  }

  & th,
  & td {
    text-align: left;
    padding: var(--goa-space-2xs) var(--goa-space-xs);
    border-bottom: 1px solid var(--goa-color-greyscale-200);
  }

  & tr[data-inspectable='true'] td {
    font-weight: 600;
  }

  & ul {
    margin: var(--goa-space-xs) 0 0 0;
    padding-left: var(--goa-space-l);
  }

  & dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--goa-space-2xs) var(--goa-space-m);
    margin: var(--goa-space-xs) 0 0 0;
  }

  & dt {
    font-weight: 600;
  }

  & dd {
    margin: 0;
    word-break: break-all;
  }

  & code {
    font-size: var(--goa-font-size-1);
  }

  & pre {
    white-space: pre-wrap;
    font-size: var(--goa-font-size-1);
    max-height: 200px;
    overflow: auto;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
`;
