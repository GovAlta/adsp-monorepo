import { execFileSync } from 'child_process';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { environment } from '../environments/environment';
import { createAdspMcpPublicClientConfig } from './configuration';

const scriptUrl = pathToFileURL(
  path.resolve(__dirname, '../../../../tools/keycloak/backfill-adsp-mcp-client.mjs'),
).href;

// The script is plain ESM run by node, so it's evaluated in a child process instead of through Jest's transform.
const evaluate = <T>(expression: string, context: Record<string, unknown> = {}): T =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import * as script from '${scriptUrl}';
         const context = JSON.parse(process.env.CONTEXT);
         const run = () => ${expression};
         try { console.log(JSON.stringify({ value: run() })); }
         catch (err) { console.log(JSON.stringify({ error: err.message })); }`,
      ],
      { encoding: 'utf8', env: { ...process.env, CONTEXT: JSON.stringify(context) } },
    ),
  );

type Client = ReturnType<typeof createAdspMcpPublicClientConfig>;
interface Plan {
  action: 'add' | 'update' | 'match';
  changes: string[];
  settingsChanged: boolean;
  missingMappers: unknown[];
  changedMappers: { id: string; config: Record<string, string> }[];
}

describe('backfill-adsp-mcp-client', () => {
  const callbackUrls = environment.MCP_SERVER_CALLBACK_URLS;
  const { id: _id, ...newRealmClient } = createAdspMcpPublicClientConfig('client-id');

  const plan = (existing: unknown) =>
    evaluate<{ value: Plan }>('script.planClient(context.existing, script.createAdspMcpClient(context.callbackUrls))', {
      existing,
      callbackUrls,
    }).value;

  // What Keycloak returns for a client created from the new-realm definition.
  const keycloakClient = (overrides: Partial<Client> = {}) => ({
    ...newRealmClient,
    id: 'adsp-mcp-uuid',
    attributes: { ...newRealmClient.attributes, 'post.logout.redirect.uris': '+' },
    protocolMappers: newRealmClient.protocolMappers.map((mapper, index) => ({
      ...mapper,
      id: `mapper-${index}`,
      config: { ...mapper.config, 'introspection.token.claim': 'true' },
    })),
    ...overrides,
  });

  it('defines the same client as a newly created realm', () => {
    const { value } = evaluate<{ value: unknown }>('script.createAdspMcpClient(context.callbackUrls)', {
      callbackUrls,
    });

    expect(value).toEqual(newRealmClient);
  });

  it('adds the client where it is missing', () => {
    const result = plan(undefined);

    expect(result.action).toBe('add');
    expect(result.missingMappers).toHaveLength(2);
  });

  it('leaves a client matching a new realm unchanged', () => {
    const result = plan(keycloakClient());

    expect(result).toEqual(
      expect.objectContaining({ action: 'match', changes: [], missingMappers: [], changedMappers: [] }),
    );
  });

  it('replaces the CS-5617 loopback redirect URIs and web origins', () => {
    const result = plan(
      keycloakClient({
        redirectUris: ['http://localhost:33419/callback', 'https://vscode.dev/redirect'],
        webOrigins: ['https://vscode.dev'],
      }),
    );

    expect(result.action).toBe('update');
    expect(result.settingsChanged).toBe(true);
    expect(result.changes).toEqual(expect.arrayContaining(['redirectUris', 'webOrigins']));
  });

  it('corrects drifted client settings', () => {
    const result = plan(
      keycloakClient({ fullScopeAllowed: true, consentRequired: false, attributes: {} as Client['attributes'] }),
    );

    expect(result.changes).toEqual(
      expect.arrayContaining(['fullScopeAllowed', 'consentRequired', 'attributes.pkce.code.challenge.method']),
    );
  });

  it('adds missing mappers and corrects drifted mapper config', () => {
    const existing = keycloakClient();
    existing.protocolMappers = [
      {
        ...existing.protocolMappers[0],
        config: { ...existing.protocolMappers[0].config, 'access.token.claim': 'false' },
      },
    ];

    const result = plan(existing);

    expect(result.changes).toEqual(['protocolMappers(+1)', 'protocolMappers(~1)']);
    expect(result.settingsChanged).toBe(false);
    expect(result.changedMappers).toEqual([
      expect.objectContaining({
        id: 'mapper-0',
        config: expect.objectContaining({ 'access.token.claim': 'true', 'introspection.token.claim': 'true' }),
      }),
    ]);
  });

  describe('parseArgs', () => {
    const parse = (argv: string[]) =>
      evaluate<{ value?: { callbackUrls: string[]; apply: boolean; clientSecret: string }; error?: string }>(
        'script.parseArgs(context.argv, { KEYCLOAK_ADMIN_CLIENT_SECRET: "secret" })',
        { argv: ['--url', 'https://access.example', '--client-id', 'admin', ...argv] },
      );

    it('reads the callback list and defaults to a dry run', () => {
      const { value } = parse([
        '--callback-urls',
        'https://mcp.example/oauth/callback, http://localhost:3000/oauth/callback',
      ]);

      expect(value).toEqual(
        expect.objectContaining({
          apply: false,
          clientSecret: 'secret',
          callbackUrls: ['https://mcp.example/oauth/callback', 'http://localhost:3000/oauth/callback'],
        }),
      );
    });

    it.each([
      ['a wildcard', 'https://mcp.example/*'],
      ['plain http off localhost', 'http://mcp.example/oauth/callback'],
      ['an invalid URL', 'not-a-url'],
    ])('rejects %s', (_case, url) => {
      expect(parse(['--callback-urls', url]).error).toMatch(/Callback URL|Invalid callback URL/);
    });

    it('requires the callback list', () => {
      expect(parse([]).error).toBe('Argument --callback-urls is required.');
    });
  });
});
