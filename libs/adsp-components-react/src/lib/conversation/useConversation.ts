import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConversationMessage,
  IConversationClient,
  mapCommentsToMessages,
  mergeConversationMessages,
} from '@abgov/adsp-components-core';

interface UseConversationOptions {
  client: IConversationClient;
  resourceId: string;
  typeId?: string;
  currentUserId?: string;
  canDelete?: boolean;
  pageSize?: number;
  refreshIntervalMs?: number;
}

interface UseConversationResult {
  topicId?: number;
  messages: ConversationMessage[];
  loading: boolean;
  loadingOlder: boolean;
  error?: string;
  reachedOldestMessage: boolean;
  canLoadOlder: boolean;
  reload: () => Promise<void>;
  loadOlder: () => Promise<void>;
  send: (content: string) => Promise<void>;
  remove: (messageId: string | number) => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_REFRESH_MS = 5000;

export function useConversation({
  client,
  resourceId,
  typeId,
  currentUserId,
  canDelete = true,
  pageSize = DEFAULT_PAGE_SIZE,
  refreshIntervalMs = DEFAULT_REFRESH_MS,
}: UseConversationOptions): UseConversationResult {
  const [topicId, setTopicId] = useState<number | undefined>();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [nextAfter, setNextAfter] = useState<string | undefined>();
  const [reachedOldestMessage, setReachedOldestMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string>();
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (mode: 'replace' | 'merge' | 'append' = 'replace', after?: string) => {
      if (!resourceId) {
        setTopicId(undefined);
        setMessages([]);
        setNextAfter(undefined);
        setReachedOldestMessage(false);
        setError('A resourceId is required to load the conversation topic.');
        return;
      }

      const requestId = ++requestIdRef.current;
      if (mode === 'replace') {
        setLoading(true);
      }

      try {
        setError(undefined);

        let topic = typeId
          ? await client.findTopic({ resourceIdEquals: resourceId, typeIdEquals: typeId })
          : await client.findTopic({ resourceIdEquals: resourceId });

        if (!topic && typeId) {
          topic = await client.findTopic({ resourceIdEquals: resourceId });
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!topic) {
          setTopicId(undefined);
          setMessages([]);
          setNextAfter(undefined);
          setReachedOldestMessage(false);
          setError('No conversation topic was found for this resource.');
          return;
        }

        setTopicId(topic.id);

        const comments = await client.getComments(topic.id, { top: pageSize, after });

        if (requestId !== requestIdRef.current) {
          return;
        }

        const mapped = mapCommentsToMessages(comments.results || [], currentUserId, canDelete);

        if (mode === 'replace') {
          setMessages(mapped);
          setNextAfter(comments.page?.next || undefined);
          setReachedOldestMessage(false);
        } else if (mode === 'append') {
          setMessages((previous) => mergeConversationMessages(previous, mapped));
          // Some backends can still emit a next cursor with an empty page; treat this as end-of-history.
          if (mapped.length === 0) {
            setNextAfter(undefined);
            setReachedOldestMessage(true);
          } else {
            setNextAfter(comments.page?.next || undefined);
            setReachedOldestMessage(false);
          }
        } else {
          setMessages((previous) => mergeConversationMessages(previous, mapped));
          // Keep older-page cursor stable during merge/poll refreshes so end-of-history stays respected.
        }
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Unable to load conversation.');
        }
      } finally {
        if (requestId === requestIdRef.current && mode === 'replace') {
          setLoading(false);
        }
      }
    },
    [canDelete, client, currentUserId, pageSize, resourceId, typeId],
  );

  const reload = useCallback(async () => {
    await load('replace');
  }, [load]);

  const loadOlder = useCallback(async () => {
    if (!topicId || !nextAfter || loadingOlder) {
      return;
    }

    setLoadingOlder(true);
    try {
      await load('append', nextAfter);
    } finally {
      setLoadingOlder(false);
    }
  }, [load, loadingOlder, nextAfter, topicId]);

  const send = useCallback(
    async (content: string) => {
      if (!topicId || !content.trim()) {
        return;
      }

      await client.addComment(topicId, content.trim());
      await load('merge');
    },
    [client, load, topicId],
  );

  const remove = useCallback(
    async (messageId: string | number) => {
      if (!topicId) {
        return;
      }

      await client.deleteComment(topicId, messageId);
      setMessages((previous) => previous.filter((message) => String(message.id) !== String(messageId)));
      await load('merge');
    },
    [client, load, topicId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!topicId) {
      return;
    }

    const id = window.setInterval(() => {
      void load('merge');
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [load, refreshIntervalMs, topicId]);

  return {
    topicId,
    messages,
    loading,
    loadingOlder,
    error,
    reachedOldestMessage,
    canLoadOlder: !!nextAfter && !reachedOldestMessage,
    reload,
    loadOlder,
    send,
    remove,
  };
}
