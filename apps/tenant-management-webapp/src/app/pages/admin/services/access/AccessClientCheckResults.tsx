import React, { FunctionComponent } from 'react';
import type {
  AccessClientFinding,
  AccessClientSetupValues,
  AccessClientUrlCheck,
  AccessServiceAccount,
  AccessTokenPreview,
  AccessUrlMatch,
} from '@store/agent/model';
import { formatTime, ListOrNone } from './AccessUserResults';

const SEVERITY_LABELS: Record<AccessClientFinding['severity'], string> = {
  problem: 'Problem',
  warning: 'Warning',
  tip: 'Tip',
};

/**
 * Lists setup findings worst first, each with how to fix it.
 */
export const ClientFindings: FunctionComponent<{ findings: AccessClientFinding[] }> = ({ findings }) =>
  findings.length > 0 ? (
    <ul data-testid="access-client-findings">
      {findings.map((finding) => (
        <li key={finding.id} data-severity={finding.severity}>
          <strong>{SEVERITY_LABELS[finding.severity]}:</strong> {finding.title} <em>Fix:</em> {finding.fix}
        </li>
      ))}
    </ul>
  ) : (
    <p data-testid="access-client-findings">No problems found.</p>
  );

/**
 * Shows the values an app needs to use its client. The client secret is always a placeholder.
 */
export const ClientSetupValues: FunctionComponent<{ setup: AccessClientSetupValues; secretCreatedAt?: string }> = ({
  setup,
  secretCreatedAt,
}) => (
  <details data-testid="access-client-setup">
    <summary>Values your app needs</summary>
    <dl>
      <dt>Issuer</dt>
      <dd>
        <code>{setup.issuer}</code>
      </dd>
      <dt>Token URL</dt>
      <dd>
        <code>{setup.tokenUrl}</code>
      </dd>
      {secretCreatedAt && (
        <>
          <dt>Secret created</dt>
          <dd>{formatTime(secretCreatedAt)}</dd>
        </>
      )}
    </dl>
    {setup.keycloakJs && (
      <>
        <h4>keycloak-js settings</h4>
        <pre>{JSON.stringify(setup.keycloakJs, null, 2)}</pre>
      </>
    )}
    {setup.curl && (
      <>
        <h4>Get a service account token</h4>
        <pre>{setup.curl}</pre>
        <p>Replace &lt;client-secret&gt; with the secret from the client&apos;s Credentials tab. Never share it.</p>
      </>
    )}
  </details>
);

function matchText({ allowed, matchedBy }: AccessUrlMatch): string {
  return allowed ? `Allowed (matches ${matchedBy})` : 'Not allowed';
}

/**
 * Shows whether an app address is allowed as the sign-in return address, browser origin and sign-out return
 * address, and what to add for each that is not.
 */
export const ClientUrlCheck: FunctionComponent<{ check: AccessClientUrlCheck }> = ({ check }) => {
  const { suggestions } = check;
  return (
    <div data-testid="access-client-url-check">
      <dl>
        <dt>Address</dt>
        <dd>
          <code>{check.url}</code>
        </dd>
        <dt>Sign-in return address (Valid redirect URIs)</dt>
        <dd data-allowed={check.redirect.allowed}>{matchText(check.redirect)}</dd>
        <dt>Browser origin (Web origins)</dt>
        <dd data-allowed={check.webOrigin.allowed}>{matchText(check.webOrigin)}</dd>
        <dt>Sign-out return address (Valid post logout redirect URIs)</dt>
        <dd data-allowed={check.postLogout.allowed}>{matchText(check.postLogout)}</dd>
      </dl>
      {Object.keys(suggestions).length > 0 && (
        <>
          <h4>To allow it, add</h4>
          <ul data-testid="access-client-url-suggestions">
            {suggestions.redirectUri && (
              <li>
                Valid redirect URIs: <code>{suggestions.redirectUri}</code>
              </li>
            )}
            {suggestions.webOrigin && (
              <li>
                Web origins: <code>{suggestions.webOrigin}</code>
              </li>
            )}
            {suggestions.postLogoutRedirectUri && (
              <li>
                Valid post logout redirect URIs: <code>{suggestions.postLogoutRedirectUri}</code>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
};

function formatLifetime(seconds?: number): string {
  if (seconds === undefined) {
    return 'Not returned';
  }
  return seconds % 60 === 0 ? `${seconds / 60} minutes` : `${seconds} seconds`;
}

/**
 * Shows what a token from a client would contain. Claims other than roles, audience and scopes are named only.
 */
export const TokenPreview: FunctionComponent<{ preview: AccessTokenPreview }> = ({ preview }) => (
  <div data-testid="access-token-preview">
    <dl>
      <dt>For</dt>
      <dd>{preview.subject === 'user' ? 'The person you named' : "The app's service account"}</dd>
      <dt>Meant for (audience)</dt>
      <dd>
        <ListOrNone values={preview.audience} />
      </dd>
      <dt>Lasts</dt>
      <dd>{formatLifetime(preview.lifetimeSeconds)}</dd>
      <dt>Scopes</dt>
      <dd>
        <ListOrNone values={preview.scopes} />
      </dd>
      <dt>Tenant-wide roles</dt>
      <dd>
        <ListOrNone values={preview.realmRoles} />
      </dd>
      {preview.issuer && (
        <>
          <dt>Issuer</dt>
          <dd>
            <code>{preview.issuer}</code>
          </dd>
        </>
      )}
    </dl>
    <h4>App roles in the token</h4>
    {preview.clientRoles.length > 0 ? (
      <ul data-testid="access-token-client-roles">
        {preview.clientRoles.map(({ clientId, roles }) => (
          <li key={clientId}>
            <code>{clientId}</code>: {roles.join(', ')}
          </li>
        ))}
      </ul>
    ) : (
      <p>None.</p>
    )}
    <details>
      <summary>Claim names ({preview.claimNames.length})</summary>
      <ListOrNone values={preview.claimNames} />
    </details>
    <details data-testid="access-token-mappers">
      <summary>What adds to the token ({preview.mappers.length} mappers)</summary>
      <ul>
        {preview.mappers.map((mapper) => (
          <li key={`${mapper.from}:${mapper.scope ?? ''}:${mapper.name}`}>
            {mapper.name} — {mapper.purpose ?? mapper.type},{' '}
            {mapper.from === 'client' ? 'set on the client' : `from client scope ${mapper.scope ?? ''}`}
          </li>
        ))}
      </ul>
    </details>
  </div>
);

export const ServiceAccountDetails: FunctionComponent<{ serviceAccount: AccessServiceAccount }> = ({
  serviceAccount,
}) => (
  <dl data-testid="access-service-account">
    <dt>Service account</dt>
    <dd>
      <code>{serviceAccount.username}</code>
    </dd>
    <dt>Status</dt>
    <dd>{serviceAccount.enabled === false ? 'Turned off' : 'Turned on'}</dd>
    {serviceAccount.secretCreatedAt && (
      <>
        <dt>Secret created</dt>
        <dd>{formatTime(serviceAccount.secretCreatedAt)}</dd>
      </>
    )}
  </dl>
);
