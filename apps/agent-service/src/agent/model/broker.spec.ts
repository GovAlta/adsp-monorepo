import { RequestContext } from '@mastra/core/request-context';
import { AgentBroker } from './broker';

describe('AgentBroker', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const tenantId = {
    toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/test',
  };

  const user = {
    id: 'user-123',
    name: 'Test User',
  };

  it('adds workspace identity fields to request context', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'ok', object: null });
    const agent = {
      name: 'Test agent',
      generate,
      stream: jest.fn(),
    };
    const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

    await broker.generate(
      user as never,
      'thread-456',
      {
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      },
    );

    const options = generate.mock.calls[0][1] as { requestContext: RequestContext<Record<string, unknown>> };

    expect(options.requestContext.get('tenantId')).toBe(tenantId);
    expect(options.requestContext.get('userId')).toBe('user-123');
    expect(options.requestContext.get('threadId')).toBe('thread-456');
  });
});