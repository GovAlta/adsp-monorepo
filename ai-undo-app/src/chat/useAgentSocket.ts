import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { config } from '../auth/keycloak';
import {
  clearStoredThreadId,
  clearThreadMessages,
  fetchThreadMessages,
  fetchThreads,
  getStoredThreadId,
  mapStoredMessagesToChat,
  rollbackThreadToMessage,
  setStoredThreadId,
  type ThreadSummary,
} from './threadHistory';

export type ChatRole = 'user' | 'assistant' | 'system';

/** AI SDK–style status for the chat UI. */
export type ChatStatus = 'disconnected' | 'ready' | 'submitted' | 'streaming' | 'error';

export interface ChatMessagePart {
  type: 'text' | 'tool-call' | 'tool-result';
  text?: string;
  toolName?: string;
  toolArgs?: unknown;
  toolResult?: unknown;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  parts: ChatMessagePart[];
  streaming?: boolean;
}

interface UseAgentSocketArgs {
  enabled: boolean;
  getAccessToken: () => Promise<string>;
}

interface StreamPayload {
  threadId: string;
  messageId: string;
  chunk?: {
    type: string;
    payload?: {
      text?: string;
      message?: string;
      toolName?: string;
      toolCallId?: string;
      args?: unknown;
      result?: unknown;
    };
  };
  done?: boolean;
}

function textOf(message: ChatMessage): string {
  return message.parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('');
}

function createThreadId(): string {
  const threadId = uuid();
  setStoredThreadId(threadId);
  return threadId;
}

function resolveInitialThreadId(): string {
  return getStoredThreadId() || createThreadId();
}

export function useAgentSocket({ enabled, getAccessToken }: UseAgentSocketArgs) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [threadMessagesById, setThreadMessagesById] = useState<Record<string, ChatMessage[]>>({});
  const [contextWindow, setContextWindow] = useState<number | null>(null);
  const [threadId, setThreadId] = useState(resolveInitialThreadId);
  const socketRef = useRef<Socket | null>(null);
  const threadIdRef = useRef(threadId);
  const getAccessTokenRef = useRef(getAccessToken);
  const loadingHistoryRef = useRef(false);
  const loadingThreadsRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const statusRef = useRef<ChatStatus>('disconnected');

  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const status: ChatStatus = useMemo(() => {
    if (error && !connected) {
      return 'error';
    }
    if (!connected) {
      return 'disconnected';
    }
    if (messages.some((m) => m.streaming)) {
      return 'streaming';
    }
    if (awaitingReply) {
      return 'submitted';
    }
    return 'ready';
  }, [connected, error, messages, awaitingReply]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    setThreadMessagesById((prev) => ({
      ...prev,
      [threadId]: messages,
    }));
  }, [threadId, messages]);

  const loadHistory = useCallback(async (targetThreadId = threadIdRef.current) => {
    if (loadingHistoryRef.current) {
      return;
    }

    loadingHistoryRef.current = true;
    setHistoryLoading(true);
    try {
      const result = await fetchThreadMessages(targetThreadId, () => getAccessTokenRef.current());
      if (targetThreadId !== threadIdRef.current) {
        return;
      }

      if (!result) {
        setMessages([]);
        setContextWindow(null);
        setThreadMessagesById((prev) => ({ ...prev, [targetThreadId]: [] }));
        return;
      }

      const mapped = mapStoredMessagesToChat(result.messages);
      setMessages(mapped);
      setThreadMessagesById((prev) => ({ ...prev, [targetThreadId]: mapped }));
      setContextWindow(result.contextWindow.lastMessages);
      setError(null);
    } catch (err) {
      if (targetThreadId !== threadIdRef.current) {
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      loadingHistoryRef.current = false;
      setHistoryLoading(false);
    }
  }, []);

  const loadThreads = useCallback(async () => {
    if (loadingThreadsRef.current) {
      return;
    }

    loadingThreadsRef.current = true;
    setThreadsLoading(true);
    try {
      const result = await fetchThreads(() => getAccessTokenRef.current());
      const seen = new Set<string>();
      const unique = result.threads.filter((thread) => {
        if (!thread.id || seen.has(thread.id)) {
          return false;
        }
        seen.add(thread.id);
        return true;
      });
      setThreads(unique);

      const entries = await Promise.all(
        unique.map(async (thread) => {
          try {
            const history = await fetchThreadMessages(thread.id, () => getAccessTokenRef.current());
            const mapped = history ? mapStoredMessagesToChat(history.messages) : [];
            return [thread.id, mapped] as const;
          } catch {
            return [thread.id, [] as ChatMessage[]] as const;
          }
        }),
      );

      setThreadMessagesById((prev) => {
        const next = { ...prev };
        for (const [id, mapped] of entries) {
          // Keep live in-progress messages for the active thread.
          if (
            id === threadIdRef.current &&
            (statusRef.current === 'streaming' || statusRef.current === 'submitted')
          ) {
            next[id] = messagesRef.current;
          } else if (id === threadIdRef.current && messagesRef.current.length > mapped.length) {
            next[id] = messagesRef.current;
          } else {
            next[id] = mapped;
          }
        }
        return next;
      });

      // Keep the open chat panel aligned with the refreshed active thread.
      const active = entries.find(([id]) => id === threadIdRef.current);
      if (
        active &&
        statusRef.current !== 'streaming' &&
        statusRef.current !== 'submitted'
      ) {
        setMessages(active[1]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      loadingThreadsRef.current = false;
      setThreadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = io(config.agentServiceUrl, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: async (cb) => {
        try {
          const token = await getAccessTokenRef.current();
          cb({ token });
        } catch {
          cb({} as { token?: string });
        }
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      void loadHistory();
      void loadThreads();
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setAwaitingReply(false);
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setAwaitingReply(false);
      setError(err.message || 'Failed to connect to agent-service');
    });

    socket.on('session-expired', () => {
      setError('Session expired. Reconnecting…');
      socket.disconnect();
      socket.connect();
    });

    socket.on('stream', (payload: StreamPayload) => {
      const { messageId, chunk, done } = payload;
      if (chunk?.type === 'heartbeat') {
        return;
      }

      setMessages((prev) => {
        const existing = prev.find((m) => m.id === messageId);

        const upsertAssistant = (updater: (parts: ChatMessagePart[]) => ChatMessagePart[]) => {
          if (existing) {
            return prev.map((m) =>
              m.id === messageId
                ? { ...m, parts: updater(m.parts), streaming: !done }
                : m,
            );
          }
          return [
            ...prev,
            {
              id: messageId,
              role: 'assistant' as const,
              parts: updater([]),
              streaming: !done,
            },
          ];
        };

        if (chunk?.type === 'text-delta' && chunk.payload?.text) {
          setAwaitingReply(false);
          return upsertAssistant((parts) => {
            const last = parts[parts.length - 1];
            if (last?.type === 'text') {
              return [...parts.slice(0, -1), { ...last, text: (last.text || '') + chunk.payload!.text! }];
            }
            return [...parts, { type: 'text', text: chunk.payload!.text }];
          });
        }

        if (chunk?.type === 'tool-call') {
          setAwaitingReply(false);
          return upsertAssistant((parts) => [
            ...parts,
            {
              type: 'tool-call',
              toolName: chunk.payload?.toolName || 'tool',
              toolArgs: chunk.payload?.args,
            },
          ]);
        }

        if (chunk?.type === 'tool-result') {
          return upsertAssistant((parts) => [
            ...parts,
            {
              type: 'tool-result',
              toolName: chunk.payload?.toolName || 'tool',
              toolResult: chunk.payload?.result,
            },
          ]);
        }

        if (chunk?.type === 'error') {
          setAwaitingReply(false);
          const message = chunk.payload?.message || 'Agent error';
          if (existing) {
            return prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    parts: [...m.parts, { type: 'text' as const, text: message }],
                    streaming: false,
                  }
                : m,
            );
          }
          return [
            ...prev,
            { id: messageId, role: 'system', parts: [{ type: 'text', text: message }] },
          ];
        }

        if (done) {
          setAwaitingReply(false);
          if (existing) {
            return prev.map((m) => (m.id === messageId ? { ...m, streaming: false } : m));
          }
        }

        return prev;
      });

      if (done) {
        void loadThreads();
      }
    });

    socket.on('error', (err: { message?: string } | string) => {
      const message = typeof err === 'string' ? err : err.message || 'Socket error';
      setAwaitingReply(false);
      setError(message);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setAwaitingReply(false);
    };
  }, [enabled, loadHistory, loadThreads]);

  const send = useCallback((text: string) => {
    const socket = socketRef.current;
    if (!socket?.connected || !text.trim()) {
      return;
    }

    const messageId = uuid();
    const content = text.trim();

    setAwaitingReply(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: messageId, role: 'user', parts: [{ type: 'text', text: content }] },
    ]);

    setThreadMessagesById((prev) => {
      const current = prev[threadIdRef.current] || messagesRef.current;
      return {
        ...prev,
        [threadIdRef.current]: [
          ...current.filter((m) => m.id !== messageId),
          { id: messageId, role: 'user', parts: [{ type: 'text', text: content }] },
        ],
      };
    });

    // Keep a single sidebar entry for the active thread (upsert by id).
    setThreads((prev) => {
      const withoutCurrent = prev.filter((thread) => thread.id !== threadIdRef.current);
      return [
        {
          id: threadIdRef.current,
          resourceId: '',
          title: content.slice(0, 48) || 'New chat',
          updatedAt: new Date().toISOString(),
        },
        ...withoutCurrent,
      ];
    });

    socket.send({
      threadId: threadIdRef.current,
      messageId,
      agent: config.agentId,
      content: [{ type: 'text', text: content }],
      context: {},
      rawChunks: true,
    });
  }, []);

  const selectThread = useCallback(
    (nextThreadId: string) => {
      if (!nextThreadId || nextThreadId === threadIdRef.current) {
        return;
      }
      setStoredThreadId(nextThreadId);
      threadIdRef.current = nextThreadId;
      setThreadId(nextThreadId);
      setMessages([]);
      setContextWindow(null);
      setError(null);
      setAwaitingReply(false);
      void loadHistory(nextThreadId);
    },
    [loadHistory],
  );

  const clear = useCallback(() => {
    clearStoredThreadId();
    const nextThreadId = createThreadId();
    threadIdRef.current = nextThreadId;
    setThreadId(nextThreadId);
    setMessages([]);
    setContextWindow(null);
    setError(null);
    setAwaitingReply(false);
  }, []);

  const refreshHistory = useCallback(() => {
    void loadHistory();
    void loadThreads();
  }, [loadHistory, loadThreads]);

  const rollbackToMessage = useCallback(
    async (keepThroughMessageId: string) => {
      if (!keepThroughMessageId || rollbackLoading) {
        return;
      }
      if (statusRef.current === 'streaming' || statusRef.current === 'submitted') {
        setError('Wait for the current reply to finish before rolling back.');
        return;
      }

      setRollbackLoading(true);
      setError(null);
      try {
        const result = await rollbackThreadToMessage(
          threadIdRef.current,
          keepThroughMessageId,
          () => getAccessTokenRef.current(),
          { scrubToolResults: true },
        );
        const mapped = mapStoredMessagesToChat(result.messages);
        setMessages(mapped);
        setContextWindow(result.contextWindow.lastMessages);
        setThreadMessagesById((prev) => ({
          ...prev,
          [threadIdRef.current]: mapped,
        }));
        setAwaitingReply(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setRollbackLoading(false);
      }
    },
    [rollbackLoading],
  );

  const clearServerMemory = useCallback(async () => {
    if (rollbackLoading) {
      return;
    }
    if (statusRef.current === 'streaming' || statusRef.current === 'submitted') {
      setError('Wait for the current reply to finish before clearing memory.');
      return;
    }

    setRollbackLoading(true);
    setError(null);
    try {
      const result = await clearThreadMessages(threadIdRef.current, () => getAccessTokenRef.current());
      setMessages([]);
      setContextWindow(result.contextWindow.lastMessages);
      setThreadMessagesById((prev) => ({
        ...prev,
        [threadIdRef.current]: [],
      }));
      setAwaitingReply(false);
      void loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRollbackLoading(false);
    }
  }, [rollbackLoading, loadThreads]);

  return {
    connected,
    status,
    messages,
    error,
    historyLoading,
    threadsLoading,
    rollbackLoading,
    threads,
    threadMessagesById,
    contextWindow,
    agentId: config.agentId,
    agentServiceUrl: config.agentServiceUrl,
    threadId,
    send,
    clear,
    selectThread,
    refreshHistory,
    rollbackToMessage,
    clearServerMemory,
    textOf,
  };
}
