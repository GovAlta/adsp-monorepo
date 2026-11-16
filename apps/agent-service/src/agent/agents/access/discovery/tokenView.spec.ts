import type { AccessClientDetails } from './clientView';
import { readSecretCreatedAt, toClientSetupValues, toTokenPreview } from './tokenView';

const claims = {
  iss: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1',
  aud: ['urn:ads:platform:tenant-service', 'account'],
  azp: 'urn:ads:platform:tenant-admin-app',
  sub: 'user-id-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  given_name: 'Jane',
  preferred_username: 'jdoe',
  scope: 'openid email profile',
  iat: 1000,
  exp: 1300,
  'allowed-origins': ['https://app.alberta.ca'],
  realm_access: { roles: ['offline_access', 'default-roles-realm-1'] },
  resource_access: {
    'urn:ads:platform:tenant-service': { roles: ['tenant-admin'] },
    account: { roles: [] },
  },
};

const mappers = [
  {
    mapperId: 'm-1',
    mapperName: 'tenant service audience',
    containerId: 'c-1',
    containerName: 'urn:ads:platform:tenant-admin-app',
    containerType: 'client',
    protocolMapper: 'oidc-audience-mapper',
  },
  {
    mapperId: 'm-2',
    mapperName: 'full name',
    containerId: 's-1',
    containerName: 'profile',
    containerType: 'client-scope',
    protocolMapper: 'oidc-full-name-mapper',
  },
  { mapperName: 'custom', containerType: 'client-scope', protocolMapper: 'my-mapper' },
];

describe('toTokenPreview', () => {
  it('copies only troubleshooting claims and lists the other claims by name', () => {
    const preview = toTokenPreview({
      app: 'urn:ads:platform:tenant-admin-app',
      subject: 'user',
      scope: 'openid',
      claims,
      mappers,
    });

    expect(preview).toEqual({
      app: 'urn:ads:platform:tenant-admin-app',
      subject: 'user',
      scope: 'openid',
      issuer: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1',
      audience: ['account', 'urn:ads:platform:tenant-service'],
      authorizedParty: 'urn:ads:platform:tenant-admin-app',
      scopes: ['email', 'openid', 'profile'],
      realmRoles: ['default-roles-realm-1', 'offline_access'],
      clientRoles: [{ clientId: 'urn:ads:platform:tenant-service', roles: ['tenant-admin'] }],
      lifetimeSeconds: 300,
      allowedOrigins: ['https://app.alberta.ca'],
      claimNames: Object.keys(claims).sort(),
      mappers: [
        { name: 'tenant service audience', type: 'oidc-audience-mapper', purpose: 'Adds an audience', from: 'client' },
        { name: 'custom', type: 'my-mapper', from: 'client-scope' },
        {
          name: 'full name',
          type: 'oidc-full-name-mapper',
          purpose: 'Adds the full name',
          from: 'client-scope',
          scope: 'profile',
        },
      ],
    });
    const values = JSON.stringify({ ...preview, claimNames: [] });
    for (const personal of ['jane@example.com', 'Jane Doe', 'user-id-1', 'jdoe']) {
      expect(values).not.toContain(personal);
    }
  });

  it('accepts a single audience and leaves out a lifetime it cannot compute', () => {
    const preview = toTokenPreview({
      app: 'a',
      subject: 'service-account',
      scope: 'openid',
      claims: { aud: 'x' },
      mappers: [],
    });

    expect(preview.audience).toEqual(['x']);
    expect(preview.lifetimeSeconds).toBeUndefined();
  });
});

describe('toClientSetupValues', () => {
  const details = (type: AccessClientDetails['type'], serviceAccounts = false) =>
    ({ clientId: 'urn:ads:demo:app', type, flows: { serviceAccounts } }) as AccessClientDetails;

  it('gives keycloak-js settings for a browser app', () => {
    expect(toClientSetupValues('https://access.adsp-dev.gov.ab.ca', 'realm-1', details('public'))).toEqual({
      issuer: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1',
      tokenUrl: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/token',
      keycloakJs: { url: 'https://access.adsp-dev.gov.ab.ca/auth', realm: 'realm-1', clientId: 'urn:ads:demo:app' },
    });
  });

  it('gives a client-credentials request with a secret placeholder for a service account', () => {
    const setup = toClientSetupValues('https://access.adsp-dev.gov.ab.ca', 'realm-1', details('confidential', true));

    expect(setup.keycloakJs).toBeUndefined();
    expect(setup.curl).toBe(
      "curl -X POST 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/token' " +
        "--data-urlencode 'grant_type=client_credentials' --data-urlencode 'client_id=urn:ads:demo:app' " +
        "--data-urlencode 'client_secret=<client-secret>'",
    );
  });

  it('gives no token request to a confidential client without a service account', () => {
    expect(toClientSetupValues('https://h.ca', 'r', details('confidential')).curl).toBeUndefined();
  });
});

describe('readSecretCreatedAt', () => {
  it('reads the creation time in seconds without reading the secret', () => {
    expect(
      readSecretCreatedAt({ secret: 'never', attributes: { 'client.secret.creation.time': '1700000000' } }),
    ).toEqual(new Date(1_700_000_000_000));
  });

  it.each([
    {},
    { attributes: { 'client.secret.creation.time': '' } },
    { attributes: { 'client.secret.creation.time': 'x' } },
  ])('returns undefined for %j', (client) => {
    expect(readSecretCreatedAt(client)).toBeUndefined();
  });
});
