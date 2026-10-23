import { createConversationClient } from './conversationClient';

describe('conversationClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('finds the first matching topic', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 10, resourceId: 'urn:test:1' }] }),
    } as Response) as unknown as typeof fetch;

    const client = createConversationClient({
      baseUrl: 'https://comment-service',
      getAccessToken: async () => 'token',
    });

    const topic = await client.findTopic({ resourceIdEquals: 'urn:test:1' });

    expect(topic?.id).toBe(10);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/comment/v1/topics?criteria=');
  });

  it('returns null when no topic is found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response) as unknown as typeof fetch;

    const client = createConversationClient({
      baseUrl: 'https://comment-service',
      getAccessToken: async () => 'token',
    });

    await expect(client.findTopic({ resourceIdEquals: 'urn:test:none' })).resolves.toBeNull();
  });

  it('loads comments with paging options', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], page: { next: 'n1' } }),
    } as Response) as unknown as typeof fetch;

    const client = createConversationClient({
      baseUrl: 'https://comment-service',
      getAccessToken: async () => 'token',
    });

    const result = await client.getComments(11, { top: 5, after: 'a1' });

    expect(result.page?.next).toBe('n1');
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/comment/v1/topics/11/comments?top=5&after=a1');
  });

  it('loads comments with default paging when options are omitted', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], page: {} }),
    } as Response) as unknown as typeof fetch;

    const client = createConversationClient({
      baseUrl: 'https://comment-service',
      getAccessToken: async () => 'token',
    });

    await client.getComments(12);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/comment/v1/topics/12/comments?top=10');
    expect((global.fetch as jest.Mock).mock.calls[0][0]).not.toContain('after=');
  });

  it('sends and deletes comments', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({ ok: true } as Response) as unknown as typeof fetch;

    const client = createConversationClient({
      baseUrl: 'https://comment-service',
      getAccessToken: async () => 'token',
    });

    await client.addComment(11, 'hello');
    await client.deleteComment(11, 101);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('https://comment-service/comment/v1/topics/11/comments');
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toEqual(
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: 'hello', requiresAttention: false }) }),
    );
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe(
      'https://comment-service/comment/v1/topics/11/comments/101',
    );
    expect((global.fetch as jest.Mock).mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
  });

  it('throws when topic or comment requests fail', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 400 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 403 } as Response) as unknown as typeof fetch;

    const client = createConversationClient({
      baseUrl: 'https://comment-service',
      getAccessToken: async () => 'token',
    });

    await expect(client.findTopic({ resourceIdEquals: 'urn:test:1' })).rejects.toThrow(
      'Conversation request failed (500).',
    );
    await expect(client.addComment(11, 'hello')).rejects.toThrow('Unable to add comment (400).');
    await expect(client.deleteComment(11, 101)).rejects.toThrow('Unable to delete comment (403).');
  });
});
