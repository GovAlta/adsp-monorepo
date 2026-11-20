import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { DocsRepository } from '../docs/docsRepository';
import { APP_GUIDE_SOURCES, createAppQuickstartTool } from './registerAppQuickstartTool';

const REPO_ROOT = resolve(__dirname, '../../../..');

async function guide(): Promise<string> {
  const [tool] = createAppQuickstartTool();
  const result = await tool.handler({});
  return (result.content[0] as { text: string }).text;
}

function section(text: string, heading: string): string {
  const start = text.indexOf(heading);
  const next = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, next < 0 ? undefined : next);
}

describe('get_app_quickstart', () => {
  it('is an offline tool with no input, described for browser apps', () => {
    const [tool] = createAppQuickstartTool();

    expect(tool.name).toBe('get_app_quickstart');
    expect(tool.annotations).toEqual({ readOnlyHint: true, openWorldHint: false });
    expect(tool.inputSchema).toEqual({ type: 'object', properties: {} });
    expect(tool.description).toMatch(/browser/i);
    expect(tool.description).toMatch(/sign/i);
    expect(tool.description).toMatch(/real-time/i);
  });

  it('gives the token-handler pattern for signing a browser app in, not client credentials', async () => {
    const signIn = section(await guide(), '## 2.');

    expect(signIn).toContain('token-handler');
    expect(signIn).toContain('/token-handler/clients/${clientId}/auth?tenant=');
    expect(signIn).toContain('/token-handler/sessions');
    expect(signIn).toContain('/token-handler/targets/');
    expect(signIn).toContain('X-XSRF-TOKEN');
    expect(signIn).toMatch(/never .*client[_ ]credentials|client credentials.*never|not .*client[_ ]credentials/i);
    expect(signIn).not.toMatch(/client_secret\s*[:=]/);
  });

  it('names the browser-token alternative and when to choose it', async () => {
    const signIn = section(await guide(), '## 2.');

    expect(signIn).toMatch(/alternative/i);
    expect(signIn).toContain('front-end-access.md');
    expect(signIn).toMatch(/push/i);
  });

  it('gives the push-service WebSocket path with eventStreams registered first', async () => {
    const push = section(await guide(), '## 3.');

    expect(push).toContain('eventStreams');
    expect(push.indexOf('eventStreams')).toBeLessThan(push.indexOf('io('));
    expect(push).toContain('socket.io-client');
    expect(push).toContain('stream:');
    expect(push).toContain('publicSubscribe');
    expect(push).toContain('subscriberRoles');
  });

  it('says that a token-handler app holds no token for non-public streams', async () => {
    const push = section(await guide(), '## 3.');

    expect(push).toContain('holds no token');
    expect(push).toContain('public streams only');
  });

  it('subscribes to a public stream without a token, and uses a token only in the browser-token case', async () => {
    const push = section(await guide(), '## 3.');
    const calls = push.split('io(').slice(1);

    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[0].split(');')[0]).not.toContain('auth');
    expect(push.indexOf('getAccessToken')).toBeGreaterThan(push.indexOf("user's token in the browser"));
  });

  it('lists every field a stream needs and a fully qualified subscriber role', async () => {
    const push = section(await guide(), '## 3.');

    for (const field of ['`id`', '`name`', '`description`', '`events`', '`subscriberRoles`', '`publicSubscribe`']) {
      expect(push).toContain(field);
    }
    expect(push).toMatch(/urn:ads:<tenant>:<service>:<role>/);
  });

  it('sets the redirect URIs before registering the token-handler client', async () => {
    const signIn = section(await guide(), '## 2.');

    expect(signIn.indexOf('redirectUris')).toBeLessThan(signIn.indexOf('Register the client'));
    expect(signIn).toContain('registrationToken');
    expect(signIn).toContain('PUT /token-handler/v1/clients/{clientId}');
  });

  it('lists the Tenant Admin prerequisites, including directory entries and service roles', async () => {
    const checklist = section(await guide(), '## 4.');
    const [doneOnce, byBackend] = checklist.split('Done by your backend service');

    expect(doneOnce).toMatch(/Tenant Admin/);
    expect(doneOnce).toContain('Valid Redirect URIs');
    expect(doneOnce).toContain('platform:token-handler');
    expect(doneOnce).toMatch(/directory/);
    expect(doneOnce).toContain('Service roles');
    expect(byBackend).not.toMatch(/directory/);
  });

  it('marks which steps run in the browser and which need a backend', async () => {
    const where = section(await guide(), '## 1.');

    expect(where).toMatch(/browser/i);
    expect(where).toMatch(/backend/i);
    expect(where).toContain('|');
  });

  it('uses samples/chat-app as the worked example and says how its sign-in differs', async () => {
    const example = section(await guide(), '## 5.');

    expect(example).toContain('samples/chat-app');
    expect(example).toContain('samples/chat-service');
    expect(example).toMatch(/not token-handler|doesn't use token-handler|does not use token-handler/i);
  });

  it('points to the design-system MCP server instead of giving component guidance', async () => {
    const text = await guide();

    expect(text).toContain('goa-design-system');
    expect(text).not.toMatch(/<goa-[a-z-]+|GoA[A-Z][a-zA-Z]+\b/);
  });
});

describe('get_app_quickstart grounding', () => {
  it('names only doc pages that read through read_adsp_doc', async () => {
    const docs = new DocsRepository(resolve(REPO_ROOT, 'docs'));
    const text = await guide();

    expect(APP_GUIDE_SOURCES.docs.filter((path) => !docs.read(path))).toEqual([]);
    expect(APP_GUIDE_SOURCES.docs.filter((path) => !text.includes(path))).toEqual([]);
  });

  it('names only sample files that exist', async () => {
    const text = await guide();

    expect(APP_GUIDE_SOURCES.files.filter((path) => !existsSync(resolve(REPO_ROOT, path)))).toEqual([]);
    expect(APP_GUIDE_SOURCES.files.filter((path) => !text.includes(path))).toEqual([]);
  });

  it('uses token-handler configuration fields that its schema defines', async () => {
    const schema = readFileSync(resolve(REPO_ROOT, 'apps/token-handler/src/token/configuration/schema.ts'), 'utf8');
    const text = await guide();

    expect(APP_GUIDE_SOURCES.tokenHandlerFields.filter((field) => !schema.includes(`${field}:`))).toEqual([]);
    expect(APP_GUIDE_SOURCES.tokenHandlerFields.filter((field) => !text.includes(`\`${field}\``))).toEqual([]);
  });

  it('uses push stream fields that the SDK Stream type defines', async () => {
    const types = readFileSync(resolve(REPO_ROOT, 'libs/adsp-service-sdk/src/push/types.ts'), 'utf8');
    const text = await guide();

    expect(APP_GUIDE_SOURCES.streamFields.filter((field) => !types.includes(`  ${field}:`))).toEqual([]);
    expect(APP_GUIDE_SOURCES.streamFields.filter((field) => !text.includes(`\`${field}\``))).toEqual([]);
  });

  it('uses roles, paths and URNs that its source docs state', async () => {
    const docs = new DocsRepository(resolve(REPO_ROOT, 'docs'));
    const text = await guide();
    const missing = Object.entries(APP_GUIDE_SOURCES.docTerms).flatMap(([path, terms]) =>
      terms
        .filter((term) => !docs.read(path)?.content.includes(term) || !text.includes(term))
        .map((term) => ({ path, term })),
    );

    expect(missing).toEqual([]);
  });
});
