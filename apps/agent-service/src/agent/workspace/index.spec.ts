import { join } from 'node:path';
import { MASTRA_THREAD_ID_KEY, RequestContext } from '@mastra/core/request-context';
import { environment } from '../../environments/environment';
import {
  assertWorkspaceEnvironment,
  clearThreadWorkspace,
  createWorkspaceResolver,
  getAgentFsDatabasePath,
} from './index';

describe('agent workspace', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const previousNodeEnv = process.env.NODE_ENV;
  const previousProvider = process.env.AGENT_WORKSPACE_PROVIDER;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = previousNodeEnv;
    process.env.AGENT_WORKSPACE_PROVIDER = previousProvider;
  });

  it('rejects unsupported providers', () => {
    process.env.AGENT_WORKSPACE_PROVIDER = 'unsupported';

    expect(() => assertWorkspaceEnvironment()).toThrow("Unsupported AGENT_WORKSPACE_PROVIDER 'unsupported'.");
  });

  it('fails fast for local provider outside development', () => {
    process.env.AGENT_WORKSPACE_PROVIDER = 'local';
    process.env.NODE_ENV = 'production';

    expect(() => assertWorkspaceEnvironment()).toThrow(
      'AGENT_WORKSPACE_PROVIDER=local is only supported when NODE_ENV=development.',
    );
  });

  it('returns undefined when workspace request context is incomplete', async () => {
    process.env.AGENT_WORKSPACE_PROVIDER = 'agentfs';
    const resolver = createWorkspaceResolver(logger as never, 'test-agent');
    const requestContext = new RequestContext<Record<string, unknown>>();

    const workspace = await resolver({ requestContext });

    expect(workspace).toBeUndefined();
  });

  it('creates a deterministic local workspace path from tenant, user, and thread', async () => {
    process.env.AGENT_WORKSPACE_PROVIDER = 'local';
    const resolver = createWorkspaceResolver(logger as never, 'test-agent');
    const requestContext = new RequestContext<Record<string, unknown>>();

    requestContext.set('tenantId', 'urn:ads:platform:tenant-service:v2:/tenants/test');
    requestContext.set('user', { id: 'user-123' });
    requestContext.set(MASTRA_THREAD_ID_KEY, 'thread-456');

    const workspace = await resolver({ requestContext });
    const basePath = (workspace?.filesystem as { basePath?: string } | undefined)?.basePath;
    const expectedBase = join(environment.AGENT_WORKSPACE_ROOT, 'local');

    expect(workspace?.filesystem?.provider).toBe('local');
    expect(basePath).toContain(expectedBase);
    // Path uses a hashed workspace ID derived from tenant:user:thread
    expect(basePath).toMatch(/workspace-[0-9a-f]{24}/);

    // Verify determinism: same inputs produce the same path
    const workspace2 = await resolver({ requestContext });
    expect((workspace2?.filesystem as { basePath?: string } | undefined)?.basePath).toBe(basePath);

    if (workspace) {
      await workspace.destroy();
    }

    if (workspace2) {
      await workspace2.destroy();
    }
  });

  it('creates a dedicated agentfs database path per workspace', () => {
    const dbPath = getAgentFsDatabasePath('workspace-1234567890abcdef12345678', environment.AGENT_WORKSPACE_ROOT);

    expect(dbPath).toContain(join(environment.AGENT_WORKSPACE_ROOT, 'agentfs'));
    expect(dbPath).toMatch(/workspace-[0-9a-f]{24}\.db$/);
  });

  it('clears all files for a thread workspace', async () => {
    process.env.AGENT_WORKSPACE_PROVIDER = 'local';
    const resolver = createWorkspaceResolver(logger as never, 'test-agent');
    const requestContext = new RequestContext<Record<string, unknown>>();

    requestContext.set('tenantId', 'urn:ads:platform:tenant-service:v2:/tenants/test');
    requestContext.set('user', { id: 'user-123' });
    requestContext.set(MASTRA_THREAD_ID_KEY, 'thread-clear-test');

    const workspace = await resolver({ requestContext });
    await workspace?.filesystem.writeFile('folder/a.txt', 'A', { recursive: true });
    await workspace?.filesystem.writeFile('b.txt', 'B', { recursive: true });
    await workspace?.destroy();

    await clearThreadWorkspace(logger as never, {
      tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
      userId: 'user-123',
      threadId: 'thread-clear-test',
    });

    const cleared = await resolver({ requestContext });
    const entries = await cleared?.filesystem.readdir('.');
    expect(entries).toEqual([]);

    await cleared?.destroy();
  });
});
