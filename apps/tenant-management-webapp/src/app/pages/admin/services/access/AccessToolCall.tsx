import React, { FunctionComponent, ReactNode } from 'react';
import { GoabBadge } from '@abgov/react-components';
import type { GoabBadgeType } from '@abgov/ui-components-common';
import type { ToolCall } from '@core-services/app-common';
import styled from 'styled-components';
import {
  AccessClientDetails,
  AccessClientFinding,
  AccessClientSetupValues,
  AccessClientSummary,
  AccessClientUrlCheck,
  AccessComparedPerson,
  AccessDiscoveryStatus,
  AccessEnvironmentSummary,
  AccessRealmKind,
  AccessRoleDetails,
  AccessRoleMember,
  AccessServiceAccount,
  AccessServiceCheck,
  AccessServiceRolesEntry,
  AccessSignInStatus,
  AccessTokenPreview,
  AccessUser,
  AccessUserComparison,
  AccessUserRoles,
} from '@store/agent/model';
import { ComparedPeopleSuggestions, ServiceChecks, UserComparison } from './AccessCheckResults';
import { ACCESS_GUIDE_TOOL, AccessGuideToolCall } from './AccessGuideToolCall';
import {
  ClientFindings,
  ClientSetupValues,
  ClientUrlCheck,
  ServiceAccountDetails,
  TokenPreview,
} from './AccessClientCheckResults';
import { ClientDetails, ClientList, ClientSuggestions } from './AccessClientResults';
import { RoleDetails, RoleMembers, ServiceRoleCatalog } from './AccessRoleResults';
import { SignInStatus, UserIdentity, UserRoles, UserSuggestions } from './AccessUserResults';

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
  clients?: AccessClientSummary[];
  truncated?: boolean;
  suggestions?: string[];
  client?: AccessClientDetails | AccessClientSummary;
  user?: AccessUser;
  roles?: AccessUserRoles;
  signIn?: AccessSignInStatus;
  services?: AccessServiceCheck[] | AccessServiceRolesEntry[];
  notes?: string[];
  first?: AccessComparedPerson;
  second?: AccessComparedPerson;
  comparison?: AccessUserComparison;
  role?: AccessRoleDetails;
  members?: AccessRoleMember[];
  counts?: { direct: number; group: number; composite: number };
  findings?: AccessClientFinding[];
  setup?: AccessClientSetupValues;
  secretCreatedAt?: string;
  check?: AccessClientUrlCheck;
  preview?: AccessTokenPreview;
  serviceAccount?: AccessServiceAccount;
}

type CardStatus = 'pending' | 'complete' | 'notice' | 'error';

const TOOL_HEADINGS: Record<string, { pending: string; done: string }> = {
  listAccessEnvironments: { pending: 'Checking environments…', done: 'Access Service environments' },
  listAccessRealms: { pending: 'Checking realms…', done: 'Realms you can inspect' },
  getAccessRealmInfo: { pending: 'Checking realm details…', done: 'Realm details' },
  listAccessClients: { pending: 'Checking clients…', done: 'Clients in your realm' },
  getAccessClient: { pending: 'Checking client configuration…', done: 'Client configuration' },
  checkAccessClientSetup: { pending: 'Checking app setup…', done: 'App setup check' },
  checkAccessClientUrl: { pending: 'Checking app address…', done: 'App address check' },
  previewAccessToken: { pending: 'Previewing token…', done: 'Token preview' },
  getAccessServiceAccount: { pending: 'Checking service account…', done: 'Service account' },
  findAccessUser: { pending: 'Looking up user…', done: 'User' },
  getAccessUserRoles: { pending: 'Checking role assignments…', done: 'User role assignments' },
  getAccessUserSignInStatus: { pending: 'Checking sign-in…', done: 'Sign-in status' },
  checkAccessUserForService: { pending: 'Checking access to the service…', done: 'Access to a service' },
  compareAccessUsers: { pending: 'Comparing access…', done: 'Access compared' },
  listAccessServiceRoles: { pending: 'Checking service roles…', done: 'Service roles' },
  getAccessRole: { pending: 'Checking role…', done: 'Role explained' },
  listAccessRoleMembers: { pending: 'Checking who has the role…', done: 'Who has the role' },
};

const USER_TOOLS = new Set([
  'findAccessUser',
  'getAccessUserRoles',
  'getAccessUserSignInStatus',
  'checkAccessUserForService',
]);
const ROLE_TOOLS = new Set(['getAccessRole', 'listAccessRoleMembers']);

// Tools whose summary line adds to the card; the original discovery and client cards already say it all.
const SUMMARY_TOOLS = new Set([
  ...USER_TOOLS,
  ...ROLE_TOOLS,
  'compareAccessUsers',
  'listAccessServiceRoles',
  'checkAccessClientSetup',
  'checkAccessClientUrl',
  'previewAccessToken',
  'getAccessServiceAccount',
]);

const AMBIGUOUS_REASONS = new Set(['USER_AMBIGUOUS', 'ROLE_AMBIGUOUS']);

const NOTICE_BADGES: Record<string, { type: GoabBadgeType; content: string }> = {
  unavailable: { type: 'important', content: 'Not available' },
  'not-found': { type: 'important', content: 'Not found' },
  unreachable: { type: 'important', content: 'No response' },
  ambiguous: { type: 'information', content: 'Several matches' },
};

const REALM_KIND_LABELS: Record<AccessRealmKind, string> = { tenant: 'Tenant', core: 'Core' };

const ENDPOINT_LABELS: Array<[string, string]> = [
  ['openIdConfiguration', 'OpenID configuration'],
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
 * Renders the Access Service discovery tools as status cards and the guide tool as a single line; returns null for
 * any other tool so the chat shows its default tool card instead.
 */
export function renderAccessToolCall(toolCall: ToolCall): ReactNode {
  if (toolCall.toolName === ACCESS_GUIDE_TOOL) {
    return <AccessGuideToolCall toolCall={toolCall} />;
  }
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
      const key = AMBIGUOUS_REASONS.has(result?.reason) ? 'ambiguous' : result?.status;
      const badge = NOTICE_BADGES[key] ?? NOTICE_BADGES.unavailable;
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

const AvailableResult: FunctionComponent<{ toolName: string; result: AccessToolResult }> = ({ toolName, result }) => {
  switch (toolName) {
    case 'listAccessRealms':
      return result.realms?.length > 0 ? <RealmList realms={result.realms} /> : null;
    case 'getAccessRealmInfo':
      return result.realm ? <RealmDetails realm={result.realm} environment={result.environment} /> : null;
    case 'listAccessClients':
      return <ClientList clients={result.clients ?? []} truncated={result.truncated} message={result.message} />;
    case 'getAccessClient':
      return result.client ? <ClientDetails client={result.client} /> : null;
    case 'findAccessUser':
      return result.user ? <UserIdentity user={result.user} /> : null;
    case 'getAccessUserRoles':
      return result.user && result.roles ? (
        <>
          <UserIdentity user={result.user} />
          <UserRoles roles={result.roles} />
        </>
      ) : null;
    case 'getAccessUserSignInStatus':
      return result.signIn ? <SignInStatus signIn={result.signIn} /> : null;
    case 'checkAccessUserForService':
      return result.services ? <ServiceChecks services={result.services as AccessServiceCheck[]} /> : null;
    case 'compareAccessUsers':
      return result.comparison ? (
        <UserComparison first={result.first} second={result.second} comparison={result.comparison} />
      ) : null;
    case 'listAccessServiceRoles':
      return <ServiceRoleCatalog services={(result.services as AccessServiceRolesEntry[]) ?? []} />;
    case 'getAccessRole':
      return result.role ? <RoleDetails role={result.role} /> : null;
    case 'listAccessRoleMembers':
      return <RoleMembers members={result.members ?? []} counts={result.counts} truncated={result.truncated} />;
    case 'checkAccessClientSetup':
      return (
        <>
          <ClientFindings findings={result.findings ?? []} />
          {result.setup && <ClientSetupValues setup={result.setup} secretCreatedAt={result.secretCreatedAt} />}
        </>
      );
    case 'checkAccessClientUrl':
      return result.check ? <ClientUrlCheck check={result.check} /> : null;
    case 'previewAccessToken':
      return result.preview ? <TokenPreview preview={result.preview} /> : null;
    case 'getAccessServiceAccount':
      return result.serviceAccount ? (
        <>
          <ServiceAccountDetails serviceAccount={result.serviceAccount} />
          {result.services && <ServiceChecks services={result.services as AccessServiceCheck[]} />}
          {result.roles && <UserRoles roles={result.roles} />}
          {result.setup && <ClientSetupValues setup={result.setup} />}
        </>
      ) : null;
    default:
      return null;
  }
};

const NoticeSuggestions: FunctionComponent<{ toolName: string; result: AccessToolResult }> = ({ toolName, result }) => {
  const ambiguous = AMBIGUOUS_REASONS.has(result.reason);
  if (toolName === 'compareAccessUsers') {
    return <ComparedPeopleSuggestions people={[result.first, result.second].filter(Boolean)} />;
  }
  if (USER_TOOLS.has(toolName) || (toolName === 'previewAccessToken' && result.reason?.startsWith('USER_'))) {
    return <UserSuggestions suggestions={result.suggestions} ambiguous={ambiguous} />;
  }
  if (ROLE_TOOLS.has(toolName)) {
    return result.suggestions?.length > 0 ? (
      <div data-testid="access-role-suggestions">
        <p>{ambiguous ? 'Roles with that name (choose one):' : 'Roles with similar names:'}</p>
        <ul>
          {result.suggestions.map((suggestion) => (
            <li key={suggestion}>
              <code>{suggestion}</code>
            </li>
          ))}
        </ul>
      </div>
    ) : null;
  }
  return <ClientSuggestions suggestions={result.suggestions} />;
};

const Notes: FunctionComponent<{ notes?: string[] }> = ({ notes }) =>
  notes?.length > 0 ? (
    <ul data-testid="access-tool-notes">
      {notes.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  ) : null;

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
          <NoticeSuggestions toolName={toolCall.toolName} result={result} />
          <Notes notes={result.notes} />
        </>
      )}
      {(status === 'complete' || status === 'notice') && result.environments?.length > 0 && (
        <EnvironmentsTable environments={result.environments} />
      )}
      {status === 'complete' && SUMMARY_TOOLS.has(toolCall.toolName) && (
        <p data-testid="access-tool-summary">{result.message}</p>
      )}
      {status === 'complete' && <AvailableResult toolName={toolCall.toolName} result={result} />}
      {status === 'complete' && <Notes notes={result.notes} />}
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

  & tr[data-has='false'] td,
  & dd[data-allowed='false'],
  & li[data-severity='problem'] {
    color: var(--goa-color-emergency-default);
  }

  & li[data-severity='warning'] {
    color: var(--goa-color-warning-dark, var(--goa-color-text-default));
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

  & h4 {
    margin: var(--goa-space-s) 0 0 0;
    font-size: var(--goa-font-size-2);
  }

  & details {
    margin-top: var(--goa-space-s);
  }

  & summary {
    cursor: pointer;
    font-weight: 600;
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
