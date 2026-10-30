import { renderHook, act, waitFor } from '@testing-library/react';
import { useConversation } from './useConversation';
import { IConversationClient } from '@abgov/adsp-components-core';

function createClient(overrides?: Partial<IConversationClient>): IConversationClient {
  return {
    findTopic: jest.fn().mockResolvedValue({ id: 11, resourceId: 'urn:test:1' }),
    getComments: jest.fn().mockResolvedValue({
      results: [
        {
          id: 101,
          createdOn: '2026-10-15T10:00:00.000Z',
          createdBy: { id: 'u1', name: 'User One' },
          content: 'hello',
        },
      ],
      page: { next: 'n1' },
    }),
    addComment: jest.fn().mockResolvedValue(undefined),
    deleteComment: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('useConversation', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads initial messages', async () => {
    const client = createClient();

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.messages.length).toBe(1);
    });
  });

  it('loads older messages', async () => {
    const client = createClient({
      getComments: jest
        .fn()
        .mockResolvedValueOnce({
          results: [{ id: 100, createdOn: '2026-10-15T10:00:00.000Z', content: 'newest' }],
          page: { next: 'a1' },
        })
        .mockResolvedValueOnce({
          results: [{ id: 99, createdOn: '2026-10-15T09:00:00.000Z', content: 'older' }],
          page: { next: undefined },
        }),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => expect(result.current.canLoadOlder).toBe(true));

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(result.current.messages.map((m) => m.id)).toEqual(expect.arrayContaining([100, 99]));
  });

  it('stops offering older load when append returns empty results', async () => {
    const client = createClient({
      getComments: jest
        .fn()
        .mockResolvedValueOnce({
          results: [{ id: 100, createdOn: '2026-10-15T10:00:00.000Z', content: 'newest' }],
          page: { next: 'a1' },
        })
        .mockResolvedValueOnce({
          results: [],
          page: { next: 'a2' },
        }),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => expect(result.current.canLoadOlder).toBe(true));

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(result.current.canLoadOlder).toBe(false);
  });

  it('keeps older load hidden after merge refresh once end-of-history is reached', async () => {
    const client = createClient({
      getComments: jest
        .fn()
        .mockResolvedValueOnce({
          results: [{ id: 100, createdOn: '2026-10-15T10:00:00.000Z', content: 'newest' }],
          page: { next: 'a1' },
        })
        .mockResolvedValueOnce({
          results: [],
          page: { next: 'a2' },
        })
        .mockResolvedValueOnce({
          results: [{ id: 100, createdOn: '2026-10-15T10:00:00.000Z', content: 'newest' }],
          page: { next: 'a1' },
        }),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => expect(result.current.canLoadOlder).toBe(true));

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(result.current.canLoadOlder).toBe(false);

    await act(async () => {
      await result.current.send('hello');
    });

    expect(result.current.canLoadOlder).toBe(false);
  });

  it('sends and deletes messages through client', async () => {
    const client = createClient();

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.send('hi');
    });

    await act(async () => {
      await result.current.remove(101);
    });

    expect(client.addComment).toHaveBeenCalledWith(11, 'hi');
    expect(client.deleteComment).toHaveBeenCalledWith(11, 101);
  });

  it('sets an error when resourceId is missing', async () => {
    const client = createClient();

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: '',
      }),
    );

    await waitFor(() => expect(result.current.error).toBe('A resourceId is required to load the conversation topic.'));
    expect(client.findTopic).not.toHaveBeenCalled();
  });

  it('falls back to resource-only topic lookup when type lookup misses', async () => {
    const client = createClient({
      findTopic: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 12, resourceId: 'urn:test:1' }),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
        typeId: 'type-a',
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(client.findTopic).toHaveBeenCalledTimes(2);
    expect(result.current.topicId).toBe(12);
  });

  it('sets no-topic error when no topic exists', async () => {
    const client = createClient({
      findTopic: jest.fn().mockResolvedValue(null),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:none',
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('No conversation topic was found for this resource.');
    expect(result.current.messages).toEqual([]);
  });

  it('handles load failure and reports error', async () => {
    const client = createClient({
      getComments: jest.fn().mockRejectedValue(new Error('boom')),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
  });

  it('ignores send when topic is missing or content is blank', async () => {
    const client = createClient({
      findTopic: jest.fn().mockResolvedValue(null),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.send('   ');
      await result.current.send('hello');
    });

    expect(client.addComment).not.toHaveBeenCalled();
  });

  it('ignores remove when topic is missing', async () => {
    const client = createClient({
      findTopic: jest.fn().mockResolvedValue(null),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(client.deleteComment).not.toHaveBeenCalled();
  });

  it('does nothing when loadOlder cannot run', async () => {
    const client = createClient({
      getComments: jest.fn().mockResolvedValue({ results: [], page: {} }),
    });

    const { result } = renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadOlder();
    });

    expect((client.getComments as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('polls for updates when topic is loaded', async () => {
    jest.useFakeTimers();
    const client = createClient();

    renderHook(() =>
      useConversation({
        client,
        resourceId: 'urn:test:1',
        refreshIntervalMs: 50,
      }),
    );

    await waitFor(() => expect(client.getComments).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(120);
    });

    await waitFor(() => expect((client.getComments as jest.Mock).mock.calls.length).toBeGreaterThan(1));
  });
});
