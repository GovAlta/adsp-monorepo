/**
 * PlanningSession — pageId: planning-session, pageType: wizard
 *
 * Two-column planning session interface.
 * Left column: chat interface with Planning Agent (INT-001 STUB — Send disabled).
 * Right column: session context, business model confidence badge, specialist status.
 *
 * FAC-S5-024: Message content NOT appended to URL query strings.
 * FAC-S5-025: userId/tenantId not rendered in client UI.
 * FAC-S5-026: No Protected B data (message content, business model, hypothesis) written to
 *   localStorage, sessionStorage, or document.cookie — in-memory React state only.
 * ✓ ASVS:V-8.3.1 — conversationMessage.content held in React state only.
 * ✓ CAS:RULE-017 — message content rendered as text content, never dangerouslySetInnerHTML.
 * ✓ ASVS:V-9.1.1 — JWT sourced from Keycloak context, not localStorage.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoAContainer,
  GoAButton,
  GoAFormItem,
  GoATextArea,
  GoACallout,
  GoACircularProgress,
  GoABadge,
} from '@abgov/react-components';
import { api } from '../services/api';
import type {
  PlanningSession as PlanningSessionType,
  ConversationMessage,
  BusinessModel,
} from '../services/api.types';
import IntegrationPendingBanner from '../components/IntegrationPendingBanner';
import ConfidenceBadge from '../components/ConfidenceBadge';

/** Set to false when the Anthropic integration (INT-001) is active. */
const INT_001_IS_STUB = false;

const STEP_LABELS = ['Describe Problem', 'Review Model', 'Review Hypothesis', 'Export'];
const CURRENT_STEP = 0; // planning-session is step 1 (index 0)

type ErrorKind = 'llm-unavailable' | 'rate-limit' | 'rate-limit-warning' | 'session-not-found' | 'generic' | null;

interface ErrorState {
  kind: ErrorKind;
  retryAfter?: number;
  message?: string;
}

const SPECIALIST_LIST = [
  { serviceId: 'form-service', label: 'Form Service Specialist', intId: 'INT-003' },
  { serviceId: 'pdf-service', label: 'PDF Service Specialist', intId: 'INT-004' },
  { serviceId: 'comment-service', label: 'Comment Service Specialist', intId: 'INT-005' },
  { serviceId: 'notification-service', label: 'Notification Service Specialist', intId: 'INT-006' },
];

type SpecialistStatus = 'available' | 'pending' | 'ready' | 'error';
interface SpecialistState {
  status: SpecialistStatus;
  requestId?: string;
  response?: string;
}

const PlanningSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // ✓ ASVS:V-8.3.1 — in-memory state only for Protected B content
  // FAC-S5-026 — no localStorage/sessionStorage writes for any of these values
  const [sessionData, setSessionData] = useState<PlanningSessionType | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [businessModel, setBusinessModel] = useState<BusinessModel | null>(null);
  const [specialists, setSpecialists] = useState<Record<string, SpecialistState>>(
    Object.fromEntries(SPECIALIST_LIST.map((s) => [s.serviceId, { status: 'available' }]))
  );
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorState, setErrorState] = useState<ErrorState>({ kind: null });
  const [markdownMode, setMarkdownMode] = useState(true);

  const messageEndRef = useRef<HTMLDivElement>(null);

  const isResumingSession = sessionData?.lastResumedAt != null;
  const isIdleSession = (() => {
    if (!sessionData) return false;
    const lastActivity = sessionData.lastResumedAt ?? sessionData.createdAt;
    return Date.now() - new Date(lastActivity).getTime() > 7 * 24 * 60 * 60 * 1000;
  })();

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessionData = useCallback(async () => {
    if (!sessionId) return;
    setPageLoading(true);
    try {
      // ✓ ASVS:V-9.1.1 — auth header injected by api service layer
      const [session, msgResult, model] = await Promise.all([
        api.getSession(sessionId),
        api.listMessages(sessionId, { page: 1, pageSize: 50 }),
        api.getBusinessModel(sessionId),
      ]);
      setSessionData(session);
      setMessages(msgResult.items);
      setBusinessModel(model);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 404) {
        setErrorState({ kind: 'session-not-found' });
        setTimeout(() => navigate('/sessions'), 3000);
      } else {
        setErrorState({ kind: 'generic', message: 'Unable to load session data.' });
      }
    } finally {
      setPageLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  const handleSendMessage = async () => {
    // FAC-S5-024: msg content submitted in POST request body, NOT URL query string.
    // ✓ ASVS:V-8.3.1 — msg is in React state, not localStorage.
    if (INT_001_IS_STUB || !msg.trim() || !sessionId) return;

    const trimmed = msg.trim();
    // Optimistically add user message to conversation immediately
    const optimisticUserMsg: ConversationMessage = {
      id: `tmp-${Date.now()}`,
      sessionId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setMsg('');

    setLoading(true);
    setErrorState({ kind: null });
    try {
      const response = await api.sendMessage(sessionId, { content: trimmed });
      // ✓ CAS:RULE-017 — message content rendered as text, not innerHTML
      setMessages((prev) => [...prev, response]);
      // Refresh business model after every AI exchange — confidence and concepts update server-side
      api.getBusinessModel(sessionId).then((m) => { if (m) setBusinessModel(m); }).catch(() => {});
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      const headers = (err as { headers?: Record<string, string> }).headers;
      if (status === 503) {
        setErrorState({ kind: 'llm-unavailable' });
      } else if (status === 429) {
        const retryAfter = headers ? parseInt(headers['retry-after'] ?? '60', 10) : 60;
        setErrorState({ kind: 'rate-limit', retryAfter });
      } else {
        setErrorState({ kind: 'generic', message: 'Unable to send message. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConsultSpecialist = async (serviceId: string) => {
    if (!sessionId) return;
    setSpecialists((prev) => ({ ...prev, [serviceId]: { status: 'pending' } }));
    try {
      const req = await api.requestSpecialistConsultation(sessionId, { specialistType: serviceId });
      // Poll for response — specialist AI may take a few seconds
      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const result = await api.getSpecialistResponse(sessionId, req.id);
          if (result.status === 'complete' && result.response) {
            setSpecialists((prev) => ({ ...prev, [serviceId]: { status: 'ready', requestId: req.id, response: result.response ?? undefined } }));
          } else if (result.status === 'error') {
            setSpecialists((prev) => ({ ...prev, [serviceId]: { status: 'error' } }));
          } else if (attempts < 60) {
            setTimeout(poll, 3000);
          } else {
            setSpecialists((prev) => ({ ...prev, [serviceId]: { status: 'error' } }));
          }
        } catch {
          setSpecialists((prev) => ({ ...prev, [serviceId]: { status: 'error' } }));
        }
      };
      setTimeout(poll, 3000);
    } catch {
      setSpecialists((prev) => ({ ...prev, [serviceId]: { status: 'error' } }));
    }
  };

  const handleSaveAndExit = async () => {
    if (!sessionId || !sessionData) {
      navigate('/sessions');
      return;
    }
    try {
      if (sessionData.status === 'active') {
        await api.updateSession(sessionId, { status: 'paused' });
      }
    } finally {
      navigate('/sessions');
    }
  };

  // Step progress indicator — custom div[role="progressbar"] per design-system.json note
  const StepProgress = () => (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={STEP_LABELS.length}
      aria-valuenow={CURRENT_STEP + 1}
      aria-label={`Step ${CURRENT_STEP + 1} of ${STEP_LABELS.length}: ${STEP_LABELS[CURRENT_STEP]}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--goa-space-s)',
        marginBottom: 'var(--goa-space-l)',
      }}
    >
      {STEP_LABELS.map((label, idx) => (
        <React.Fragment key={label}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--goa-space-xs)',
            }}
          >
            <div
              aria-current={idx === CURRENT_STEP ? 'step' : undefined}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor:
                  idx === CURRENT_STEP
                    ? 'var(--goa-color-interactive-default)'
                    : idx < CURRENT_STEP
                    ? 'var(--goa-color-status-success)'
                    : 'var(--goa-color-greyscale-200)',
                color: idx <= CURRENT_STEP ? 'var(--goa-color-greyscale-white)' : 'var(--goa-color-text-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--goa-font-family-sans)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {idx + 1}
            </div>
            <span
              style={{
                fontFamily: 'var(--goa-font-family-sans)',
                fontWeight: idx === CURRENT_STEP ? 600 : 400,
                color:
                  idx === CURRENT_STEP
                    ? 'var(--goa-color-text-default)'
                    : 'var(--goa-color-text-secondary)',
              }}
            >
              {label}
            </span>
          </div>
          {idx < STEP_LABELS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: '2px',
                backgroundColor:
                  idx < CURRENT_STEP
                    ? 'var(--goa-color-status-success)'
                    : 'var(--goa-color-greyscale-200)',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  if (pageLoading) {
    return (
      <GoAContainer>
        <GoACircularProgress variant="inline" message="Loading session..." />
      </GoAContainer>
    );
  }

  if (errorState.kind === 'session-not-found') {
    return (
      <GoAContainer>
        <GoACallout type="emergency" heading="Session not found">
          This planning session could not be found or is no longer accessible. You will be returned to
          your session list.
        </GoACallout>
      </GoAContainer>
    );
  }

  return (
    <GoAContainer>
      {/* Step progress */}
      <h1>{sessionData?.title ?? 'Planning Session'}</h1>
      <StepProgress />

      {/* Context summary — shown on re-entry */}
      {isResumingSession && sessionData && (
        <GoACallout type="information" heading="Welcome back">
          <p>You are resuming a previous planning session.</p>
          <ul>
            <li><strong>Session:</strong> {sessionData.title}</li>
            <li>
              <strong>Last active:</strong>{' '}
              {new Date(sessionData.updatedAt).toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </li>
            {businessModel && (
              <li>
                <strong>Business model:</strong> {businessModel.confidenceScore}% confidence —{' '}
                {businessModel.concepts?.length ?? 0} concepts identified
              </li>
            )}
          </ul>
        </GoACallout>
      )}

      {/* Stale session (idle > 7 days) */}
      {isIdleSession && (
        <GoACallout type="important" heading="Extended context recap">
          This session has been idle for more than 7 days. The Planning Agent will provide a detailed
          recap of all prior decisions and open questions when messaging is enabled.
        </GoACallout>
      )}

      {/* Two-column layout */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--goa-space-l)',
          alignItems: 'flex-start',
        }}
      >
        {/* === Left column — chat interface === */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <h2>Describe your business problem</h2>
          <p>
            Type your message in the field below. The Planning Agent will ask clarifying questions and
            build a structured business model as you describe your situation.
          </p>

          {/* INT-001 Stub notice — only shown when integration is deferred */}
          {INT_001_IS_STUB && <IntegrationPendingBanner intId="INT-001" />}

          {/* Error states */}
          {errorState.kind === 'llm-unavailable' && (
            <GoACallout type="emergency" heading="Planning Agent temporarily unavailable">
              The AI Planning Agent could not process your message at this time. Your message has been
              preserved. Please try again in a few minutes.
            </GoACallout>
          )}
          {errorState.kind === 'rate-limit' && (
            <GoACallout type="emergency" heading="Request limit reached">
              You have reached the maximum number of Planning Agent requests for this hour. The limit
              resets in {errorState.retryAfter ?? 60} seconds. Please wait before sending additional
              messages.
            </GoACallout>
          )}
          {errorState.kind === 'rate-limit-warning' && (
            <GoACallout type="important" heading="Approaching request limit">
              You have used 80% of your Planning Agent request allocation for this hour. Consider
              summarising your next message to make the most of your remaining requests.
            </GoACallout>
          )}
          {errorState.kind === 'generic' && errorState.message && (
            <GoACallout type="emergency" heading="Error">
              {errorState.message}
            </GoACallout>
          )}

          {/* Message history */}
          <div
            role="log"
            aria-live="polite"
            aria-label="Conversation history"
            style={{
              border: '1px solid var(--goa-color-greyscale-200)',
              borderRadius: '4px',
              padding: 'var(--goa-space-m)',
              minHeight: '200px',
              maxHeight: '420px',
              overflowY: 'auto',
              marginBottom: 'var(--goa-space-m)',
              backgroundColor: 'var(--goa-color-greyscale-100)',
            }}
          >
            {messages.length === 0 ? (
              <p style={{ color: 'var(--goa-color-text-secondary)', fontStyle: 'italic' }}>
                Your conversation will appear here as you describe your business problem and the
                Planning Agent responds.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: 'var(--goa-space-s)',
                    padding: 'var(--goa-space-s)',
                    backgroundColor:
                      message.role === 'user'
                        ? 'var(--goa-color-greyscale-white)'
                        : 'var(--goa-color-info-light)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 'var(--goa-space-xs)' }}>
                    {message.role === 'user' ? 'You' : 'Planning Agent'}
                  </div>
                  {/* ✓ CAS:RULE-017 — rendered as text content, NOT dangerouslySetInnerHTML */}
                  {/* ✓ ASVS:V-8.3.1 — message.content in React state only, no localStorage write */}
                  {message.role === 'assistant' && markdownMode ? (
                    <div className="markdown-body" style={{ wordBreak: 'break-word' }}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--goa-color-text-secondary)', marginTop: 'var(--goa-space-xs)' }}>
                    {new Date(message.createdAt).toLocaleTimeString('en-CA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Message input — Enter sends, Shift+Enter inserts newline */}
          <GoAFormItem label="Your message" helpText="Press Enter to send · Shift+Enter for new line">
            <div onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!INT_001_IS_STUB && msg.trim() && !loading && sessionId) handleSendMessage();
              }
            }}>
              <GoATextArea
                name="message"
                value={msg}
                placeholder="Describe your business problem or answer the agent's question..."
                maxCount={10000}
                disabled={INT_001_IS_STUB}
                onChange={(_name: string, value: string) => setMsg(value)}
              />
            </div>
          </GoAFormItem>

          <div style={{ marginTop: 'var(--goa-space-m)', display: 'flex', gap: 'var(--goa-space-m)', alignItems: 'center', flexWrap: 'wrap' }}>
            <GoAButton
              type="primary"
              disabled={INT_001_IS_STUB || loading || !msg.trim()}
              onClick={handleSendMessage}
            >
              Send Message
            </GoAButton>
            <GoAButton
              type="tertiary"
              size="compact"
              onClick={() => setMarkdownMode((v) => !v)}
            >
              {markdownMode ? 'View Plain Text' : 'View Formatted'}
            </GoAButton>
          </div>

          {loading && <GoACircularProgress variant="inline" message="Sending..." />}
        </div>

        {/* === Right column — session context sidebar === */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          {/* Session details card */}
          <GoAContainer>
            <h3>Session Details</h3>
            {sessionData && (
              <>
                {/* Session title — not a Protected B field per content-spec; display directly */}
                <p><strong>Session:</strong> {sessionData.title}</p>
                {/* Status badge */}
                <div style={{ marginBottom: 'var(--goa-space-s)' }}>
                  <GoABadge
                    type={
                      sessionData.status === 'active'
                        ? 'success'
                        : sessionData.status === 'paused'
                        ? 'important'
                        : 'midtone'
                    }
                    content={sessionData.status.charAt(0).toUpperCase() + sessionData.status.slice(1)}
                  />
                </div>
                {/* NOTE: userId and tenantId are NOT rendered here (FAC-S5-025) */}
              </>
            )}
          </GoAContainer>

          {/* Business model status card */}
          <GoAContainer>
            <h3>Business Model</h3>
            <p>
              The Planning Agent builds your business model from your conversation. It shows the actors,
              goals, activities, and constraints identified so far.
            </p>
            {businessModel ? (
              <>
                <div style={{ marginBottom: 'var(--goa-space-s)' }}>
                  <strong>Confidence: </strong>
                  <ConfidenceBadge score={businessModel.confidenceScore} showLabel />
                </div>
                {businessModel.confidenceScore >= 70 ? (
                  <GoACallout type="information" heading="">
                    A solution hypothesis has been generated. Review the hypothesis to see recommended
                    ADSP services.
                  </GoACallout>
                ) : businessModel.confidenceScore > 0 ? (
                  <GoACallout type="information" heading="Business model incomplete">
                    Confidence is below the threshold needed for hypothesis generation (69%). Continue
                    the conversation to provide more context.
                  </GoACallout>
                ) : (
                  <GoACallout type="information" heading="Business model incomplete">
                    The business model does not yet have enough information to generate a hypothesis.
                    Continue describing your business problem to help the agent understand your situation.
                  </GoACallout>
                )}
                <GoAButton
                  type="secondary"
                  onClick={() => navigate(`/sessions/${sessionId}/business-model`)}
                  mt="s"
                >
                  Review Business Model
                </GoAButton>
              </>
            ) : (
              <p style={{ color: 'var(--goa-color-text-secondary)' }}>
                Business model data is not yet available.
              </p>
            )}
          </GoAContainer>

          {/* Specialist consultation panel */}
          <GoAContainer>
            <h3>Specialist Consultation</h3>
            <p>
              Consult specialist agents for deep technical guidance on each ADSP service.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {SPECIALIST_LIST.map((specialist) => {
                const state = specialists[specialist.serviceId] ?? { status: 'available' };
                return (
                  <li
                    key={specialist.serviceId}
                    style={{
                      padding: 'var(--goa-space-s) 0',
                      borderBottom: '1px solid var(--goa-color-greyscale-200)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{specialist.label}</span>
                      {state.status === 'available' && (
                        <GoAButton type="tertiary" size="compact" onClick={() => handleConsultSpecialist(specialist.serviceId)}>
                          Consult
                        </GoAButton>
                      )}
                      {state.status === 'pending' && (
                        <GoABadge type="information" content="Consulting…" />
                      )}
                      {state.status === 'ready' && (
                        <GoABadge type="success" content="Ready" />
                      )}
                      {state.status === 'error' && (
                        <GoABadge type="emergency" content="Error" />
                      )}
                    </div>
                    {state.status === 'ready' && state.response && (
                      <div style={{
                        marginTop: 'var(--goa-space-s)',
                        padding: 'var(--goa-space-s)',
                        background: 'var(--goa-color-greyscale-100)',
                        borderRadius: 'var(--goa-border-radius-m)',
                        fontSize: '0.9em',
                        wordBreak: 'break-word',
                      }} className="markdown-body">
                        <ReactMarkdown>{state.response}</ReactMarkdown>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </GoAContainer>
        </div>
      </div>

      {/* Step navigation */}
      <div style={{ display: 'flex', gap: 'var(--goa-space-m)', marginTop: 'var(--goa-space-xl)', flexWrap: 'wrap' }}>
        <GoAButton
          type="secondary"
          onClick={() => navigate('/sessions')}
        >
          Back to Session List
        </GoAButton>
        <GoAButton
          type="primary"
          onClick={() => sessionId && navigate(`/sessions/${sessionId}/business-model`)}
        >
          Review Business Model
        </GoAButton>
        <GoAButton
          type="tertiary"
          onClick={handleSaveAndExit}
        >
          Save and Exit
        </GoAButton>
        <GoAButton
          type="tertiary"
          onClick={() => window.print()}
        >
          Save as PDF
        </GoAButton>
      </div>
    </GoAContainer>
  );
};

export default PlanningSession;
