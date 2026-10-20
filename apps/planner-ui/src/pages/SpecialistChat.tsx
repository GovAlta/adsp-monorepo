/**
 * SpecialistChat — Direct multi-turn chat with an ADSP service specialist.
 *
 * Route: /sessions/:sessionId/specialists/:type
 *
 * Allows users to ask questions, get service-specific solutions and sample code,
 * refine designs, and validate solutions with the specialist agent directly.
 *
 * FAC-S5-026: specialist message content held in React state only; no localStorage writes.
 * ✓ CAS:RULE-017: content rendered via ReactMarkdown, never dangerouslySetInnerHTML.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoAContainer,
  GoAButton,
  GoAFormItem,
  GoATextArea,
  GoACircularProgress,
  GoACallout,
  GoABadge,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { SpecialistDirectMessage, SpecialistType } from '../services/api.types';

const DEFAULT_META: SpecialistType = {
  id: '',
  label: 'ADSP Specialist',
  description: 'Get expert guidance on ADSP platform services.',
  suggestions: [],
};

const SpecialistChat: React.FC = () => {
  const { sessionId, type } = useParams<{ sessionId: string; type: string }>();
  const navigate = useNavigate();
  const specialistType = type || 'form-service';

  const [meta, setMeta] = useState<SpecialistType>(DEFAULT_META);
  const [messages, setMessages] = useState<SpecialistDirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = useCallback(async () => {
    if (!sessionId) return;
    try {
      const history = await api.getSpecialistMessages(sessionId, specialistType);
      setMessages(history);
    } catch {
      // New chat — empty history is fine
    } finally {
      setLoadingHistory(false);
    }
    // Load specialist metadata separately so a missing /types endpoint never breaks the chat page
    api.getSpecialistTypes().then(({ types }) => {
      const found = types.find((t) => t.id === specialistType);
      if (found) setMeta(found);
    });
  }, [sessionId, specialistType]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading || !sessionId) return;
    setInput('');
    setError(null);
    setLoading(true);

    // Optimistically show the user message
    const optimisticUser: SpecialistDirectMessage = {
      id: `opt-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const { userMessage, assistantMessage } = await api.sendSpecialistMessage(sessionId, specialistType, content);
      // Replace the optimistic message with the confirmed one + add the reply
      setMessages((prev) => [...prev.filter((m) => m.id !== optimisticUser.id), userMessage, assistantMessage]);
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (_name: string, _value: string, key: string) => {
    if (key === 'Enter') {
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--goa-space-l)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--goa-space-m)', marginBottom: 'var(--goa-space-l)' }}>
        <GoAButton
          type="tertiary"
          leadingIcon="arrow-back"
          onClick={() => navigate(`/sessions/${sessionId}`)}
        >
          Back to Session
        </GoAButton>
        <div>
          <h2 style={{ margin: 0 }}>{meta.label}</h2>
          <p style={{ margin: 0, color: 'var(--goa-color-text-secondary)', fontSize: '0.9em' }}>
            {meta.description}
          </p>
        </div>
      </div>

      {/* Chat window */}
      <GoAContainer>
        <div
          style={{
            minHeight: 400,
            maxHeight: 560,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--goa-space-m)',
            padding: 'var(--goa-space-s)',
          }}
        >
          {loadingHistory && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--goa-space-xl)' }}>
              <GoACircularProgress variant="inline" size="small" message="Loading history…" />
            </div>
          )}

          {!loadingHistory && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--goa-space-xl)', color: 'var(--goa-color-text-secondary)' }}>
              <p>Start by asking a question or choosing a suggestion below.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '78%',
                  padding: 'var(--goa-space-s) var(--goa-space-m)',
                  borderRadius: 'var(--goa-border-radius-m)',
                  background: msg.role === 'user'
                    ? 'var(--goa-color-brand-default)'
                    : 'var(--goa-color-greyscale-100)',
                  color: msg.role === 'user' ? '#fff' : 'inherit',
                  fontSize: '0.9em',
                  lineHeight: 1.55,
                  wordBreak: 'break-word',
                }}
                className={msg.role === 'assistant' ? 'markdown-body' : undefined}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      code({ children, className, ...props }) {
                        const inline = !className;
                        return inline ? (
                          <code
                            style={{
                              background: 'var(--goa-color-greyscale-200)',
                              padding: '0.1em 0.3em',
                              borderRadius: 3,
                              fontSize: '0.92em',
                              fontFamily: 'monospace',
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre
                            style={{
                              background: '#1e1e1e',
                              color: '#d4d4d4',
                              padding: 'var(--goa-space-m)',
                              borderRadius: 'var(--goa-border-radius-m)',
                              overflowX: 'auto',
                              fontSize: '0.88em',
                              fontFamily: 'monospace',
                              margin: 'var(--goa-space-s) 0',
                            }}
                          >
                            <code {...props}>{children}</code>
                          </pre>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: 'var(--goa-space-s) var(--goa-space-m)',
                  borderRadius: 'var(--goa-border-radius-m)',
                  background: 'var(--goa-color-greyscale-100)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--goa-space-s)',
                }}
              >
                <GoACircularProgress variant="inline" size="small" />
                <span style={{ fontSize: '0.9em', color: 'var(--goa-color-text-secondary)' }}>
                  {meta.label} is thinking…
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </GoAContainer>

      {/* Error */}
      {error && (
        <GoACallout type="emergency" heading="Message failed" mt="s">
          {error}
        </GoACallout>
      )}

      {/* Suggestions (shown only when empty) */}
      {!loadingHistory && messages.length === 0 && meta.suggestions.length > 0 && (
        <div style={{ marginTop: 'var(--goa-space-m)' }}>
          <p style={{ margin: '0 0 var(--goa-space-s)', fontSize: '0.88em', color: 'var(--goa-color-text-secondary)' }}>
            Try asking:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--goa-space-s)' }}>
            {meta.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                style={{
                  background: 'none',
                  border: '1px solid var(--goa-color-greyscale-400)',
                  borderRadius: 'var(--goa-border-radius-m)',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '0.85em',
                  color: 'var(--goa-color-text-default)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{ marginTop: 'var(--goa-space-m)', display: 'flex', gap: 'var(--goa-space-s)', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <GoAFormItem label="">
            <GoATextArea
              name="specialist-input"
              value={input}
              rows={3}
              width="100%"
              placeholder={`Ask ${meta.label} anything… (Ctrl+Enter to send)`}
              onChange={(_name, value) => setInput(value)}
              onKeyPress={handleKeyPress}
            />
          </GoAFormItem>
        </div>
        <GoAButton
          type="primary"
          disabled={!input.trim() || loading}
          onClick={handleSend}
          mb="xs"
        >
          Send
        </GoAButton>
      </div>

      {/* Mode label */}
      <div style={{ marginTop: 'var(--goa-space-s)', display: 'flex', gap: 'var(--goa-space-s)', alignItems: 'center' }}>
        <GoABadge type="information" content="Direct Chat" />
        <span style={{ fontSize: '0.82em', color: 'var(--goa-color-text-secondary)' }}>
          Multi-turn conversation. Context is preserved across messages in this session.
        </span>
      </div>
    </div>
  );
};

export default SpecialistChat;
