import { createAccessToolRunner, getAccessToolRequest } from './accessToolSupport';

const tenantId = { toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1' };
const user = { id: 'user-1', token: { bearer: 'user-token' } };

function contextFor(values: Record<string, unknown>) {
  return { requestContext: { get: (key: string) => values[key] } } as never;
}

describe('getAccessToolRequest', () => {
  it('reads the user and tenant from the request context', () => {
    expect(getAccessToolRequest(contextFor({ user, tenantId }))).toEqual({
      user,
      tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1',
    });
  });

  it('returns no user or tenant without a request context', () => {
    expect(getAccessToolRequest(undefined as never)).toEqual({ user: undefined, tenantId: undefined });
  });
});

describe('createAccessToolRunner', () => {
  const logger = { info: jest.fn(), warn: jest.fn() };
  const run = createAccessToolRunner({ logger: logger as never, logContext: 'TestTools', toolKind: 'Test tool' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs the tool for the requesting user and logs the outcome without the token', async () => {
    const execute = jest.fn().mockResolvedValue({ status: 'available', environment: { id: 'dev' } });

    const result = await run('testTool', contextFor({ user, tenantId }), execute);

    expect(execute).toHaveBeenCalledWith(user);
    expect(result).toEqual({ status: 'available', environment: { id: 'dev' } });
    expect(logger.info).toHaveBeenCalledWith("Test tool 'testTool' completed with status 'available'.", {
      context: 'TestTools',
      tenant: 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1',
      user: 'user-1',
      environment: 'dev',
      reason: undefined,
    });
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('user-token');
  });

  it('logs and rethrows failures', async () => {
    const error = new Error('broken');

    await expect(run('testTool', contextFor({ user, tenantId }), jest.fn().mockRejectedValue(error))).rejects.toBe(
      error,
    );
    expect(logger.warn).toHaveBeenCalledWith("Test tool 'testTool' failed: broken", {
      context: 'TestTools',
      tenant: 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1',
      user: 'user-1',
    });
  });
});
