import { checkClientSetup, checkClientUrl, ClientSetupFacts, matchRedirectUri, matchWebOrigin } from './clientChecks';
import type { AccessClientDetails } from './clientView';

type Overrides = {
  [K in keyof AccessClientDetails]?: AccessClientDetails[K] extends object
    ? Partial<AccessClientDetails[K]>
    : AccessClientDetails[K];
};

function client(overrides: Overrides = {}): AccessClientDetails {
  const base: AccessClientDetails = {
    clientId: 'urn:ads:demo:web-app',
    enabled: true,
    type: 'public',
    builtIn: false,
    origin: 'tenant',
    urls: {},
    authentication: { pkceMethod: 'S256' },
    flows: {
      standardFlow: true,
      implicitFlow: false,
      directAccessGrants: false,
      serviceAccounts: false,
      deviceAuthorizationGrant: false,
      ciba: false,
    },
    redirects: {
      redirectUris: ['https://app.alberta.ca/*'],
      webOrigins: ['+'],
      postLogoutRedirectUris: ['+'],
    },
    roles: [],
    scopes: {
      defaultClientScopes: [],
      optionalClientScopes: [],
      realmRoleScopeMappings: [],
      clientRoleScopeMappings: [],
    },
    protocolMappers: [],
    tokens: {},
    logout: {},
    authorizationServicesEnabled: false,
  };
  return {
    ...base,
    ...overrides,
    urls: { ...base.urls, ...overrides.urls },
    authentication: { ...base.authentication, ...overrides.authentication },
    flows: { ...base.flows, ...overrides.flows },
    redirects: { ...base.redirects, ...overrides.redirects },
  } as AccessClientDetails;
}

function findingIds(facts: Partial<ClientSetupFacts> & { client: AccessClientDetails }): string[] {
  return checkClientSetup({ environmentId: 'dev', ...facts }).map((finding) => finding.id);
}

describe('checkClientSetup', () => {
  it('finds nothing wrong with a well set-up browser app', () => {
    expect(findingIds({ client: client() })).toEqual([]);
  });

  it('does not check Keycloak built-in clients', () => {
    expect(findingIds({ client: client({ builtIn: true, enabled: false }) })).toEqual([]);
  });

  it('lists problems before warnings before tips', () => {
    const findings = checkClientSetup({
      environmentId: 'dev',
      client: client({
        enabled: false,
        authentication: { pkceMethod: undefined },
        redirects: { redirectUris: ['https://app.alberta.ca/*'], webOrigins: [] },
      }),
    });

    expect(findings.map(({ id, severity }) => [id, severity])).toEqual([
      ['disabled', 'problem'],
      ['no-web-origins', 'warning'],
      ['no-pkce', 'tip'],
    ]);
    expect(findings[0].fix).toBe("Turn on Enabled in the client's settings.");
  });

  it.each([
    [{ redirects: { redirectUris: ['*'] } }, 'wildcard-redirect'],
    [{ redirects: { redirectUris: ['https://*.alberta.ca/*'] } }, 'misplaced-wildcard'],
    [{ redirects: { redirectUris: ['/callback'] } }, 'relative-without-root'],
    [{ redirects: { redirectUris: ['http://app.alberta.ca/*'] } }, 'http-redirect'],
    [{ redirects: { redirectUris: [] } }, 'no-redirect-uris'],
    [{ redirects: { webOrigins: ['*'] } }, 'wildcard-web-origin'],
    [{ redirects: { postLogoutRedirectUris: [] } }, 'no-post-logout-uris'],
    [{ flows: { standardFlow: false } }, 'no-standard-flow'],
    [{ flows: { implicitFlow: true } }, 'implicit-flow'],
    [{ flows: { directAccessGrants: true } }, 'direct-access-grants'],
  ] as Array<[Overrides, string]>)('flags %j as %s', (overrides, id) => {
    expect(findingIds({ client: client(overrides) })).toContain(id);
  });

  it('allows http for localhost, and localhost itself in Development only', () => {
    const local = client({ redirects: { redirectUris: ['http://localhost:4200/*'] } });

    expect(findingIds({ client: local })).toEqual([]);
    expect(findingIds({ client: local, environmentId: 'prod' })).toEqual(['localhost-redirect']);
  });

  it('accepts a relative redirect URI when the client has a root URL', () => {
    const relative = client({ urls: { root: 'https://app.alberta.ca' }, redirects: { redirectUris: ['/callback'] } });

    expect(findingIds({ client: relative })).toEqual([]);
  });

  describe('confidential clients', () => {
    const service = client({
      type: 'confidential',
      flows: { standardFlow: false, serviceAccounts: true },
      redirects: { redirectUris: [], webOrigins: [], postLogoutRedirectUris: [] },
    });
    const now = new Date('2026-11-06T00:00:00Z');

    it('finds nothing wrong with a service account that has roles and a recent secret', () => {
      expect(
        findingIds({ client: service, serviceAccountClientRoleCount: 2, secretCreatedAt: new Date('2026-06-01'), now }),
      ).toEqual([]);
    });

    it('warns when the service account has no service roles', () => {
      expect(findingIds({ client: service, serviceAccountClientRoleCount: 0 })).toEqual(['service-account-no-roles']);
    });

    it('suggests rotating a secret older than a year', () => {
      const findings = checkClientSetup({
        environmentId: 'dev',
        client: service,
        secretCreatedAt: new Date('2025-01-15T00:00:00Z'),
        now,
      });

      expect(findings).toEqual([expect.objectContaining({ id: 'old-secret', severity: 'tip' })]);
      expect(findings[0].title).toContain('2025-01-15');
    });

    it('warns when no way to get a token is on', () => {
      expect(
        findingIds({ client: client({ ...service, flows: { standardFlow: false, serviceAccounts: false } }) }),
      ).toEqual(['no-flows']);
    });
  });
});

describe('matchRedirectUri', () => {
  it.each([
    [['https://app.alberta.ca/callback'], 'https://app.alberta.ca/callback', 'https://app.alberta.ca/callback'],
    [['https://app.alberta.ca/callback'], 'https://app.alberta.ca/callback/', undefined],
    [['https://app.alberta.ca/*'], 'https://app.alberta.ca/a/b?x=1#y', 'https://app.alberta.ca/*'],
    [['https://app.alberta.ca/*'], 'https://app.alberta.ca', 'https://app.alberta.ca/*'],
    [['https://app.alberta.ca/*'], 'https://app.alberta.ca.evil.com/', undefined],
    [['https://app.alberta.ca/cb?x=*'], 'https://app.alberta.ca/cb?x=1', undefined],
    [['*'], 'https://anything.example/', '*'],
    [['http://localhost/*'], 'http://localhost:4200/login', 'http://localhost/*'],
    [['http://localhost:3000/*'], 'http://localhost:4200/login', undefined],
  ])('matches %j against %s', (patterns, url, expected) => {
    expect(matchRedirectUri(patterns, url)).toBe(expected);
  });

  it('completes relative patterns with the root URL', () => {
    expect(matchRedirectUri(['/app/*'], 'https://host.ca/app/x', 'https://host.ca/')).toBe('/app/*');
    expect(matchRedirectUri(['/app/*'], 'https://host.ca/app/x')).toBeUndefined();
  });
});

describe('matchWebOrigin', () => {
  it.each([
    [['*'], [], 'https://any.ca', '*'],
    [['+'], ['https://app.alberta.ca/*'], 'https://app.alberta.ca', '+'],
    [['+'], ['https://app.alberta.ca/*'], 'https://other.alberta.ca', undefined],
    [['https://app.alberta.ca/'], [], 'https://app.alberta.ca', 'https://app.alberta.ca/'],
    [[], [], 'https://app.alberta.ca', undefined],
  ])('matches %j (redirects %j) against %s', (origins, redirects, origin, expected) => {
    expect(matchWebOrigin(origins, redirects, origin)).toBe(expected);
  });
});

describe('checkClientUrl', () => {
  it('says which checks allow the address', () => {
    expect(checkClientUrl(client(), new URL('https://app.alberta.ca/callback'))).toEqual({
      url: 'https://app.alberta.ca/callback',
      origin: 'https://app.alberta.ca',
      redirect: { allowed: true, matchedBy: 'https://app.alberta.ca/*' },
      webOrigin: { allowed: true, matchedBy: '+' },
      postLogout: { allowed: true, matchedBy: 'https://app.alberta.ca/*' },
      suggestions: {},
    });
  });

  it('suggests the entries to add when the address is not allowed', () => {
    const result = checkClientUrl(client(), new URL('https://new.alberta.ca/signin'));

    expect(result.suggestions).toEqual({
      redirectUri: 'https://new.alberta.ca/*',
      webOrigin: 'https://new.alberta.ca',
      postLogoutRedirectUri: 'https://new.alberta.ca/*',
    });
  });

  it('suggests + for sign-out when sign-in already allows the address', () => {
    const result = checkClientUrl(
      client({ redirects: { postLogoutRedirectUris: [] } }),
      new URL('https://app.alberta.ca/'),
    );

    expect(result.postLogout.allowed).toBe(false);
    expect(result.suggestions).toEqual({ postLogoutRedirectUri: '+' });
  });
});
