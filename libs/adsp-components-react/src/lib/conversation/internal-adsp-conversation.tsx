import { useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { type AdspComponentThemeOverrides } from '@abgov/adsp-components-core';
import { GoabCallout } from '@abgov/react-components';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';

export type AdspConversationDirection = 'sent' | 'received';

export interface AdspConversationMessage {
  id: string | number;
  direction: AdspConversationDirection;
  sender: string;
  timestamp: Date | string;
  content: string;
  canDelete?: boolean;
}

export interface AdspConversationSendEvent {
  topic: string;
  typeId?: string;
  includeNotifications: boolean;
  content: string;
  requiresAttention: boolean;
}

export interface AdspConversationProps {
  topic: string;
  typeId?: string;
  height?: string;
  includeNotifications?: boolean;
  themeOverrides?: AdspComponentThemeOverrides<'conversation'>;
  messages?: AdspConversationMessage[];
  loading?: boolean;
  error?: string;
  canSend?: boolean;
  canDelete?: boolean;
  draft?: string;
  emptyText?: string;
  sendLabel?: string;
  draftPlaceholder?: string;
  testId?: string;
  onDraftChange?: (value: string) => void;
  onSend?: (event: AdspConversationSendEvent) => void | Promise<void>;
  onDelete?: (messageId: string | number) => void | Promise<void>;
}

const SCROLL_TO_LATEST_THRESHOLD = 80;

function toTimestamp(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function isNearBottom(container: HTMLElement): boolean {
  return container.scrollHeight - container.scrollTop - container.clientHeight <= SCROLL_TO_LATEST_THRESHOLD;
}

function formatTimestamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString();
}

export function InternalAdspConversation({
  topic,
  typeId,
  height,
  includeNotifications = false,
  themeOverrides,
  messages = [],
  loading = false,
  error,
  canSend = true,
  canDelete = true,
  draft,
  emptyText = 'No messages yet.',
  sendLabel = 'Send',
  draftPlaceholder = 'Write your message...',
  testId,
  onDraftChange,
  onSend,
  onDelete,
}: AdspConversationProps) {
  const themeStyle = useAdspThemeStyle('conversation', themeOverrides);
  const [internalDraft, setInternalDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string>();
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const previousLatestMessageId = useRef<string | number | null>(null);

  const resolvedDraft = draft ?? internalDraft;
  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const timeDiff = toTimestamp(a.timestamp) - toTimestamp(b.timestamp);
        if (timeDiff !== 0) {
          return timeDiff;
        }
        return String(a.id).localeCompare(String(b.id));
      }),
    [messages],
  );

  const setDraft = (value: string) => {
    if (onDraftChange) {
      onDraftChange(value);
    } else {
      setInternalDraft(value);
    }
  };

  const scrollToLatest = () => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTop = listRef.current.scrollHeight;
    setHasNewMessages(false);
  };

  useLayoutEffect(() => {
    if (!listRef.current) {
      return;
    }

    const latestMessage = sortedMessages[sortedMessages.length - 1];
    const latestId = latestMessage?.id ?? null;
    const changed = latestId !== previousLatestMessageId.current;
    const nearBottom = isNearBottom(listRef.current);

    if (!previousLatestMessageId.current) {
      scrollToLatest();
    } else if (changed && nearBottom) {
      scrollToLatest();
    } else if (changed) {
      setHasNewMessages(true);
    }

    previousLatestMessageId.current = latestId;
  }, [sortedMessages]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!onSend || !resolvedDraft.trim() || !canSend || isSending) {
      return;
    }

    setSendError(undefined);
    setIsSending(true);
    try {
      await onSend({
        topic,
        typeId,
        includeNotifications,
        requiresAttention: includeNotifications,
        content: resolvedDraft.trim(),
      });
      setDraft('');
      scrollToLatest();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unable to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const resolvedStyle = height ? { ...themeStyle, height } : themeStyle;

  return (
    <section className="adsp-conversation" style={resolvedStyle} data-testid={testId}>
      <div className="adsp-conversation__messages" ref={listRef} role="log" aria-live="polite" aria-busy={loading}>
        {error ? (
          <p className="adsp-conversation__state" role="alert">
            {error}
          </p>
        ) : loading ? (
          <p className="adsp-conversation__state">Loading messages...</p>
        ) : sortedMessages.length ? (
          sortedMessages.map((message) => {
            const showActions = (message.canDelete ?? canDelete) && !!onDelete;

            return (
              <article key={message.id} className="adsp-conversation__message" data-direction={message.direction}>
                <div className="adsp-conversation__message-meta">
                  <strong>{message.sender}</strong> <span>{formatTimestamp(message.timestamp)}</span>
                </div>
                <div className="adsp-conversation__message-content">{message.content}</div>
                {showActions && (
                  <div className="adsp-conversation__message-actions">
                    <button
                      type="button"
                      className="adsp-conversation__action"
                      aria-label={`Delete message ${message.id}`}
                      onClick={() => void onDelete?.(message.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <p className="adsp-conversation__state">{emptyText}</p>
        )}

        {hasNewMessages && !loading && !error && (
          <div className="adsp-conversation__new-messages" role="status">
            <button type="button" className="adsp-button adsp-button--secondary" onClick={scrollToLatest}>
              New messages
            </button>
          </div>
        )}
      </div>

      <form className="adsp-conversation__composer" onSubmit={handleSend}>
        {sendError && (
          <GoabCallout type="emergency" heading="Unable to send message" mb="s" testId="adsp-conversation-send-error">
            {sendError}
          </GoabCallout>
        )}
        <label htmlFor="adsp-conversation-composer" className="adsp-conversation__state">
          Message
        </label>
        <textarea
          id="adsp-conversation-composer"
          className="adsp-conversation__composer-input"
          value={resolvedDraft}
          placeholder={draftPlaceholder}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!canSend || loading || !!error}
        />
        <div className="adsp-conversation__composer-actions">
          <button
            type="button"
            className="adsp-button adsp-button--secondary"
            onClick={() => setDraft('')}
            disabled={!resolvedDraft}
          >
            Clear
          </button>
          <button
            type="submit"
            className="adsp-button adsp-button--primary"
            disabled={!resolvedDraft.trim() || !canSend || loading || !!error || isSending}
          >
            {sendLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

export const AdspConversation = InternalAdspConversation;
