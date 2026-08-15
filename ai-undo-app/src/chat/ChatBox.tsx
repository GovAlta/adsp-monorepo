import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useAgentSocket, type ChatMessage, type ChatStatus } from './useAgentSocket';
import type { ThreadSummary } from './threadHistory';

interface ChatBoxProps {
  getAccessToken: () => Promise<string>;
}

const SUGGESTIONS = [
  'Generate a checksum for "test-123"',
  'Hash the text hello world',
  'Generate a checksum for "test-123" again',
];

function statusLabel(status: ChatStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'submitted':
      return 'Thinking…';
    case 'streaming':
      return 'Streaming';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
  }
}

function threadLabel(thread: ThreadSummary): string {
  if (thread.title?.trim()) {
    const title = thread.title.trim();
    // Avoid showing the default "Thread <uuid>" twice in the UI.
    if (/^Thread [0-9a-f-]{8,}$/i.test(title)) {
      return title.slice(0, 14);
    }
    return title;
  }
  return `Chat ${thread.id.slice(0, 8)}`;
}

function formatThreadTime(value?: string | Date): string {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageParts({ message }: { message: ChatMessage }) {
  return (
    <div className="message-parts">
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div key={index} className="message-text">
              {part.text}
              {message.streaming && index === message.parts.length - 1 ? (
                <span className="cursor" aria-hidden>
                  ▍
                </span>
              ) : null}
            </div>
          );
        }
        if (part.type === 'tool-call') {
          return (
            <details key={index} className="tool-card" open>
              <summary>Tool · {part.toolName}</summary>
              <pre>{JSON.stringify(part.toolArgs ?? {}, null, 2)}</pre>
            </details>
          );
        }
        return (
          <details key={index} className="tool-card result" open>
            <summary>
              Result · {part.toolName}
              {typeof part.toolResult === 'object' && part.toolResult !== null
                ? ` · ${JSON.stringify(part.toolResult).length.toLocaleString()} chars`
                : ''}
            </summary>
            <pre>{JSON.stringify(part.toolResult ?? {}, null, 2)}</pre>
          </details>
        );
      })}
    </div>
  );
}

export function ChatBox({ getAccessToken }: ChatBoxProps) {
  const {
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
    agentId,
    agentServiceUrl,
    threadId,
    send,
    clear,
    selectThread,
    refreshHistory,
    rollbackToMessage,
    clearServerMemory,
    textOf,
  } = useAgentSocket({
    enabled: true,
    getAccessToken,
  });
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, status]);

  const canSend = connected && status !== 'submitted' && status !== 'streaming' && Boolean(draft.trim());
  const busy =
    status === 'submitted' || status === 'streaming' || historyLoading || rollbackLoading;

  const submit = () => {
    if (!canSend) {
      return;
    }
    send(draft);
    setDraft('');
    inputRef.current?.focus();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="chat" data-status={status}>
      <aside className="thread-sidebar" aria-label="Threads">
        <div className="thread-sidebar-header">
          <h3>Threads</h3>
          <button type="button" className="ghost" onClick={clear} disabled={busy}>
            New
          </button>
        </div>
        <div className="thread-list">
          {threadsLoading && threads.length === 0 ? (
            <p className="muted thread-empty">Loading threads…</p>
          ) : null}
          {!threadsLoading && threads.length === 0 ? (
            <p className="muted thread-empty">No saved threads yet.</p>
          ) : null}
          {threads.map((thread) => {
            const active = thread.id === threadId;
            const threadMessages =
              active ? messages : threadMessagesById[thread.id] || [];
            return (
              <div key={thread.id} className={`thread-block${active ? ' active' : ''}`}>
                <button
                  type="button"
                  className={`thread-item${active ? ' active' : ''}`}
                  disabled={busy && !active}
                  onClick={() => selectThread(thread.id)}
                  title={thread.id}
                >
                  <span className="thread-item-title">{threadLabel(thread)}</span>
                  <span className="thread-item-meta mono">
                    {threadMessages.length} msg
                    {formatThreadTime(thread.updatedAt || thread.createdAt)
                      ? ` · ${formatThreadTime(thread.updatedAt || thread.createdAt)}`
                      : ''}
                  </span>
                </button>
                <ul className="thread-message-list">
                  {threadMessages.length === 0 ? (
                    <li className="thread-message-empty muted">No messages yet</li>
                  ) : (
                    threadMessages.map((message) => {
                      const preview = textOf(message).trim() || (message.role === 'assistant' ? '(assistant)' : '(message)');
                      return (
                        <li key={message.id} className={`thread-message-item ${message.role}`}>
                          <span className="thread-message-role">
                            {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI' : '!'}
                          </span>
                          <span className="thread-message-text">{preview}</span>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="chat-main">
        <header className="chat-header">
          <div className="chat-title">
            <div className="agent-avatar" aria-hidden>
              AI
            </div>
            <div>
              <h2>{agentId}</h2>
              <p className="muted mono">{agentServiceUrl}</p>
            </div>
          </div>
          <div className="chat-status">
            <span className={`status-pill ${status}`}>
              <span className="dot" />
              {historyLoading ? 'Loading history…' : statusLabel(status)}
            </span>
            <button
              type="button"
              className="ghost"
              onClick={refreshHistory}
              disabled={!connected || busy}
              title="Reload threads and messages from Mastra memory"
            >
              Reload
            </button>
            <button
              type="button"
              className="ghost danger"
              disabled={!connected || busy || messages.length === 0}
              title="Delete all messages and tool results for this thread from Mastra memory"
              onClick={() => {
                const confirmed = window.confirm(
                  'Clear all backend messages for this thread? This deletes every message and tool result from memory.',
                );
                if (confirmed) {
                  void clearServerMemory();
                }
              }}
            >
              Clear memory
            </button>
            <button type="button" className="ghost" onClick={clear} disabled={busy}>
              New chat
            </button>
          </div>
        </header>

        <p className="chat-meta muted mono">
          thread {threadId}
          {contextWindow != null ? ` · context last ${contextWindow}` : null}
          {messages.length > 0 ? ` · ${messages.length} shown` : null}
        </p>

        {error ? <div className="banner error">{error}</div> : null}

        <div className="chat-messages" ref={listRef} aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h3>{historyLoading ? 'Loading conversation…' : 'Start a conversation'}</h3>
              <p className="muted">
                Pick a thread from the list or start a new chat. History loads from agent-service memory.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="suggestion"
                    disabled={!connected}
                    onClick={() => {
                      setDraft(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const canRollback = index < messages.length - 1 && !message.streaming;
              return (
                <article key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar" aria-hidden>
                    {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI' : '!'}
                  </div>
                  <div className="message-body">
                    <div className="message-role">
                      <span>
                        {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Assistant' : 'System'}
                        {message.streaming ? <span className="streaming-tag">streaming</span> : null}
                      </span>
                      {canRollback ? (
                        <button
                          type="button"
                          className="ghost rollback"
                          disabled={busy}
                          title="Delete messages after this one and strip tool results from kept history"
                          onClick={() => {
                            const confirmed = window.confirm(
                              'Roll back to this message? Everything after it will be deleted, and tool results in kept messages will be scrubbed from memory.',
                            );
                            if (confirmed) {
                              void rollbackToMessage(message.id);
                            }
                          }}
                        >
                          Rollback here
                        </button>
                      ) : null}
                    </div>
                    <MessageParts message={message} />
                  </div>
                </article>
              );
            })
          )}

          {status === 'submitted' ? (
            <article className="message assistant pending">
              <div className="message-avatar" aria-hidden>
                AI
              </div>
              <div className="message-body">
                <div className="message-role">Assistant</div>
                <div className="typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>
          ) : null}
        </div>

        <form className="prompt" onSubmit={onSubmit}>
          <div className="prompt-box">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                connected ? 'Send a message…' : 'Connect to agent-service to start chatting…'
              }
              disabled={!connected || status === 'submitted'}
              rows={1}
            />
            <button type="submit" className="send" disabled={!canSend} aria-label="Send message">
              Send
            </button>
          </div>
          <p className="prompt-hint muted">
            {status === 'streaming' || status === 'submitted'
              ? 'Waiting for the agent response…'
              : historyLoading
                ? 'Syncing with Mastra thread memory…'
                : 'Select a thread from the list · Reload refreshes server memory'}
          </p>
        </form>
      </div>
    </section>
  );
}
