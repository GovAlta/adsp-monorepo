import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AccessTokenPreview } from '@store/agent/model';
import {
  ClientFindings,
  ClientSetupValues,
  ClientUrlCheck,
  ServiceAccountDetails,
  TokenPreview,
} from './AccessClientCheckResults';

function definitionValue(container: HTMLElement, term: string): string | null {
  const dt = Array.from(container.querySelectorAll('dt')).find((element) => element.textContent === term);
  return dt?.nextElementSibling?.textContent ?? null;
}

describe('ClientFindings', () => {
  it('lists findings with their severity and fix', () => {
    const { getByTestId } = render(
      <ClientFindings
        findings={[
          { id: 'disabled', severity: 'problem', title: 'The client is turned off.', fix: 'Turn on Enabled.' },
          { id: 'no-pkce', severity: 'tip', title: 'PKCE is not required.', fix: 'Set it to S256.' },
        ]}
      />,
    );

    const items = Array.from(getByTestId('access-client-findings').querySelectorAll('li'));
    expect(items.map((item) => [item.dataset.severity, item.textContent])).toEqual([
      ['problem', 'Problem: The client is turned off. Fix: Turn on Enabled.'],
      ['tip', 'Tip: PKCE is not required. Fix: Set it to S256.'],
    ]);
  });

  it('says when nothing was found', () => {
    const { getByTestId } = render(<ClientFindings findings={[]} />);

    expect(getByTestId('access-client-findings')).toHaveTextContent('No problems found.');
  });
});

describe('ClientSetupValues', () => {
  it('shows keycloak-js settings and a token request with the secret as a placeholder', () => {
    const { getByTestId } = render(
      <ClientSetupValues
        setup={{
          issuer: 'https://h/auth/realms/r',
          tokenUrl: 'https://h/auth/realms/r/protocol/openid-connect/token',
          keycloakJs: { url: 'https://h/auth', realm: 'r', clientId: 'app' },
          curl: "curl ... 'client_secret=<client-secret>'",
        }}
        secretCreatedAt="2025-01-15T00:00:00.000Z"
      />,
    );

    const setup = getByTestId('access-client-setup');
    expect(setup).toHaveTextContent('"clientId": "app"');
    expect(setup).toHaveTextContent("client_secret=<client-secret>'");
    expect(setup).toHaveTextContent('Replace <client-secret> with the secret');
    expect(definitionValue(setup, 'Secret created')).toContain('2025');
  });
});

describe('ClientUrlCheck', () => {
  it('shows which settings allow the address and what to add', () => {
    const { container, getByTestId } = render(
      <ClientUrlCheck
        check={{
          url: 'https://new.alberta.ca/cb',
          origin: 'https://new.alberta.ca',
          redirect: { allowed: false },
          webOrigin: { allowed: true, matchedBy: '+' },
          postLogout: { allowed: false },
          suggestions: { redirectUri: 'https://new.alberta.ca/*', postLogoutRedirectUri: 'https://new.alberta.ca/*' },
        }}
      />,
    );

    expect(definitionValue(container, 'Sign-in return address (Valid redirect URIs)')).toBe('Not allowed');
    expect(definitionValue(container, 'Browser origin (Web origins)')).toBe('Allowed (matches +)');
    expect(getByTestId('access-client-url-suggestions')).toHaveTextContent(
      'Valid redirect URIs: https://new.alberta.ca/*Valid post logout redirect URIs: https://new.alberta.ca/*',
    );
  });

  it('shows no suggestions when everything is allowed', () => {
    const allowed = { allowed: true, matchedBy: '*' };
    const { queryByTestId } = render(
      <ClientUrlCheck
        check={{ url: 'u', origin: 'o', redirect: allowed, webOrigin: allowed, postLogout: allowed, suggestions: {} }}
      />,
    );

    expect(queryByTestId('access-client-url-suggestions')).toBeNull();
  });
});

describe('TokenPreview', () => {
  const preview: AccessTokenPreview = {
    app: 'urn:ads:demo:app',
    subject: 'user',
    scope: 'openid',
    audience: ['account', 'urn:ads:platform:tenant-service'],
    scopes: ['openid', 'profile'],
    realmRoles: ['offline_access'],
    clientRoles: [{ clientId: 'urn:ads:platform:tenant-service', roles: ['tenant-admin'] }],
    lifetimeSeconds: 300,
    allowedOrigins: [],
    claimNames: ['aud', 'email'],
    mappers: [
      { name: 'audience', type: 'oidc-audience-mapper', purpose: 'Adds an audience', from: 'client' },
      { name: 'full name', type: 'oidc-full-name-mapper', from: 'client-scope', scope: 'profile' },
    ],
  };

  it('shows audience, lifetime, roles, claim names and where each mapper comes from', () => {
    const { container, getByTestId } = render(<TokenPreview preview={preview} />);

    expect(definitionValue(container, 'For')).toBe('The person you named');
    expect(definitionValue(container, 'Meant for (audience)')).toBe('account, urn:ads:platform:tenant-service');
    expect(definitionValue(container, 'Lasts')).toBe('5 minutes');
    expect(getByTestId('access-token-client-roles')).toHaveTextContent('urn:ads:platform:tenant-service: tenant-admin');
    expect(getByTestId('access-token-mappers')).toHaveTextContent(
      'audience — Adds an audience, set on the clientfull name — oidc-full-name-mapper, from client scope profile',
    );
  });

  it('labels a service account token and an odd lifetime', () => {
    const { container } = render(
      <TokenPreview preview={{ ...preview, subject: 'service-account', lifetimeSeconds: 90 }} />,
    );

    expect(definitionValue(container, 'For')).toBe("The app's service account");
    expect(definitionValue(container, 'Lasts')).toBe('90 seconds');
  });
});

describe('ServiceAccountDetails', () => {
  it('shows the service account and when the secret was created', () => {
    const { container } = render(
      <ServiceAccountDetails
        serviceAccount={{ username: 'service-account-api', enabled: false, secretCreatedAt: '2026-01-01T00:00:00Z' }}
      />,
    );

    expect(definitionValue(container, 'Service account')).toBe('service-account-api');
    expect(definitionValue(container, 'Status')).toBe('Turned off');
    expect(definitionValue(container, 'Secret created')).toContain('2026');
  });
});
