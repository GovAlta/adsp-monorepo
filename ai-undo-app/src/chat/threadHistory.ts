import { config } from '../auth/keycloak';
import type { ChatMessage, ChatMessagePart, ChatRole } from './useAgentSocket';

export const THREAD_STORAGE_KEY = 'ai-undo-app.threadId';

export interface ThreadSummary {
  id: string;
  title?: string;
  resourceId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  metadata?: Record<string, unknown>;
}

export interface ThreadsResponse {
  agent: string;
  threads: ThreadSummary[];
  total: number;
}

export interface ThreadMessagesResponse {
  agent: string;
  threadId: string;
  messages: MastraStoredMessage[];
  total: number;
  contextWindow: {
    lastMessages: number;
  };
}

export interface ThreadRollbackResponse extends ThreadMessagesResponse {
  keepThroughMessageId: string;
  deletedIds: string[];
  scrubbedMessageIds: string[];
  scrubToolResults: boolean;
}

export interface ThreadRollbackOptions {
  /** Strip tool-call/tool-result parts from kept messages (default true in this app). */
  scrubToolResults?: boolean;
  /** When scrubbing, only remove these tool names. Empty/omitted = all tools. */
  toolNames?: string[];
}

interface MastraStoredMessage {
  id: string;
  role: string;
  content: unknown;
  createdAt?: string | Date;
}

export function getStoredThreadId(): string | null {
  return localStorage.getItem(THREAD_STORAGE_KEY);
}

export function setStoredThreadId(threadId: string): void {
  localStorage.setItem(THREAD_STORAGE_KEY, threadId);
}

export function clearStoredThreadId(): void {
  localStorage.removeItem(THREAD_STORAGE_KEY);
}

export async function fetchThreads(
  getAccessToken: () => Promise<string>,
): Promise<ThreadsResponse> {
  const token = await getAccessToken();
  const url = new URL(
    `/agent/v1/agents/${encodeURIComponent(config.agentId)}/threads`,
    config.agentServiceUrl,
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to load threads (${response.status}).`);
  }

  return (await response.json()) as ThreadsResponse;
}

/**
 * Fetches persisted Mastra memory for a thread.
 * Returns null when the thread does not exist yet (404).
 */
export async function fetchThreadMessages(
  threadId: string,
  getAccessToken: () => Promise<string>,
): Promise<ThreadMessagesResponse | null> {
  const token = await getAccessToken();
  const url = new URL(
    `/agent/v1/agents/${encodeURIComponent(config.agentId)}/threads/${encodeURIComponent(threadId)}/messages`,
    config.agentServiceUrl,
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to load thread messages (${response.status}).`);
  }

  return (await response.json()) as ThreadMessagesResponse;
}

/**
 * Deletes every message in the thread from Mastra storage (including tool results in content).
 */
export async function clearThreadMessages(
  threadId: string,
  getAccessToken: () => Promise<string>,
): Promise<ThreadMessagesResponse> {
  const token = await getAccessToken();
  const url = new URL(
    `/agent/v1/agents/${encodeURIComponent(config.agentId)}/threads/${encodeURIComponent(threadId)}/messages`,
    config.agentServiceUrl,
  );

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to clear thread messages (${response.status}).`);
  }

  return (await response.json()) as ThreadMessagesResponse;
}

/**
 * Keeps messages through keepThroughMessageId and deletes everything after in Mastra storage.
 * By default also strips tool-call/tool-result parts from the kept messages.
 */
export async function rollbackThreadToMessage(
  threadId: string,
  keepThroughMessageId: string,
  getAccessToken: () => Promise<string>,
  options: ThreadRollbackOptions = { scrubToolResults: true },
): Promise<ThreadRollbackResponse> {
  const token = await getAccessToken();
  const url = new URL(
    `/agent/v1/agents/${encodeURIComponent(config.agentId)}/threads/${encodeURIComponent(threadId)}/rollback`,
    config.agentServiceUrl,
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keepThroughMessageId,
      scrubToolResults: options.scrubToolResults === true,
      ...(options.toolNames?.length ? { toolNames: options.toolNames } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to rollback thread (${response.status}).`);
  }

  return (await response.json()) as ThreadRollbackResponse;
}

export function mapStoredMessagesToChat(messages: MastraStoredMessage[]): ChatMessage[] {
  return messages
    .map(mapStoredMessage)
    .filter((message): message is ChatMessage => message !== null);
}

function mapStoredMessage(message: MastraStoredMessage): ChatMessage | null {
  const role = toChatRole(message.role);
  if (!role) {
    return null;
  }

  const parts = extractParts(message.content);
  if (parts.length === 0) {
    return null;
  }

  return {
    id: message.id,
    role,
    parts,
  };
}

function toChatRole(role: string): ChatRole | null {
  if (role === 'user' || role === 'assistant' || role === 'system') {
    return role;
  }
  return null;
}

function extractParts(content: unknown): ChatMessagePart[] {
  if (typeof content === 'string') {
    return content ? [{ type: 'text', text: content }] : [];
  }

  if (Array.isArray(content)) {
    return content.flatMap((part) => mapUnknownPart(part));
  }

  if (!content || typeof content !== 'object') {
    return [];
  }

  const record = content as Record<string, unknown>;

  // Mastra format 2 keeps the same text in both `parts` and top-level `content`.
  // Prefer parts so we don't render "hello hello".
  if (Array.isArray(record.parts)) {
    const fromParts = record.parts.flatMap((part) => mapUnknownPart(part));
    if (fromParts.length > 0) {
      return fromParts;
    }
  }

  if (typeof record.content === 'string' && record.content) {
    return [{ type: 'text', text: record.content }];
  }

  return [];
}

function mapUnknownPart(part: unknown): ChatMessagePart[] {
  if (!part || typeof part !== 'object') {
    return [];
  }

  const record = part as Record<string, unknown>;
  const type = typeof record.type === 'string' ? record.type : '';

  if (type === 'text' && typeof record.text === 'string') {
    return record.text ? [{ type: 'text', text: record.text }] : [];
  }

  if (type === 'tool-invocation' && record.toolInvocation && typeof record.toolInvocation === 'object') {
    const invocation = record.toolInvocation as Record<string, unknown>;
    const toolName = typeof invocation.toolName === 'string' ? invocation.toolName : 'tool';
    const parts: ChatMessagePart[] = [
      {
        type: 'tool-call',
        toolName,
        toolArgs: invocation.args,
      },
    ];
    if ('result' in invocation) {
      parts.push({
        type: 'tool-result',
        toolName,
        toolResult: invocation.result,
      });
    }
    return parts;
  }

  if (type === 'tool-call') {
    return [
      {
        type: 'tool-call',
        toolName: typeof record.toolName === 'string' ? record.toolName : 'tool',
        toolArgs: record.args ?? record.toolArgs,
      },
    ];
  }

  if (type === 'tool-result') {
    return [
      {
        type: 'tool-result',
        toolName: typeof record.toolName === 'string' ? record.toolName : 'tool',
        toolResult: record.result ?? record.toolResult,
      },
    ];
  }

  return [];
}
