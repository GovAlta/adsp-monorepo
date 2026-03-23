import { join } from 'node:path';
import { MASTRA_THREAD_ID_KEY, RequestContext } from '@mastra/core/request-context';
import { environment } from '../../environments/environment';
import { assertWorkspaceEnvironment, createWorkspaceResolver } from './index';

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
});