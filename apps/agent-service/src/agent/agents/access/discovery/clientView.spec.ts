import { accessClientDetailsSchema, toClientDetails, toClientSummary } from './clientView';

const SENSITIVE_VALUES = [
  'super-secret-value',
  'registration-token-value',
  'rotated-secret-value',
  'private-key-value',
  'certificate-value',
  'hardcoded-claim-value',
  'script-source',
];

const keycloakClient = {
  id: 'internal-1',
  clientId: 'urn:ads:tenant:demo:web-app',
  name: 'Demo web app',
  description: 'Demo application',
  enabled: true,
  protocol: 'openid-connect',
  publicClient: false,
  bearerOnly: false,
  consentRequired: false,
  standardFlowEnabled: true,
  implicitFlowEnabled: false,
  directAccessGrantsEnabled: false,
  serviceAccountsEnabled: true,
  frontchannelLogout: true,
  fullScopeAllowed: false,
  surrogateAuthRequired: false,
  clientAuthenticatorType: 'client-secret',
  secret: 'super-secret-value',
  registrationAccessToken: 'registration-token-value',
  rootUrl: 'https://demo.alberta.ca',
  baseUrl: '/home',
  adminUrl: '',
  redirectUris: ['https://demo.alberta.ca/*', 'http://localhost:4200/*'],
  webOrigins: ['https://demo.alberta.ca', '+'],
  defaultClientScopes: ['web-origins', 'profile', 'roles', 'email'],
  optionalClientScopes: ['offline_access'],
  attributes: {
    'pkce.code.challenge.method': 'S256',
    'post.logout.redirect.uris': 'https://demo.alberta.ca/logout##+',
    'oauth2.device.authorization.grant.enabled': 'false',
    'access.token.lifespan': '300',
    'use.refresh.tokens': 'true',
    'backchannel.logout.url': 'https://demo.alberta.ca/backchannel',
    'backchannel.logout.session.required': 'true',
    'client.secret.creation.time': '1700000000',
    'client.secret.rotated': 'rotated-secret-value',
    'saml.signing.private.key': 'private-key-value',
    'jwt.credential.certificate': 'certificate-value',
  },
  protocolMappers: [
    {
      id: 'mapper-2',
      name: 'tenant claim',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-hardcoded-claim-mapper',
      config: {
        'claim.name': 'tenant',
        'claim.value': 'hardcoded-claim-value',
        'jsonType.label': 'String',
        'access.token.claim': 'true',
        'id.token.claim': 'false',
        script: 'script-source',
      },
    },
    {
      id: 'mapper-1',
      name: 'form audience',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-audience-mapper',
      config: {
        'included.client.audience': 'urn:ads:platform:form-service',
        'included.custom.audience': '',
        'access.token.claim': 'true',
        'id.token.claim': 'false',
        'introspection.token.claim': 'true',
      },
    },
  ],
  access: { view: true, configure: true, manage: true },
};

const roles = [
  { id: 'role-2', name: 'reader', description: 'Can read', composite: false, clientRole: true },
  { id: 'role-1', name: 'admin', description: '', composite: true, clientRole: true },
  { id: 'role-3', description: 'No name' },
];

const scopeMappings = {
  realmMappings: [{ id: 'realm-role-1', name: 'offline_access' }],
  clientMappings: {
    'urn:ads:platform:form-service': {
      id: 'form-service-id',
      client: 'urn:ads:platform:form-service',
      mappings: [{ name: 'form-applicant' }, { name: 'form-admin' }],
    },
    'unused-client': { id: 'unused', client: 'unused-client', mappings: [] },
  },
};

describe('toClientSummary', () => {
  it('summarizes a client for a list without its configuration or secrets', () => {
    const summary = toClientSummary(keycloakClient);

    expect(summary).toEqual({
      clientId: 'urn:ads:tenant:demo:web-app',
      name: 'Demo web app',
      description: 'Demo application',
      enabled: true,
      type: 'confidential',
      protocol: 'openid-connect',
      builtIn: false,
    });
    expect(JSON.stringify(summary)).not.toContain('super-secret-value');
  });

  it.each([
    [{ publicClient: true }, 'public'],
    [{ publicClient: false }, 'confidential'],
    [{ publicClient: false, bearerOnly: true }, 'bearer-only'],
    [{}, undefined],
  ])('derives the client type from %j', (settings, type) => {
    expect(toClientSummary({ clientId: 'client', ...settings })?.type).toBe(type);
  });

  it('marks clients Keycloak creates in every realm as built-in', () => {
    expect(toClientSummary({ clientId: 'realm-management' })?.builtIn).toBe(true);
    expect(toClientSummary({ clientId: 'urn:ads:platform:tenant-service' })?.builtIn).toBe(false);
  });

  it('leaves out settings Keycloak did not return instead of guessing them', () => {
    expect(toClientSummary({ id: 'internal-1', clientId: 'limited', description: 'Listed only' })).toEqual({
      clientId: 'limited',
      description: 'Listed only',
      name: undefined,
      enabled: undefined,
      type: undefined,
      protocol: undefined,
      builtIn: false,
    });
  });

  it('leaves out the localization key Keycloak uses as the name of a built-in client', () => {
    expect(toClientSummary({ clientId: 'account', name: '${client_account}' })).toMatchObject({
      clientId: 'account',
      name: undefined,
      builtIn: true,
    });
  });

  it('skips a representation without a client ID', () => {
    expect(toClientSummary({ id: 'internal-1' })).toBeUndefined();
  });
});

describe('toClientDetails', () => {
  const details = toClientDetails({ client: keycloakClient, roles, scopeMappings });

  it('never copies secrets, credentials, keys or hard-coded claim values', () => {
    const serialized = JSON.stringify(details);

    for (const value of SENSITIVE_VALUES) {
      expect(serialized).not.toContain(value);
    }
    expect(serialized).not.toContain('client.secret');
    expect(serialized).not.toContain('"access"');
  });

  it('matches the tool output schema', () => {
    expect(accessClientDetailsSchema.parse(details)).toEqual(details);
  });

  it('describes the client type and authentication', () => {
    expect(details).toMatchObject({
      clientId: 'urn:ads:tenant:demo:web-app',
      enabled: true,
      type: 'confidential',
      urls: { root: 'https://demo.alberta.ca', home: '/home', admin: undefined },
      authentication: {
        clientAuthentication: true,
        authenticator: 'Client ID and secret',
        consentRequired: false,
        pkceMethod: 'S256',
      },
      authorizationServicesEnabled: false,
    });
  });

  it('describes the enabled flows', () => {
    expect(details.flows).toEqual({
      standardFlow: true,
      implicitFlow: false,
      directAccessGrants: false,
      serviceAccounts: true,
      deviceAuthorizationGrant: false,
      ciba: false,
    });
  });

  it('returns redirect URIs, web origins and post-logout redirect URIs', () => {
    expect(details.redirects).toEqual({
      redirectUris: ['http://localhost:4200/*', 'https://demo.alberta.ca/*'],
      webOrigins: ['+', 'https://demo.alberta.ca'],
      postLogoutRedirectUris: ['+', 'https://demo.alberta.ca/logout'],
    });
  });

  it('returns client roles, client scopes and role scope mappings', () => {
    expect(details.roles).toEqual([
      { name: 'admin', description: undefined, composite: true },
      { name: 'reader', description: 'Can read', composite: false },
    ]);
    expect(details.scopes).toEqual({
      defaultClientScopes: ['email', 'profile', 'roles', 'web-origins'],
      optionalClientScopes: ['offline_access'],
      fullScopeAllowed: false,
      realmRoleScopeMappings: ['offline_access'],
      clientRoleScopeMappings: [{ clientId: 'urn:ads:platform:form-service', roles: ['form-admin', 'form-applicant'] }],
    });
  });

  it('returns protocol mappers with only allowlisted, readable settings', () => {
    expect(details.protocolMappers).toEqual([
      {
        name: 'form audience',
        mapperType: 'oidc-audience-mapper',
        protocol: 'openid-connect',
        settings: {
          includedClientAudience: 'urn:ads:platform:form-service',
          addToAccessToken: true,
          addToIdToken: false,
          addToIntrospection: true,
        },
      },
      {
        name: 'tenant claim',
        mapperType: 'oidc-hardcoded-claim-mapper',
        protocol: 'openid-connect',
        settings: { claimName: 'tenant', claimJsonType: 'String', addToAccessToken: true, addToIdToken: false },
      },
    ]);
  });

  it('returns token and logout settings that are set on the client', () => {
    expect(details.tokens).toEqual({
      accessTokenLifespanSeconds: 300,
      clientSessionIdleTimeoutSeconds: undefined,
      clientSessionMaxLifespanSeconds: undefined,
      useRefreshTokens: true,
      accessTokenSignatureAlgorithm: undefined,
      idTokenSignatureAlgorithm: undefined,
    });
    expect(details.logout).toEqual({
      frontChannelLogout: true,
      frontChannelLogoutUrl: undefined,
      backChannelLogoutUrl: 'https://demo.alberta.ca/backchannel',
      backChannelLogoutSessionRequired: true,
    });
  });

  it('shows the authenticator and JWKS URL only where they apply', () => {
    const publicDetails = toClientDetails({
      client: { clientId: 'public-app', publicClient: true, clientAuthenticatorType: 'client-secret' },
      roles: [],
      scopeMappings: {},
    });
    const jwtDetails = toClientDetails({
      client: {
        clientId: 'jwt-service',
        publicClient: false,
        clientAuthenticatorType: 'client-jwt',
        attributes: { 'use.jwks.url': 'true', 'jwks.url': 'https://service.alberta.ca/jwks' },
      },
      roles: [],
      scopeMappings: {},
    });

    expect(publicDetails.authentication).toMatchObject({ clientAuthentication: false, authenticator: undefined });
    expect(jwtDetails.authentication).toMatchObject({
      authenticator: 'Signed JWT',
      jwksUrl: 'https://service.alberta.ca/jwks',
    });
  });

  it('leaves out role descriptions that are Keycloak localization keys', () => {
    const builtIn = toClientDetails({
      client: { clientId: 'realm-management', bearerOnly: true },
      roles: [{ name: 'view-clients', description: '${role_view-clients}', composite: true }],
      scopeMappings: {},
    });

    expect(builtIn.roles).toEqual([{ name: 'view-clients', description: undefined, composite: true }]);
  });

  it('reports a minimal client with empty lists and no guessed settings', () => {
    const minimal = toClientDetails({ client: { clientId: 'bare' }, roles: [], scopeMappings: {} });

    expect(minimal).toMatchObject({
      clientId: 'bare',
      type: undefined,
      authentication: { clientAuthentication: undefined, consentRequired: undefined },
      flows: { standardFlow: undefined, deviceAuthorizationGrant: false, ciba: false },
      redirects: { redirectUris: [], webOrigins: [], postLogoutRedirectUris: [] },
      roles: [],
      scopes: {
        defaultClientScopes: [],
        optionalClientScopes: [],
        fullScopeAllowed: undefined,
        realmRoleScopeMappings: [],
        clientRoleScopeMappings: [],
      },
      protocolMappers: [],
      authorizationServicesEnabled: false,
    });
    expect(accessClientDetailsSchema.parse(minimal)).toEqual(minimal);
  });
});
