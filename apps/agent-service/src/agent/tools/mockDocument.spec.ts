import { MASTRA_THREAD_ID_KEY } from '@mastra/core/request-context';
import { clearMockHashCache, createMockDocumentTools } from './mockDocument';

describe('createMockDocumentTools (mockHashTool)', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const requestContext = {
    get: (key: string) => (key === MASTRA_THREAD_ID_KEY ? 'thread-1' : undefined),
  };

  beforeEach(() => {
    clearMockHashCache();
  });

  it('returns a new random hash the first time, then reuses it for the same input', async () => {
    const { mockHashTool } = await createMockDocumentTools({
      logger: logger as never,
    });

    const first = await mockHashTool.execute!({ input: 'hello' }, { requestContext } as never);
    const second = await mockHashTool.execute!({ input: 'hello' }, { requestContext } as never);
    const other = await mockHashTool.execute!({ input: 'other' }, { requestContext } as never);

    expect(first.algorithm).toBe('random');
    expect(first.reused).toBe(false);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(second.reused).toBe(true);
    expect(second.hash).toBe(first.hash);
    expect(other.reused).toBe(false);
    expect(other.hash).not.toBe(first.hash);
  });

  it('returns a new hash after the thread cache is cleared', async () => {
    const { mockHashTool } = await createMockDocumentTools({
      logger: logger as never,
    });

    const first = await mockHashTool.execute!({ input: 'hello' }, { requestContext } as never);
    clearMockHashCache('thread-1');
    const afterClear = await mockHashTool.execute!({ input: 'hello' }, { requestContext } as never);

    expect(afterClear.reused).toBe(false);
    expect(afterClear.hash).not.toBe(first.hash);
  });
});
